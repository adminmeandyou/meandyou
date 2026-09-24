-- =====================================================================
-- MeAndYou: migrations pendentes (montado em 24/09/2026)
-- Rodar INTEIRO de uma vez no Supabase > SQL Editor > New query > Run
-- Tudo é idempotente nas tabelas (IF NOT EXISTS); rodar só uma vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PARTE 1: pagamentos AbacatePay (sem isso o plano não ativa após pagar)
-- ---------------------------------------------------------------------
-- 1. Tabela payments
CREATE TABLE IF NOT EXISTS payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('subscription','fichas','camarote')),
  gateway_id   text UNIQUE,
  method       text NOT NULL CHECK (method IN ('pix','credit_card')),
  amount       numeric(10,2) NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  metadata     jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  paid_at      timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE: feito apenas via service_role no backend (sem policy necessaria)

-- 2. Renomear coluna na tabela subscriptions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cakto_order_id'
  ) THEN
    ALTER TABLE subscriptions RENAME COLUMN cakto_order_id TO gateway_order_id;
  END IF;
END $$;

-- 3. Adicionar coluna cycle
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cycle text DEFAULT 'monthly'
  CHECK (cycle IN ('monthly','quarterly','semiannual','annual'));

-- 4. Index para idempotencia no webhook
CREATE INDEX IF NOT EXISTS payments_gateway_id_idx ON payments(gateway_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);


-- ---------------------------------------------------------------------
-- PARTE 2: notificações in-app
-- ---------------------------------------------------------------------
-- Migration: tabela notifications (nunca existia no banco — bug encontrado em QA 05/08)
-- Usada por: /api/notificacoes, /lib/push.ts, /api/amigos/*, /api/auth/deletar-conta
-- Sem essa tabela, GET /api/notificacoes retorna 500 e nenhuma notificação in-app funciona

CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL,
  from_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  read         boolean     NOT NULL DEFAULT false,
  data         jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user     ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_nudge_cooldown ON public.notifications(user_id, from_user_id, type, created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuário só vê/edita as próprias notificações. INSERT/DELETE feitos via service_role no backend.
CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- PARTE 3: amigos (chat, presentes, avaliações)
-- ---------------------------------------------------------------------
-- Rodar no SQL Editor do Supabase
-- Tabelas novas para o sistema de amigos

-- Mensagens de amigos (somem após 30 dias via pg_cron)
CREATE TABLE IF NOT EXISTS friend_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (char_length(content) <= 500),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friend_messages_friendship ON friend_messages(friendship_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_messages_created   ON friend_messages(created_at);

ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own friend messages" ON friend_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.id = friend_messages.friendship_id
        AND (f.requester_id = auth.uid() OR f.receiver_id = auth.uid())
        AND f.status = 'accepted'
    )
  );

-- Presentes entre amigos
CREATE TABLE IF NOT EXISTS friend_gifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type     text NOT NULL,
  item_amount   int  NOT NULL CHECK (item_amount >= 1 AND item_amount <= 30),
  message       text,
  sent_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friend_gifts_friendship ON friend_gifts(friendship_id, sent_at DESC);

ALTER TABLE friend_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friend gifts" ON friend_gifts
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Avaliações entre amigos (1 por par de amizade por usuário)
CREATE TABLE IF NOT EXISTS friend_ratings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  rater_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        int  NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(friendship_id, rater_id)
);

ALTER TABLE friend_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friend ratings" ON friend_ratings
  FOR SELECT USING (rater_id = auth.uid() OR rated_id = auth.uid());


-- Realtime no chat de amigos (mensagem aparece na hora para o outro lado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friend_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_messages;
  END IF;
END $$;

-- Limpeza diária de mensagens de amigos com mais de 30 dias.
-- Só agenda se a extensão pg_cron estiver ligada (Database > Extensions).
-- Se não estiver, nada quebra: a API já esconde mensagens com mais de 30 dias.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-old-friend-messages',
      '0 4 * * *',
      $cron$ DELETE FROM public.friend_messages WHERE created_at < now() - interval '30 days' $cron$
    );
  END IF;
END $$;

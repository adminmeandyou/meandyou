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

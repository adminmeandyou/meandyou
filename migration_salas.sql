-- Migration: Salas de Bate-papo
-- Tabelas: chat_rooms, room_members, room_messages, room_profile_requests, room_chat_requests, room_blocks

-- ─── chat_rooms ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'black')),
  description text,
  emoji       text NOT NULL DEFAULT '💬',
  max_members integer NOT NULL DEFAULT 30,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Qualquer usuario autenticado pode listar salas ativas
CREATE POLICY "chat_rooms_select" ON public.chat_rooms
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Apenas service role cria/atualiza salas (via API)
CREATE POLICY "chat_rooms_insert_service" ON public.chat_rooms
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "chat_rooms_update_service" ON public.chat_rooms
  FOR UPDATE TO service_role USING (true);

-- ─── room_members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id   uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname  text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados podem ver membros de qualquer sala
CREATE POLICY "room_members_select" ON public.room_members
  FOR SELECT TO authenticated USING (true);

-- Apenas service role insere/remove membros (via API /salas/entrar)
CREATE POLICY "room_members_insert_service" ON public.room_members
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "room_members_delete_service" ON public.room_members
  FOR DELETE TO service_role USING (true);

-- Usuario pode sair da propria sala (delete pelo proprio user_id)
CREATE POLICY "room_members_delete_self" ON public.room_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ─── room_messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname   text NOT NULL,
  content    text NOT NULL,
  is_system  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados podem ler mensagens
CREATE POLICY "room_messages_select" ON public.room_messages
  FOR SELECT TO authenticated USING (true);

-- Membro da sala pode inserir mensagem (verifica se e membro)
CREATE POLICY "room_messages_insert_member" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_id = room_messages.room_id
        AND user_id = auth.uid()
    )
  );

-- Service role pode inserir mensagens de sistema
CREATE POLICY "room_messages_insert_service" ON public.room_messages
  FOR INSERT TO service_role WITH CHECK (true);

-- ─── room_profile_requests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_profile_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_profile_requests ENABLE ROW LEVEL SECURITY;

-- Usuario ve solicitacoes onde e solicitante ou alvo
CREATE POLICY "room_profile_requests_select" ON public.room_profile_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_id = auth.uid());

-- Qualquer membro autenticado pode criar solicitacao
CREATE POLICY "room_profile_requests_insert" ON public.room_profile_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

-- Alvo pode atualizar status (aceitar/rejeitar)
CREATE POLICY "room_profile_requests_update" ON public.room_profile_requests
  FOR UPDATE TO authenticated USING (target_id = auth.uid());

-- ─── room_chat_requests ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_chat_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_chat_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_chat_requests_select" ON public.room_chat_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "room_chat_requests_insert" ON public.room_chat_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "room_chat_requests_update" ON public.room_chat_requests
  FOR UPDATE TO authenticated USING (target_id = auth.uid());

-- ─── room_blocks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, blocker_id, blocked_id)
);

ALTER TABLE public.room_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_blocks_select" ON public.room_blocks
  FOR SELECT TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "room_blocks_insert" ON public.room_blocks
  FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());

-- ─── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_profile_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_chat_requests;

-- ─── Salas padrao (publicas e black) ──────────────────────────────────────────
INSERT INTO public.chat_rooms (name, type, description, emoji, max_members) VALUES
  ('Papo Geral',       'public', 'Um lugar pra todo mundo',              '💬', 30),
  ('Jogos & Diversao', 'public', 'Gamers e amantes de jogos',            '🎮', 30),
  ('Musica',           'public', 'Compartilhe o que esta ouvindo',       '🎵', 30),
  ('Esportes',         'public', 'Futebol, academia, corrida e mais',    '⚽', 30),
  ('Series & Filmes',  'public', 'Dicas, spoilers e recomendacoes',      '🎬', 30),
  ('Viagens',          'public', 'Destinos, dicas e experiencias',       '✈️', 30),
  ('Black Lounge',     'black',  'Sala exclusiva para membros Black',    '👑', 20),
  ('Black Social',     'black',  'Rede privada dos membros Black',       '🖤', 20)
ON CONFLICT DO NOTHING;

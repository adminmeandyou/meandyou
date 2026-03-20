-- migration_m2_salas.sql
-- Tabelas para o sistema de Salas de Bate-papo (M2)
-- Rodar no SQL Editor do Supabase

-- ─── Salas de bate-papo ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'public', -- 'public' | 'private' | 'black'
  description text,
  emoji       text DEFAULT '💬',
  max_members int  NOT NULL DEFAULT 20,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ─── Membros de cada sala (com nickname fantasia) ─────────────────────────────
CREATE TABLE IF NOT EXISTS room_members (
  room_id   uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL,
  nickname  text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- ─── Mensagens das salas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_messages (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id   uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  nickname  text NOT NULL,
  content   text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─── Solicitações de ver perfil na sala ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_profile_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id      uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  target_id    uuid NOT NULL,
  status       text DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at   timestamptz DEFAULT now(),
  expires_at   timestamptz DEFAULT (now() + interval '3 minutes')
);

-- ─── Solicitações de chat privado na sala ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_chat_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id      uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  target_id    uuid NOT NULL,
  status       text DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at   timestamptz DEFAULT now(),
  expires_at   timestamptz DEFAULT (now() + interval '3 minutes')
);

-- ─── Bloqueios dentro de sala ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_blocks (
  room_id    uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, blocker_id, blocked_id)
);

-- ─── Índices de performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id  ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_requests_target  ON room_profile_requests(target_id, status);
CREATE INDEX IF NOT EXISTS idx_room_chat_req_target  ON room_chat_requests(target_id, status);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE chat_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_profile_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_chat_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_blocks         ENABLE ROW LEVEL SECURITY;

-- chat_rooms: todos podem ver salas ativas
CREATE POLICY "rooms_select_all" ON chat_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "rooms_insert_own" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

-- room_members: ver todos na sala, inserir e deletar o proprio
CREATE POLICY "members_select_all"  ON room_members FOR SELECT USING (true);
CREATE POLICY "members_insert_own"  ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete_own"  ON room_members FOR DELETE USING (auth.uid() = user_id);

-- room_messages: ver todas, inserir proprias
CREATE POLICY "messages_select_all"  ON room_messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_own"  ON room_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- room_profile_requests
CREATE POLICY "pr_select" ON room_profile_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "pr_insert" ON room_profile_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "pr_update" ON room_profile_requests FOR UPDATE USING (auth.uid() = target_id);

-- room_chat_requests
CREATE POLICY "cr_select" ON room_chat_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "cr_insert" ON room_chat_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "cr_update" ON room_chat_requests FOR UPDATE USING (auth.uid() = target_id);

-- room_blocks
CREATE POLICY "blocks_select" ON room_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert" ON room_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON room_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- ─── Salas públicas padrão (Bate-papo 1 ao 20) ────────────────────────────────
INSERT INTO chat_rooms (name, type, description, emoji, max_members) VALUES
  ('Bate-papo 1',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 2',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 3',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 4',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 5',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 6',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 7',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 8',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 9',  'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 10', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 11', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 12', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 13', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 14', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 15', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 16', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 17', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 18', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 19', 'public', 'Sala de bate-papo geral', '💬', 20),
  ('Bate-papo 20', 'public', 'Sala de bate-papo geral', '💬', 20),
  -- Salas Black exclusivas
  ('Black Lounge', 'black', 'Sala exclusiva para assinantes Black', '✨', 20),
  ('Black VIP',    'black', 'Networking Black premium',              '🔥', 20)
ON CONFLICT DO NOTHING;

-- ─── Ativar Realtime nas tabelas das salas ────────────────────────────────────
-- Rodar no SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_profile_requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_chat_requests;

-- migration_m3_m4_casal_amigos.sql
-- Tabelas para Perfil de Casal (M3) e Sistema de Amigos (M4)
-- Rodar no SQL Editor do Supabase

-- ─── M3: Perfis de casal (Black) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_profiles (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status     text DEFAULT 'pending', -- 'pending' | 'active' | 'dissolved'
  invite_token text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_couple_user1 ON couple_profiles(user1_id, status);
CREATE INDEX IF NOT EXISTS idx_couple_user2 ON couple_profiles(user2_id, status);

ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple_select" ON couple_profiles
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "couple_insert" ON couple_profiles
  FOR INSERT WITH CHECK (auth.uid() = user1_id);
CREATE POLICY "couple_update" ON couple_profiles
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Coluna na tabela profiles para indicar que tem perfil de casal ativo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS couple_id uuid REFERENCES couple_profiles(id) ON DELETE SET NULL;

-- ─── M4: Sistema de amigos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status       text DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver  ON friendships(receiver_id, status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_select" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "friends_insert" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friends_update" ON friendships
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "friends_delete" ON friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- ─── Ativar Realtime ──────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

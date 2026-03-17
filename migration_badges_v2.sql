-- migration_badges_v2.sql
-- Estende a tabela badges existente com campos para o sistema de emblemas gerenciável

ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS requirement_description TEXT,
  ADD COLUMN IF NOT EXISTS condition_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS condition_value JSONB,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Garante que user_badges existe com a estrutura correta
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_condition_type ON badges(condition_type);
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active);

-- RLS: apenas admins gerenciam badges; leitura pública para badges publicados
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_read_published" ON badges;
CREATE POLICY "badges_read_published" ON badges
  FOR SELECT USING (is_published = true OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "user_badges_read_own" ON user_badges;
CREATE POLICY "user_badges_read_own" ON user_badges
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- View para contagem de usuários por emblema (usada no admin)
CREATE OR REPLACE VIEW badge_user_counts AS
  SELECT badge_id, COUNT(*) AS user_count
  FROM user_badges
  GROUP BY badge_id;

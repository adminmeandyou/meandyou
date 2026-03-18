-- Migration: Sistema de XP e Niveis
-- Rodar no Supabase SQL Editor

-- 1. Adicionar colunas de XP no profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_level      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_bonus_until TIMESTAMPTZ;

-- 2. Tabela de log de eventos XP
CREATE TABLE IF NOT EXISTS xp_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  xp_amount   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_events_user_id_idx ON xp_events(user_id);

-- 3. RLS
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios podem ver proprios eventos xp"
  ON xp_events FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Funcao para conceder XP com calculo automatico de nivel
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id    UUID,
  p_event_type TEXT,
  p_base_xp    INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_multiplier NUMERIC := 1;
  v_xp         INTEGER;
  v_new_total  INTEGER;
  v_new_level  INTEGER;
BEGIN
  -- Verificar bonus ativo
  SELECT CASE WHEN xp_bonus_until > now() THEN 2 ELSE 1 END
  INTO v_multiplier
  FROM profiles WHERE id = p_user_id;

  v_xp := p_base_xp * v_multiplier;

  -- Atualizar XP
  UPDATE profiles
  SET xp = xp + v_xp
  WHERE id = p_user_id
  RETURNING xp INTO v_new_total;

  -- Calcular nivel: 0→1: 5k, 1→2: 10k, 2→3: 25k, 3→4: 50k, 4→5: 100k
  v_new_level := CASE
    WHEN v_new_total >= 100000 THEN 5
    WHEN v_new_total >= 50000  THEN 4
    WHEN v_new_total >= 25000  THEN 3
    WHEN v_new_total >= 10000  THEN 2
    WHEN v_new_total >= 5000   THEN 1
    ELSE 0
  END;

  UPDATE profiles SET xp_level = v_new_level WHERE id = p_user_id;

  -- Registrar evento
  INSERT INTO xp_events (user_id, event_type, xp_amount)
  VALUES (p_user_id, p_event_type, v_xp);

  RETURN v_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

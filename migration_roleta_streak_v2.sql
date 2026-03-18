-- ============================================================
-- MeAndYou — Migration: Roleta + Streak v2
-- Funções: spin_roleta, claim_streak_reward,
--          update_daily_streak, extend_streak_calendar
-- Correções: RLS profiles UPDATE, tabelas de saldo
-- ============================================================
-- Rodar completo no Supabase SQL Editor
-- ============================================================


-- ============================================================
-- BLOCO 1: Tabelas de saldo (criar se não existirem)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_tickets (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_superlikes (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_boosts (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_lupas (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewinds (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roleta_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type   TEXT NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 1,
  was_jackpot   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roleta_history_user_date_idx
  ON roleta_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS streak_calendar (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number    INTEGER NOT NULL,
  reward_type   TEXT NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 1,
  claimed       BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, day_number)
);

CREATE TABLE IF NOT EXISTS daily_streaks (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_login_date  DATE
);


-- ============================================================
-- BLOCO 2: RLS para tabelas de saldo
-- ============================================================

ALTER TABLE user_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_superlikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lupas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewinds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE roleta_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_tickets_own"    ON user_tickets;
DROP POLICY IF EXISTS "user_superlikes_own" ON user_superlikes;
DROP POLICY IF EXISTS "user_boosts_own"     ON user_boosts;
DROP POLICY IF EXISTS "user_lupas_own"      ON user_lupas;
DROP POLICY IF EXISTS "user_rewinds_own"    ON user_rewinds;
DROP POLICY IF EXISTS "roleta_history_own"  ON roleta_history;
DROP POLICY IF EXISTS "streak_calendar_own" ON streak_calendar;
DROP POLICY IF EXISTS "daily_streaks_own"   ON daily_streaks;

CREATE POLICY "user_tickets_own"    ON user_tickets    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_superlikes_own" ON user_superlikes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_boosts_own"     ON user_boosts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_lupas_own"      ON user_lupas      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_rewinds_own"    ON user_rewinds    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "roleta_history_own"  ON roleta_history  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "streak_calendar_own" ON streak_calendar FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "daily_streaks_own"   ON daily_streaks   FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- BLOCO 3: RLS profiles — política de UPDATE (corrige toggles)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Garante que usuário pode atualizar o próprio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================================
-- BLOCO 4: Função auxiliar — creditar item ao saldo
-- ============================================================

CREATE OR REPLACE FUNCTION _credit_item(
  p_user_id    UUID,
  p_type       TEXT,
  p_amount     INTEGER
) RETURNS void AS $$
BEGIN
  IF p_type = 'ticket' THEN
    INSERT INTO user_tickets (user_id, amount, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET amount = user_tickets.amount + p_amount, updated_at = NOW();

  ELSIF p_type = 'supercurtida' THEN
    INSERT INTO user_superlikes (user_id, amount, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET amount = user_superlikes.amount + p_amount, updated_at = NOW();

  ELSIF p_type = 'boost' THEN
    INSERT INTO user_boosts (user_id, amount, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET amount = user_boosts.amount + p_amount, updated_at = NOW();

  ELSIF p_type = 'lupa' THEN
    INSERT INTO user_lupas (user_id, amount, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET amount = user_lupas.amount + p_amount, updated_at = NOW();

  ELSIF p_type = 'rewind' THEN
    INSERT INTO user_rewinds (user_id, amount, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET amount = user_rewinds.amount + p_amount, updated_at = NOW();

  ELSIF p_type = 'invisivel_1d' THEN
    -- Ativa modo invisível por 24 horas
    UPDATE profiles
      SET incognito_until = GREATEST(COALESCE(incognito_until, NOW()), NOW()) + INTERVAL '24 hours'
    WHERE id = p_user_id;

  ELSIF p_type IN ('plan_plus_1d', 'plan_black_1d') THEN
    -- Registra upgrade temporário de plano
    -- plan_plus_1d  → plan_override = 'plus',  expira em 24h
    -- plan_black_1d → plan_override = 'black', expira em 24h
    UPDATE profiles
      SET plan_override       = CASE WHEN p_type = 'plan_black_1d' THEN 'black' ELSE 'plus' END,
          plan_override_until = NOW() + INTERVAL '24 hours'
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 5: Colunas de override de plano em profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_override       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_override_until TIMESTAMPTZ;


-- ============================================================
-- BLOCO 6: Função spin_roleta
-- ============================================================

CREATE OR REPLACE FUNCTION spin_roleta(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_tickets      INTEGER;
  v_spins_today  INTEGER;
  v_daily_limit  INTEGER;
  v_plan         TEXT;
  v_roll         NUMERIC;
  v_type         TEXT;
  v_amount       INTEGER;
  v_jackpot      BOOLEAN := FALSE;
  v_today        TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  -- Segurança: só o próprio usuário pode girar
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;

  -- Verificar saldo de tickets
  SELECT COALESCE(amount, 0) INTO v_tickets
  FROM user_tickets WHERE user_id = p_user_id;

  IF v_tickets < 1 THEN
    RETURN jsonb_build_object('error', 'no_tickets');
  END IF;

  -- Verificar limite diário baseado no plano
  SELECT COALESCE(plan, 'essencial') INTO v_plan
  FROM users WHERE id = p_user_id;

  v_daily_limit := CASE v_plan
    WHEN 'black' THEN 3
    WHEN 'plus'  THEN 2
    ELSE 1
  END;

  SELECT COUNT(*) INTO v_spins_today
  FROM roleta_history
  WHERE user_id = p_user_id
    AND created_at >= (v_today || 'T00:00:00')::TIMESTAMPTZ;

  IF v_spins_today >= v_daily_limit THEN
    RETURN jsonb_build_object('error', 'daily_limit_reached');
  END IF;

  -- Sortear prêmio (pesos sobre 1000)
  -- ticket_1: 350 | ticket_2: 100 | ticket_3: 50
  -- supercurtida_1: 190 | supercurtida_3: 10
  -- boost: 100 | lupa: 80 | rewind: 80
  -- invisivel_1d: 20 | plan_plus_1d: 15 | plan_black_1d: 5
  v_roll := random() * 1000;

  IF    v_roll < 350 THEN v_type := 'ticket';       v_amount := 1;
  ELSIF v_roll < 450 THEN v_type := 'ticket';       v_amount := 2;
  ELSIF v_roll < 500 THEN v_type := 'ticket';       v_amount := 3;
  ELSIF v_roll < 690 THEN v_type := 'supercurtida'; v_amount := 1;
  ELSIF v_roll < 700 THEN v_type := 'supercurtida'; v_amount := 3;
  ELSIF v_roll < 800 THEN v_type := 'boost';        v_amount := 1;
  ELSIF v_roll < 880 THEN v_type := 'lupa';         v_amount := 1;
  ELSIF v_roll < 960 THEN v_type := 'rewind';       v_amount := 1;
  ELSIF v_roll < 980 THEN v_type := 'invisivel_1d'; v_amount := 1;
  ELSIF v_roll < 995 THEN v_type := 'plan_plus_1d'; v_amount := 1; v_jackpot := TRUE;
  ELSE                    v_type := 'plan_black_1d'; v_amount := 1; v_jackpot := TRUE;
  END IF;

  -- Descontar 1 ticket
  UPDATE user_tickets
    SET amount = amount - 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Creditar prêmio
  PERFORM _credit_item(p_user_id, v_type, v_amount);

  -- Registrar no histórico
  INSERT INTO roleta_history (user_id, reward_type, reward_amount, was_jackpot)
  VALUES (p_user_id, v_type, v_amount, v_jackpot);

  RETURN jsonb_build_object(
    'reward_type',   v_type,
    'reward_amount', v_amount,
    'was_jackpot',   v_jackpot
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 7: Função update_daily_streak
-- ============================================================

CREATE OR REPLACE FUNCTION update_daily_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_date      DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today          DATE := CURRENT_DATE;
  v_days_since     INTEGER;
BEGIN
  -- Busca registro atual
  SELECT current_streak, longest_streak, last_login_date
  INTO v_current_streak, v_longest_streak, v_last_date
  FROM daily_streaks WHERE user_id = p_user_id;

  -- Sem registro: cria com streak = 1
  IF NOT FOUND THEN
    INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (p_user_id, 1, 1, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Já registrou hoje: nada a fazer
  IF v_last_date = v_today THEN RETURN; END IF;

  v_days_since := v_today - COALESCE(v_last_date, (v_today - 31));

  IF v_days_since >= 30 THEN
    -- 30+ dias sem entrar: reseta streak
    v_current_streak := 1;
  ELSIF v_days_since = 1 THEN
    -- Dia consecutivo: incrementa
    v_current_streak := v_current_streak + 1;
  END IF;
  -- Entre 2 e 29 dias: streak congelado (não incrementa, não reseta)

  v_longest_streak := GREATEST(v_longest_streak, v_current_streak);

  UPDATE daily_streaks
    SET current_streak  = v_current_streak,
        longest_streak  = v_longest_streak,
        last_login_date = v_today
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 8: Função extend_streak_calendar (gera próximos 30 dias)
-- Prêmios aleatórios a cada chamada, quantidades escaladas pelo nível
-- ============================================================

CREATE OR REPLACE FUNCTION extend_streak_calendar(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_max_day      INTEGER;
  v_xp_level     INTEGER;
  v_level_mult   NUMERIC;
  v_day          INTEGER;
  v_reward_type  TEXT;
  v_reward_amt   INTEGER;
  v_base_amt     INTEGER;
  v_roll         NUMERIC;
BEGIN
  -- Segurança: só o próprio usuário ou SECURITY DEFINER sem auth (geração interna)
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Dia máximo já gerado para este usuário
  SELECT COALESCE(MAX(day_number), 0) INTO v_max_day
  FROM streak_calendar WHERE user_id = p_user_id;

  -- Nível XP para escalar quantidades
  SELECT COALESCE(xp_level, 0) INTO v_xp_level
  FROM profiles WHERE id = p_user_id;

  -- Multiplicador por nível: 0→1x, 1→1.5x, 2→2x, 3→2.5x, 4→3x, 5→4x
  v_level_mult := 1.0 + (v_xp_level * 0.5);
  IF v_xp_level >= 5 THEN v_level_mult := 4.0; END IF;

  -- Gera os próximos 30 dias (aleatórios — mudam a cada ciclo)
  FOR v_day IN (v_max_day + 1)..(v_max_day + 30) LOOP
    v_roll := random() * 100;

    -- Sorteia tipo do prêmio
    IF v_roll < 38 THEN
      v_reward_type := 'ticket';
      IF    v_roll < 18 THEN v_base_amt := 1;
      ELSIF v_roll < 30 THEN v_base_amt := 2;
      ELSE                   v_base_amt := 3;
      END IF;
    ELSIF v_roll < 58 THEN
      v_reward_type := 'supercurtida';
      v_base_amt    := CASE WHEN v_roll < 48 THEN 1 ELSE 2 END;
    ELSIF v_roll < 70 THEN
      v_reward_type := 'lupa';
      v_base_amt    := 1;
    ELSIF v_roll < 80 THEN
      v_reward_type := 'boost';
      v_base_amt    := 1;
    ELSIF v_roll < 90 THEN
      v_reward_type := 'rewind';
      v_base_amt    := 1;
    ELSIF v_roll < 95 THEN
      -- Prêmio de destaque do ciclo: tickets em maior quantidade
      v_reward_type := 'ticket';
      v_base_amt    := 5;
    ELSIF v_roll < 98 THEN
      v_reward_type := 'supercurtida';
      v_base_amt    := 3;
    ELSE
      v_reward_type := 'boost';
      v_base_amt    := 2;
    END IF;

    -- Aplicar multiplicador de nível
    v_reward_amt := GREATEST(1, ROUND(v_base_amt * v_level_mult)::INTEGER);

    INSERT INTO streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_day, v_reward_type, v_reward_amt, FALSE)
    ON CONFLICT (user_id, day_number) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 9: Atualiza generate_streak_calendar (usa extend agora)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_streak_calendar(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Só gera se ainda não existe calendário para este usuário
  IF NOT EXISTS (
    SELECT 1 FROM streak_calendar WHERE user_id = p_user_id LIMIT 1
  ) THEN
    PERFORM extend_streak_calendar(p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 10: Função claim_streak_reward
-- ============================================================

CREATE OR REPLACE FUNCTION claim_streak_reward(
  p_user_id   UUID,
  p_day_number INTEGER
) RETURNS jsonb AS $$
DECLARE
  v_entry          streak_calendar%ROWTYPE;
  v_current_streak INTEGER;
BEGIN
  -- Segurança: só o próprio usuário
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
  END IF;

  -- Busca a entrada do calendário
  SELECT * INTO v_entry
  FROM streak_calendar
  WHERE user_id = p_user_id AND day_number = p_day_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  -- Já resgatado?
  IF v_entry.claimed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- Usuário alcançou este dia?
  SELECT current_streak INTO v_current_streak
  FROM daily_streaks WHERE user_id = p_user_id;

  IF COALESCE(v_current_streak, 0) < p_day_number THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_reached');
  END IF;

  -- Marcar como resgatado
  UPDATE streak_calendar
    SET claimed    = TRUE,
        claimed_at = NOW()
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Creditar prêmio ao saldo
  PERFORM _credit_item(p_user_id, v_entry.reward_type, v_entry.reward_amount);

  RETURN jsonb_build_object(
    'success',        true,
    'reward_type',    v_entry.reward_type,
    'reward_amount',  v_entry.reward_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 11: Migrar registros existentes (gerar calendário para
--           usuários que já tinham o calendário de 60 dias fixo)
-- ============================================================

-- Para usuários com calendário estático (60 dias), regenerar para
-- usar o novo sistema. Remove apenas os não-resgatados do dia 1-60
-- e mantém os já resgatados intactos.
DO $$
DECLARE
  v_user RECORD;
BEGIN
  -- Encontra usuários que têm exatamente 60 dias no calendário
  -- (padrão do sistema antigo com todos claimed=false ou alguns claimed=true)
  FOR v_user IN
    SELECT DISTINCT user_id FROM streak_calendar
    GROUP BY user_id HAVING MAX(day_number) <= 60
  LOOP
    -- Não faz nada — calendário existente é aproveitado
    -- Apenas garante que terão extensão quando necessário
    NULL;
  END LOOP;
END;
$$;

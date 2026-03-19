-- =============================================
-- SISTEMA DE STREAK CALENDAR — Migration completa
-- Execute no Supabase SQL Editor
-- =============================================

-- 0. Tabela de streak diário (daily_streaks) — caso não exista
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_login_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_select_own_streak" ON public.daily_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_update_own_streak" ON public.daily_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 1. Tabela streak_calendar (caso não exista)
CREATE TABLE IF NOT EXISTS public.streak_calendar (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  reward_type text NOT NULL,
  reward_amount integer NOT NULL DEFAULT 1,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_number)
);

ALTER TABLE public.streak_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_select_own_streak_calendar" ON public.streak_calendar
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_role_all_streak_calendar" ON public.streak_calendar
  USING (true) WITH CHECK (true);

-- 2. Function: generate_streak_calendar
-- Gera os primeiros 30 dias do calendário para um usuário novo ou resetado
CREATE OR REPLACE FUNCTION public.generate_streak_calendar(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_start_day integer;
  v_day integer;
BEGIN
  -- Buscar streak atual do usuário
  SELECT current_streak INTO v_current_streak
  FROM public.daily_streaks
  WHERE user_id = p_user_id;

  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;

  -- Se streak é 0, começa do dia 1. Se já tem streak, começa do ciclo atual
  v_start_day := (floor(v_current_streak / 30) * 30) + 1;

  -- Limpar calendário existente (para recriar)
  DELETE FROM public.streak_calendar
  WHERE user_id = p_user_id;

  -- Gerar 30 dias do ciclo
  FOR v_day IN v_start_day..(v_start_day + 29) LOOP
    INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (
      p_user_id,
      v_day,
      get_streak_reward_type(v_day),
      get_streak_reward_amount(v_day),
      false
    );
  END LOOP;
END;
$$;

-- 3. Function: extend_streak_calendar
-- Estende o calendário quando o usuário está a 5 dias do fim do ciclo
CREATE OR REPLACE FUNCTION public.extend_streak_calendar(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_max_day integer;
  v_next_cycle_start integer;
  v_day integer;
BEGIN
  -- Buscar streak atual
  SELECT current_streak INTO v_current_streak
  FROM public.daily_streaks
  WHERE user_id = p_user_id;

  IF v_current_streak IS NULL THEN
    RETURN;
  END IF;

  -- Encontrar o maior day_number no calendário atual
  SELECT COALESCE(MAX(day_number), 0) INTO v_max_day
  FROM public.streak_calendar
  WHERE user_id = p_user_id;

  -- Se chegou perto do fim (current + 5 >= max), estende mais 30 dias
  IF v_current_streak + 5 >= v_max_day THEN
    v_next_cycle_start := v_max_day + 1;

    FOR v_day IN v_next_cycle_start..(v_next_cycle_start + 29) LOOP
      INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
      VALUES (
        p_user_id,
        v_day,
        get_streak_reward_type(v_day),
        get_streak_reward_amount(v_day),
        false
      )
      ON CONFLICT (user_id, day_number) DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- 4. Function: claim_streak_reward (CRÍTICA)
-- Resgata o prêmio do dia e credita no saldo do usuário
CREATE OR REPLACE FUNCTION public.claim_streak_reward(
  p_user_id uuid,
  p_day_number integer
)
RETURNS TABLE(
  success boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_calendar_entry record;
  v_reward_type text;
  v_reward_amount integer;
BEGIN
  -- Buscar streak atual
  SELECT current_streak INTO v_current_streak
  FROM public.daily_streaks
  WHERE user_id = p_user_id;

  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;

  -- Buscar entrada do calendário
  SELECT * INTO v_calendar_entry
  FROM public.streak_calendar
  WHERE user_id = p_user_id AND day_number = p_day_number;

  IF v_calendar_entry IS NULL THEN
    RETURN QUERY SELECT false, 'not_reached';
    RETURN;
  END IF;

  -- Verificar se o dia foi alcançado
  IF p_day_number > v_current_streak THEN
    RETURN QUERY SELECT false, 'not_reached';
    RETURN;
  END IF;

  -- Verificar se já foi resgatado
  IF v_calendar_entry.claimed THEN
    RETURN QUERY SELECT false, 'already_claimed';
    RETURN;
  END IF;

  v_reward_type := v_calendar_entry.reward_type;
  v_reward_amount := v_calendar_entry.reward_amount;

  -- Marcar como resgatado
  UPDATE public.streak_calendar
  SET claimed = true
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Creditar o item correspondente
  IF v_reward_type = 'ticket' THEN
    UPDATE public.user_tickets
    SET amount = amount + v_reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_tickets (user_id, amount, updated_at)
      VALUES (p_user_id, v_reward_amount, now());
    END IF;

  ELSIF v_reward_type = 'supercurtida' THEN
    UPDATE public.user_superlikes
    SET amount = amount + v_reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_superlikes (user_id, amount, updated_at)
      VALUES (p_user_id, v_reward_amount, now());
    END IF;

  ELSIF v_reward_type = 'boost' THEN
    UPDATE public.user_boosts
    SET amount = amount + v_reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_boosts (user_id, amount, updated_at)
      VALUES (p_user_id, v_reward_amount, now());
    END IF;

  ELSIF v_reward_type = 'lupa' THEN
    UPDATE public.user_lupas
    SET amount = amount + v_reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_lupas (user_id, amount, updated_at)
      VALUES (p_user_id, v_reward_amount, now());
    END IF;

  ELSIF v_reward_type = 'rewind' THEN
    UPDATE public.user_rewinds
    SET amount = amount + v_reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_rewinds (user_id, amount, updated_at)
      VALUES (p_user_id, v_reward_amount, now());
    END IF;

  ELSIF v_reward_type = 'invisivel_1d' THEN
    -- Modo fantasma por 1 dia
    UPDATE public.profiles
    SET ghost_mode_until = now() + interval '1 day',
        updated_at = now()
    WHERE id = p_user_id;

  ELSIF v_reward_type = 'plan_plus_1d' THEN
    -- Dar 1 dia de plano Plus (precisa de lógica de assinatura)
    -- Por enquanto, evitamos implementar pois envolve tabela de assinaturas
    NULL; -- TODO: implementar se necessário

  ELSIF v_reward_type = 'plan_black_1d' THEN
    -- Dar 1 dia de plano Black
    NULL; -- TODO: implementar se necessário
  END IF;

  -- Conceder XP pelo claim (fire-and-forget)
  -- Nota: award_xp deve existir no banco; se não, ignora silenciosamente
  BEGIN
    -- Chamada silenciosa, ignoramos resultado
    PERFORM 1 FROM (
      SELECT public.award_xp(p_user_id, 'streak_claim', 10)
    ) AS t;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN QUERY SELECT true, NULL;
END;
$$;

-- 5. Funções auxiliares: get_streak_reward_type e get_streak_reward_amount
-- Determinam o tipo e quantidade de recompensa baseado no dia do ciclo

CREATE OR REPLACE FUNCTION public.get_streak_reward_type(day_number integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN day_number IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10) THEN 'ticket'
    WHEN day_number IN (11, 12, 13, 14, 15, 16) THEN 'supercurtida'
    WHEN day_number IN (17, 18, 19, 20, 21) THEN 'boost'
    WHEN day_number IN (22, 23, 24, 25) THEN 'lupa'
    WHEN day_number IN (26, 27) THEN 'rewind'
    WHEN day_number = 28 THEN 'invisivel_1d'
    WHEN day_number = 29 THEN 'plan_plus_1d'
    WHEN day_number = 30 THEN 'plan_black_1d'
    ELSE 'ticket'
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_streak_reward_amount(day_number integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN day_number BETWEEN 1 AND 10 THEN 1
    WHEN day_number BETWEEN 11 AND 16 THEN 2
    WHEN day_number BETWEEN 17 AND 21 THEN 1
    WHEN day_number BETWEEN 22 AND 25 THEN 2
    WHEN day_number BETWEEN 26 AND 27 THEN 1
    WHEN day_number = 28 THEN 1
    WHEN day_number = 29 THEN 1
    WHEN day_number = 30 THEN 1
    ELSE 1
  END;
$$;

-- 6. Function: update_streak_on_login
-- Atualiza o streak quando o usuário faz login (se logou no dia anterior ou hoje)
-- Esta function deve ser chamada manualmente ou integrada ao fluxo de login

CREATE OR REPLACE FUNCTION public.update_streak_on_login(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak record;
  v_last_login date;
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
BEGIN
  -- Buscar streak atual
  SELECT current_streak, last_login_date INTO v_streak
  FROM public.daily_streaks
  WHERE user_id = p_user_id;

  IF v_streak IS NULL THEN
    -- Primeiro login: criar registro com streak = 1
    INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (p_user_id, 1, 1, v_today);
  ELSE
    v_last_login := v_streak.last_login_date::date;

    IF v_last_login = v_today THEN
      -- Já logou hoje, não faz nada
      RETURN;
    ELSIF v_last_login = v_yesterday THEN
      -- Continuou o streak: +1 dia
      UPDATE public.daily_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_login_date = v_today,
          updated_at = now()
      WHERE user_id = p_user_id;
    ELSE
      -- Quebrou o streak: reseta para 1
      UPDATE public.daily_streaks
      SET current_streak = 1,
          last_login_date = v_today,
          updated_at = now()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
END;
$$;

-- 7. Function: award_xp
-- Concede XP ao usuário e atualiza level se necessário
-- Requer tabela profiles com colunas: xp (integer), xp_level (integer)

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_base_xp integer DEFAULT 0
)
RETURNS TABLE(
  xp_awarded integer,
  new_total_xp integer,
  new_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp integer;
  v_current_level integer;
  v_xp_gained integer;
  v_new_total integer;
  v_new_level integer;
  v_multiplier float := 1.0;
BEGIN
  -- Buscar XP atual e level
  SELECT xp, xp_level INTO v_current_xp, v_current_level
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_xp IS NULL THEN
    v_current_xp := 0;
  END IF;
  IF v_current_level IS NULL THEN
    v_current_level := 0;
  END IF;

  -- Calcular XP ganho com multiplicador (ex: bônus de plano, eventos)
  v_xp_gained := p_base_xp;

  -- TODO: verificar bônus de XP ativo (xp_bonus_until) e aplicar multiplicador
  -- Por enquanto, usa multiplicador 1.0

  v_new_total := v_current_xp + v_xp_gained;

  -- Calcular novo level (cada level requer level*100 XP)
  v_new_level := floor((sqrt(1 + 8 * v_new_total / 100) - 1) / 2);

  -- Atualizar perfil
  UPDATE public.profiles
  SET xp = v_new_total,
      xp_level = v_new_level,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_xp_gained, v_new_total, v_new_level;
END;
$$;

-- FIM DA MIGRATION

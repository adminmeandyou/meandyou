-- =============================================
-- migration_streak_v2.sql
-- Calendario de streak: premios verdadeiramente aleatorios
-- Cada tipo so aparece apos um dia minimo; quantidades crescem
-- com o dia absoluto (infinito, sem fases fixas)
-- Execute no Supabase SQL Editor
-- =============================================

-- Drop funcoes existentes que podem ter tipos de retorno diferentes
DROP FUNCTION IF EXISTS public.claim_streak_reward(uuid, integer);
DROP FUNCTION IF EXISTS public.generate_streak_calendar(uuid);
DROP FUNCTION IF EXISTS public.extend_streak_calendar(uuid);
DROP FUNCTION IF EXISTS public._streak_pick_reward(integer);
DROP FUNCTION IF EXISTS public._streak_rand(int, int);

-- Helper: inteiro aleatorio em [lo, hi]
CREATE OR REPLACE FUNCTION public._streak_rand(lo int, hi int)
RETURNS int LANGUAGE sql SECURITY DEFINER AS $$
  SELECT lo + floor(random() * GREATEST(hi - lo + 1, 1))::int;
$$;

-- Helper central: sorteia um premio baseado no dia absoluto
-- O pool cresce conforme dias acumulados (novos tipos so entram apos min_day)
-- Quantidades tambem sobem gradualmente
CREATE OR REPLACE FUNCTION public._streak_pick_reward(p_abs_day integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pool  text[];
  v_type  text;
  v_amt   integer;
  v_size  integer;
BEGIN
  -- Ticket: sempre disponivel (peso maior no inicio = 3 entradas)
  v_pool := ARRAY['ticket', 'ticket', 'ticket'];

  -- Supercurtida: desbloqueia dia 3
  IF p_abs_day >= 3 THEN
    v_pool := v_pool || ARRAY['supercurtida'];
  END IF;

  -- Lupa: desbloqueia dia 5
  IF p_abs_day >= 5 THEN
    v_pool := v_pool || ARRAY['lupa'];
  END IF;

  -- Rewind: desbloqueia dia 8
  IF p_abs_day >= 8 THEN
    v_pool := v_pool || ARRAY['rewind'];
  END IF;

  -- Boost: desbloqueia dia 7 (peso duplo pois e raro e valioso)
  IF p_abs_day >= 7 THEN
    v_pool := v_pool || ARRAY['boost', 'boost'];
  END IF;

  -- Fichas: desbloqueia dia 12 (peso duplo para aparecer mais que itens raros)
  IF p_abs_day >= 12 THEN
    v_pool := v_pool || ARRAY['fichas', 'fichas'];
  END IF;

  -- XP: desbloqueia dia 15
  IF p_abs_day >= 15 THEN
    v_pool := v_pool || ARRAY['xp'];
  END IF;

  -- Invisivel 1d: desbloqueia dia 18
  IF p_abs_day >= 18 THEN
    v_pool := v_pool || ARRAY['invisivel_1d'];
  END IF;

  -- A partir do dia 25, fichas e xp ganham mais peso
  IF p_abs_day >= 25 THEN
    v_pool := v_pool || ARRAY['fichas', 'xp'];
  END IF;

  -- Sorteia do pool
  v_size := array_length(v_pool, 1);
  v_type := v_pool[1 + floor(random() * v_size)::int % v_size];

  -- Quantidade escala com o dia absoluto, dentro dos limites do usuario
  v_amt := CASE v_type
    WHEN 'ticket' THEN
      -- 1-5, mas so chega no 5 depois do dia 40
      public._streak_rand(1, LEAST(5, 1 + p_abs_day / 10))

    WHEN 'supercurtida' THEN
      -- 1-5, chega no 5 depois do dia 60
      public._streak_rand(1, LEAST(5, 1 + p_abs_day / 15))

    WHEN 'lupa' THEN
      -- 1-4, chega no 4 depois do dia 45
      public._streak_rand(1, LEAST(4, 1 + p_abs_day / 15))

    WHEN 'rewind' THEN
      -- 1-3
      public._streak_rand(1, LEAST(3, 1 + p_abs_day / 25))

    WHEN 'boost' THEN
      -- 1-3
      public._streak_rand(1, LEAST(3, 1 + p_abs_day / 25))

    WHEN 'fichas' THEN
      -- 1-10, mas os valores altos so aparecem com dias acumulados
      public._streak_rand(1, LEAST(10, GREATEST(1, p_abs_day / 6)))

    WHEN 'xp' THEN
      -- 10-150, cresce linearmente com os dias
      public._streak_rand(10, LEAST(150, 10 + p_abs_day * 2))

    WHEN 'invisivel_1d' THEN 1

    ELSE 1
  END;

  RETURN jsonb_build_object('type', v_type, 'amount', v_amt);
END;
$$;

-- 1. generate_streak_calendar — cria os primeiros 30 dias (ciclo 1)
CREATE OR REPLACE FUNCTION public.generate_streak_calendar(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_day integer;
  v_r   jsonb;
BEGIN
  DELETE FROM public.streak_calendar WHERE user_id = p_user_id;

  FOR v_day IN 1..30 LOOP
    -- Marco do ciclo 1: dia 30 sempre da plano Plus por 1 dia
    IF v_day = 30 THEN
      INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
      VALUES (p_user_id, 30, 'plan_plus_1d', 1, false)
      ON CONFLICT (user_id, day_number) DO NOTHING;
    ELSE
      v_r := public._streak_pick_reward(v_day);
      INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
      VALUES (p_user_id, v_day, v_r->>'type', (v_r->>'amount')::int, false)
      ON CONFLICT (user_id, day_number) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_streak_calendar(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_streak_calendar(uuid) TO service_role;

-- 2. extend_streak_calendar — estende infinitamente, marcos a cada 30 dias
CREATE OR REPLACE FUNCTION public.extend_streak_calendar(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_day integer;
  v_cday    integer;
  v_abs_day integer;
  v_r       jsonb;
  v_mtype   text;
  v_mamt    integer;
BEGIN
  SELECT COALESCE(MAX(day_number), 0) INTO v_max_day
  FROM public.streak_calendar WHERE user_id = p_user_id;

  FOR v_cday IN 1..30 LOOP
    v_abs_day := v_max_day + v_cday;

    -- Verifica se e dia de marco (multiplo de 30)
    IF v_abs_day % 30 = 0 THEN
      IF v_abs_day = 30 THEN
        v_mtype := 'plan_plus_1d';  v_mamt := 1;
      ELSIF v_abs_day = 60 THEN
        v_mtype := 'plan_black_1d'; v_mamt := 1;
      ELSE
        -- Ciclos 3+ (dias 90, 120...): fichas maximas como grande marco
        v_mtype := 'fichas'; v_mamt := 10;
      END IF;

      INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
      VALUES (p_user_id, v_abs_day, v_mtype, v_mamt, false)
      ON CONFLICT (user_id, day_number) DO NOTHING;

    ELSE
      -- Dia normal: totalmente aleatorio baseado no dia absoluto
      v_r := public._streak_pick_reward(v_abs_day);
      INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
      VALUES (p_user_id, v_abs_day, v_r->>'type', (v_r->>'amount')::int, false)
      ON CONFLICT (user_id, day_number) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.extend_streak_calendar(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.extend_streak_calendar(uuid) TO service_role;

-- 3. claim_streak_reward — credita todos os tipos incluindo fichas e xp
CREATE OR REPLACE FUNCTION public.claim_streak_reward(
  p_user_id    uuid,
  p_day_number integer
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry  record;
  v_streak record;
BEGIN
  SELECT * INTO v_entry
  FROM public.streak_calendar
  WHERE user_id = p_user_id AND day_number = p_day_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_entry.claimed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  SELECT * INTO v_streak
  FROM public.daily_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'streak_not_found');
  END IF;

  -- Streak zerado se ultimo login foi ha mais de 1 dia
  IF v_streak.last_login_date IS NOT NULL
     AND v_streak.last_login_date < CURRENT_DATE - INTERVAL '1 day' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'streak_reset');
  END IF;

  IF p_day_number > v_streak.current_streak THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_reached');
  END IF;

  -- Marca como resgatado
  UPDATE public.streak_calendar
  SET claimed = true
  WHERE user_id = p_user_id AND day_number = p_day_number;

  -- Credita o premio
  CASE v_entry.reward_type
    WHEN 'ticket' THEN
      PERFORM public.increment_user_balance('user_tickets',   p_user_id, v_entry.reward_amount);
    WHEN 'supercurtida' THEN
      PERFORM public.increment_user_balance('user_superlikes', p_user_id, v_entry.reward_amount);
    WHEN 'boost' THEN
      PERFORM public.increment_user_balance('user_boosts',    p_user_id, v_entry.reward_amount);
    WHEN 'lupa' THEN
      PERFORM public.increment_user_balance('user_lupas',     p_user_id, v_entry.reward_amount);
    WHEN 'rewind' THEN
      PERFORM public.increment_user_balance('user_rewinds',   p_user_id, v_entry.reward_amount);
    WHEN 'fichas' THEN
      PERFORM public.increment_user_balance('user_fichas',    p_user_id, v_entry.reward_amount);
    WHEN 'invisivel_1d' THEN
      UPDATE public.profiles
      SET ghost_mode_until = GREATEST(COALESCE(ghost_mode_until, now()), now()) + INTERVAL '1 day'
      WHERE id = p_user_id;
    WHEN 'plan_plus_1d' THEN
      UPDATE public.profiles
      SET plan = 'plus'
      WHERE id = p_user_id AND (plan = 'essencial' OR plan IS NULL);
    WHEN 'plan_black_1d' THEN
      UPDATE public.profiles
      SET plan = 'black'
      WHERE id = p_user_id AND plan IN ('essencial', 'plus');
    WHEN 'xp' THEN
      NULL; -- creditado na API route via award_xp com o reward_amount dinamico
    ELSE
      NULL;
  END CASE;

  RETURN jsonb_build_object(
    'success',       true,
    'reward_type',   v_entry.reward_type,
    'reward_amount', v_entry.reward_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_streak_reward(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_streak_reward(uuid, integer) TO service_role;

-- Helpers internos: apenas service_role
REVOKE ALL ON FUNCTION public._streak_rand(int, int)          FROM PUBLIC;
REVOKE ALL ON FUNCTION public._streak_pick_reward(integer)    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._streak_rand(int, int)       TO service_role;
GRANT EXECUTE ON FUNCTION public._streak_pick_reward(integer) TO service_role;

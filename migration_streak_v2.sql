-- =============================================
-- migration_streak_v2.sql
-- Calendario de streak com geracao aleatoria por fase
-- Premios escalam a cada ciclo de 30 dias (dia 30, 60, 90...)
-- Execute no Supabase SQL Editor
-- =============================================

-- Helper interno: sorteia um inteiro em [lo, hi]
CREATE OR REPLACE FUNCTION public._streak_rand(lo int, hi int)
RETURNS int LANGUAGE sql AS $$
  SELECT lo + floor(random() * (hi - lo + 1))::int;
$$;

-- 1. generate_streak_calendar — ciclo 1 (dias 1-30)
CREATE OR REPLACE FUNCTION public.generate_streak_calendar(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_day   integer;
  v_type  text;
  v_amt   integer;
  v_pool  text[];
  v_psize integer;
  v_pick  text;
BEGIN
  DELETE FROM public.streak_calendar WHERE user_id = p_user_id;

  FOR v_day IN 1..30 LOOP
    -- Ancoras fixas
    IF v_day = 7 THEN
      v_type := 'boost';       v_amt := 1;
    ELSIF v_day = 14 THEN
      v_type := 'boost';       v_amt := 2;
    ELSIF v_day = 30 THEN
      -- Marco do ciclo 1: plano Plus por 1 dia
      v_type := 'plan_plus_1d'; v_amt := 1;

    -- Fase 1 (dias 1-6): premios simples, pouca quantidade
    ELSIF v_day <= 6 THEN
      v_pool  := ARRAY['ticket','ticket','supercurtida','lupa','ticket'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(1, 2)
        WHEN 'supercurtida' THEN 1
        WHEN 'lupa'         THEN 1
        ELSE 1 END;

    -- Fase 2 (dias 8-13): um pouco melhor
    ELSIF v_day <= 13 THEN
      v_pool  := ARRAY['ticket','ticket','supercurtida','lupa','rewind','ticket'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(2, 3)
        WHEN 'supercurtida' THEN public._streak_rand(1, 2)
        WHEN 'lupa'         THEN public._streak_rand(1, 2)
        WHEN 'rewind'       THEN 1
        ELSE 1 END;

    -- Fase 3 (dias 15-21): fichas entram, xp aparece
    ELSIF v_day <= 21 THEN
      v_pool  := ARRAY['ticket','fichas','supercurtida','fichas','xp','lupa'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(2, 4)
        WHEN 'fichas'       THEN public._streak_rand(1, 5)
        WHEN 'supercurtida' THEN public._streak_rand(2, 3)
        WHEN 'lupa'         THEN public._streak_rand(2, 3)
        WHEN 'xp'           THEN public._streak_rand(10, 50)
        ELSE 2 END;

    -- Fase 4 (dias 22-29): melhores recompensas do ciclo
    ELSE
      v_pool  := ARRAY['fichas','ticket','supercurtida','fichas','xp','boost','invisivel_1d'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'fichas'       THEN public._streak_rand(3, 8)
        WHEN 'ticket'       THEN public._streak_rand(3, 5)
        WHEN 'supercurtida' THEN public._streak_rand(2, 5)
        WHEN 'xp'           THEN public._streak_rand(25, 100)
        WHEN 'boost'        THEN public._streak_rand(1, 3)
        WHEN 'invisivel_1d' THEN 1
        ELSE 1 END;
    END IF;

    INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_day, v_type, v_amt, false)
    ON CONFLICT (user_id, day_number) DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_streak_calendar(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_streak_calendar(uuid) TO service_role;

-- 2. extend_streak_calendar — ciclos 2, 3, 4... (quantidades escalam)
--    A cada ciclo completo os premios ficam um pouco melhores
CREATE OR REPLACE FUNCTION public.extend_streak_calendar(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_day   integer;
  v_cycle     integer;       -- qual ciclo estamos gerando (1=primeiro, 2=segundo...)
  v_cycle_day integer;
  v_new_day   integer;
  v_type      text;
  v_amt       integer;
  v_pool      text[];
  v_psize     integer;
  v_pick      text;
  -- Multiplicador de quantidades por ciclo (suave para nao inflar demais)
  v_m1        integer;       -- multiplicador para itens normais (escala leve)
  v_m2        integer;       -- multiplicador para fichas/xp (escala maior)
BEGIN
  SELECT COALESCE(MAX(day_number), 0) INTO v_max_day
  FROM public.streak_calendar WHERE user_id = p_user_id;

  -- Ciclo atual: quantos blocos de 30 ja foram gerados
  v_cycle := (v_max_day / 30) + 1;

  -- Escala de quantidades: cap em ciclo 4 para nao ficar absurdo
  v_m1 := LEAST(v_cycle, 3);           -- 1, 2, 3, 3...
  v_m2 := LEAST(v_cycle * 2 - 1, 5);  -- 1, 3, 5, 5...

  FOR v_cycle_day IN 1..30 LOOP
    v_new_day := v_max_day + v_cycle_day;

    -- Ancoras fixas por ciclo
    IF v_cycle_day = 7 THEN
      v_type := 'boost';  v_amt := v_m1;
    ELSIF v_cycle_day = 14 THEN
      v_type := 'boost';  v_amt := v_m1 + 1;
    ELSIF v_cycle_day = 30 THEN
      -- Marco do ciclo: ciclo 2 = Black 1d, ciclo 3+ = fichas grandes + xp
      IF v_cycle = 2 THEN
        v_type := 'plan_black_1d'; v_amt := 1;
      ELSE
        -- Ciclos 3+: fichas generosas como grande marco
        v_type := 'fichas'; v_amt := 10;
      END IF;

    -- Fase 1 do ciclo
    ELSIF v_cycle_day <= 6 THEN
      v_pool  := ARRAY['ticket','ticket','supercurtida','lupa','ticket'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(1, 2 + v_m1 - 1)
        WHEN 'supercurtida' THEN v_m1
        WHEN 'lupa'         THEN v_m1
        ELSE v_m1 END;

    -- Fase 2 do ciclo
    ELSIF v_cycle_day <= 13 THEN
      v_pool  := ARRAY['ticket','ticket','supercurtida','lupa','rewind','fichas'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(2, 3 + v_m1 - 1)
        WHEN 'supercurtida' THEN public._streak_rand(v_m1, v_m1 + 1)
        WHEN 'lupa'         THEN public._streak_rand(1, v_m1 + 1)
        WHEN 'rewind'       THEN v_m1
        WHEN 'fichas'       THEN public._streak_rand(1, v_m2)
        ELSE v_m1 END;

    -- Fase 3 do ciclo
    ELSIF v_cycle_day <= 21 THEN
      v_pool  := ARRAY['ticket','fichas','supercurtida','fichas','xp','lupa'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'ticket'       THEN public._streak_rand(2, 4 + v_m1 - 1)
        WHEN 'fichas'       THEN public._streak_rand(v_m2, LEAST(v_m2 + 4, 10))
        WHEN 'supercurtida' THEN public._streak_rand(v_m1 + 1, v_m1 + 2)
        WHEN 'lupa'         THEN public._streak_rand(v_m1, v_m1 + 2)
        WHEN 'xp'           THEN public._streak_rand(10 * v_m1, LEAST(75 * v_m1, 150))
        ELSE v_m1 + 1 END;

    -- Fase 4 do ciclo
    ELSE
      v_pool  := ARRAY['fichas','ticket','supercurtida','fichas','xp','boost','invisivel_1d'];
      v_psize := array_length(v_pool, 1);
      v_pick  := v_pool[1 + (floor(random() * v_psize))::int % v_psize];
      v_type  := v_pick;
      v_amt   := CASE v_type
        WHEN 'fichas'       THEN public._streak_rand(LEAST(3 + v_m2, 8), LEAST(5 + v_m2, 10))
        WHEN 'ticket'       THEN public._streak_rand(3, LEAST(4 + v_m1, 5))
        WHEN 'supercurtida' THEN public._streak_rand(v_m1 + 1, LEAST(v_m1 + 3, 5))
        WHEN 'xp'           THEN public._streak_rand(LEAST(25 * v_m1, 100), LEAST(100 * v_m1, 150))
        WHEN 'boost'        THEN public._streak_rand(v_m1, v_m1 + 1)
        WHEN 'invisivel_1d' THEN 1
        ELSE v_m1 END;
    END IF;

    INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_new_day, v_type, v_amt, false)
    ON CONFLICT (user_id, day_number) DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.extend_streak_calendar(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.extend_streak_calendar(uuid) TO service_role;

-- 3. claim_streak_reward — suporta todos os tipos incluindo fichas e xp
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
      PERFORM public.increment_user_balance('user_tickets', p_user_id, v_entry.reward_amount);
    WHEN 'supercurtida' THEN
      PERFORM public.increment_user_balance('user_superlikes', p_user_id, v_entry.reward_amount);
    WHEN 'boost' THEN
      PERFORM public.increment_user_balance('user_boosts', p_user_id, v_entry.reward_amount);
    WHEN 'lupa' THEN
      PERFORM public.increment_user_balance('user_lupas', p_user_id, v_entry.reward_amount);
    WHEN 'rewind' THEN
      PERFORM public.increment_user_balance('user_rewinds', p_user_id, v_entry.reward_amount);
    WHEN 'fichas' THEN
      PERFORM public.increment_user_balance('user_fichas', p_user_id, v_entry.reward_amount);
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
      NULL; -- creditado na API route via award_xp com reward_amount dinamico
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

-- Limpa helper (nao precisa ficar exposto)
REVOKE ALL ON FUNCTION public._streak_rand(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._streak_rand(int, int) TO service_role;

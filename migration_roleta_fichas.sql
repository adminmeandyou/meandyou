-- =============================================
-- ROLETA: trocar premios de ticket por fichas
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Remover premios do tipo 'ticket' da tabela de premios
DELETE FROM public.roleta_prizes WHERE reward_type = 'ticket';

-- 2. Inserir premios de fichas nos lugares dos tickets
INSERT INTO public.roleta_prizes (reward_type, reward_amount, weight, active)
VALUES
  ('fichas', 5,  35, true),  -- comum: 5 fichas  (mesmo peso do "1 ticket" anterior)
  ('fichas', 10, 15, true),  -- incomum: 10 fichas
  ('fichas', 20,  3, true);  -- raro: 20 fichas

-- 3. Atualizar a funcao spin_roleta para creditar fichas em user_fichas
CREATE OR REPLACE FUNCTION public.spin_roleta(p_user_id uuid)
RETURNS TABLE(
  reward_type text,
  reward_amount integer,
  was_jackpot boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tickets integer;
  v_prize record;
  v_total_weight integer;
  v_random_weight integer;
  v_accumulated integer := 0;
BEGIN
  -- 1. Verificar saldo de tickets (com lock para evitar race condition)
  SELECT amount INTO v_tickets
  FROM public.user_tickets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_tickets IS NULL OR v_tickets < 1 THEN
    RAISE EXCEPTION 'sem_tickets';
  END IF;

  -- 2. Debitar 1 ticket
  UPDATE public.user_tickets
  SET amount = amount - 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. Calcular soma total de pesos dos premios ativos
  SELECT COALESCE(SUM(weight), 100) INTO v_total_weight
  FROM public.roleta_prizes
  WHERE active = true;

  -- 4. Gerar numero aleatorio entre 1 e total_weight
  v_random_weight := floor(random() * v_total_weight) + 1;

  -- 5. Percorrer premios em ordem e selecionar o sorteado
  FOR v_prize IN
    SELECT id, reward_type, reward_amount, weight
    FROM public.roleta_prizes
    WHERE active = true
    ORDER BY id
  LOOP
    v_accumulated := v_accumulated + v_prize.weight;
    IF v_random_weight <= v_accumulated THEN
      EXIT;
    END IF;
  END LOOP;

  -- 6. Creditar o premio sorteado
  IF v_prize.reward_type = 'fichas' THEN
    UPDATE public.user_fichas
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_fichas (user_id, amount, updated_at)
      VALUES (p_user_id, v_prize.reward_amount, now());
    END IF;

  ELSIF v_prize.reward_type = 'supercurtida' THEN
    UPDATE public.user_superlikes
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_superlikes (user_id, amount, updated_at)
      VALUES (p_user_id, v_prize.reward_amount, now());
    END IF;

  ELSIF v_prize.reward_type = 'boost' THEN
    UPDATE public.user_boosts
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_boosts (user_id, amount, updated_at)
      VALUES (p_user_id, v_prize.reward_amount, now());
    END IF;

  ELSIF v_prize.reward_type = 'lupa' THEN
    UPDATE public.user_lupas
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_lupas (user_id, amount, updated_at)
      VALUES (p_user_id, v_prize.reward_amount, now());
    END IF;

  ELSIF v_prize.reward_type = 'rewind' THEN
    UPDATE public.user_rewinds
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_rewinds (user_id, amount, updated_at)
      VALUES (p_user_id, v_prize.reward_amount, now());
    END IF;

  ELSIF v_prize.reward_type = 'invisivel_1d' THEN
    UPDATE public.profiles
    SET incognito_until = GREATEST(COALESCE(incognito_until, now()), now()) + interval '1 day'
    WHERE id = p_user_id;

  ELSIF v_prize.reward_type = 'plan_plus_1d' THEN
    UPDATE public.subscriptions
    SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 day'
    WHERE user_id = p_user_id AND plan = 'plus' AND status = 'active';

  ELSIF v_prize.reward_type = 'plan_black_1d' THEN
    UPDATE public.subscriptions
    SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 day'
    WHERE user_id = p_user_id AND plan = 'black' AND status = 'active';

  END IF;

  -- 7. Registrar no historico
  INSERT INTO public.roleta_history (user_id, reward_type, reward_amount, was_jackpot)
  VALUES (
    p_user_id,
    v_prize.reward_type,
    v_prize.reward_amount,
    v_prize.reward_type IN ('plan_plus_1d', 'plan_black_1d')
  );

  -- 8. Conceder XP silenciosamente
  BEGIN
    PERFORM public.award_xp(p_user_id, 'spin_roleta', 20);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 9. Retornar resultado
  RETURN QUERY
  SELECT
    v_prize.reward_type::text,
    v_prize.reward_amount::integer,
    (v_prize.reward_type IN ('plan_plus_1d', 'plan_black_1d'))::boolean;
END;
$$;

-- FIM DA MIGRATION

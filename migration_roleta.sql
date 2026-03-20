-- =============================================
-- SISTEMA DE ROLETA — Migration completa
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Tabela roleta_prizes (premios com pesos)
CREATE TABLE IF NOT EXISTS public.roleta_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type text NOT NULL,
  reward_amount integer NOT NULL DEFAULT 1,
  weight integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleta_prizes ENABLE ROW LEVEL SECURITY;

-- Admin pode tudo, usuarios apenas leitura
CREATE POLICY "public_read_roleta_prizes" ON public.roleta_prizes
  FOR SELECT USING (true);

-- 2. Tabela roleta_history (historico de giros)
CREATE TABLE IF NOT EXISTS public.roleta_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_amount integer NOT NULL DEFAULT 1,
  was_jackpot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleta_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_roleta_history" ON public.roleta_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_insert_roleta_history" ON public.roleta_history
  FOR INSERT WITH CHECK (true);

-- 3. Inserir premios iniciais (somente se a tabela estiver vazia)
INSERT INTO public.roleta_prizes (reward_type, reward_amount, weight, active)
SELECT * FROM (VALUES
  ('ticket',          1,  35, true),
  ('supercurtida',    1,  20, true),
  ('ticket',          2,  15, true),
  ('lupa',            1,  12, true),
  ('rewind',          1,   8, true),
  ('boost',           1,   5, true),
  ('ticket',          3,   3, true),
  ('invisivel_1d',    1,   1, true),
  ('plan_plus_1d',    1,   1, true)
) AS v(reward_type, reward_amount, weight, active)
WHERE NOT EXISTS (SELECT 1 FROM public.roleta_prizes LIMIT 1);

-- 4. RPC: spin_roleta
-- Consome 1 ticket, sorteia um premio pelos pesos e credita no saldo
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
  IF v_prize.reward_type = 'ticket' THEN
    UPDATE public.user_tickets
    SET amount = amount + v_prize.reward_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_tickets (user_id, amount, updated_at)
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
    -- Estende plano plus por 1 dia (se ja nao for black)
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

  -- 8. Conceder XP silenciosamente (ignora erro se funcao nao existir)
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

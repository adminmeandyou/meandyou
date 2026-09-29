-- ============================================================================
-- Roleta: giro grátis diário (29/09/2026)
-- Antes todo giro exigia ticket, então quem não tinha ticket nunca girava, apesar de a
-- roleta ser anunciada como diária/grátis. Agora: N giros grátis por dia conforme o plano
-- (Essencial 1, Plus 2, Black 3, mesmos valores de ticketsPerDay em usePlan.ts), dia em
-- horário de Brasília; depois disso cada giro gasta 1 ticket. Resto da função igual.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.spin_roleta(p_user_id uuid)
 RETURNS TABLE(reward_type text, reward_amount integer, was_jackpot boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  DECLARE
    v_tickets integer;
    v_plano text;
    v_gratis integer;
    v_giros_hoje integer;
    v_prize record;
    v_total_weight integer;
    v_random_weight integer;
    v_accumulated integer := 0;
    v_reward_type text;
    v_reward_amount integer;
    v_was_jackpot boolean;
  BEGIN
    -- Giros grátis por dia conforme o plano (Essencial 1, Plus 2, Black 3); depois disso, ticket
    SELECT CASE WHEN plan_override IS NOT NULL AND plan_override_until > now() THEN plan_override ELSE plan END
      INTO v_plano FROM public.profiles WHERE id = p_user_id;
    v_gratis := CASE v_plano WHEN 'black' THEN 3 WHEN 'plus' THEN 2 ELSE 1 END;

    -- trava por usuário para dois cliques simultâneos não ganharem 2 giros grátis
    PERFORM pg_advisory_xact_lock(hashtext('spin_roleta:' || p_user_id::text));
    SELECT count(*) INTO v_giros_hoje FROM public.roleta_history
     WHERE user_id = p_user_id
       AND created_at >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo');

    IF v_giros_hoje >= v_gratis THEN
      SELECT amount INTO v_tickets
      FROM public.user_tickets
      WHERE user_id = p_user_id FOR UPDATE;

      IF v_tickets IS NULL OR v_tickets < 1 THEN
        RAISE EXCEPTION 'sem_tickets';
      END IF;

      UPDATE public.user_tickets SET amount = amount - 1, updated_at = now() WHERE user_id = p_user_id;
    END IF;

    SELECT COALESCE(SUM(weight), 100) INTO v_total_weight FROM     
  public.roleta_prizes WHERE active = true;
    v_random_weight := floor(random() * v_total_weight) + 1;       

    FOR v_prize IN
      SELECT rp.id, rp.reward_type, rp.reward_amount, rp.weight    
      FROM public.roleta_prizes rp WHERE rp.active = true ORDER BY 
  rp.id
    LOOP
      v_accumulated := v_accumulated + v_prize.weight;
      IF v_random_weight <= v_accumulated THEN EXIT; END IF;       
    END LOOP;

    IF v_prize.reward_type = 'ticket' THEN
      UPDATE public.user_tickets SET amount = amount +
  v_prize.reward_amount, updated_at = now() WHERE user_id =        
  p_user_id;
      IF NOT FOUND THEN INSERT INTO public.user_tickets (user_id,  
  amount, updated_at) VALUES (p_user_id, v_prize.reward_amount,    
  now()); END IF;
    ELSIF v_prize.reward_type = 'supercurtida' THEN
      UPDATE public.user_superlikes SET amount = amount +
  v_prize.reward_amount, updated_at = now() WHERE user_id =        
  p_user_id;
      IF NOT FOUND THEN INSERT INTO public.user_superlikes
  (user_id, amount, updated_at) VALUES (p_user_id,
  v_prize.reward_amount, now()); END IF;
    ELSIF v_prize.reward_type = 'boost' THEN
      UPDATE public.user_boosts SET amount = amount +
  v_prize.reward_amount, updated_at = now() WHERE user_id =        
  p_user_id;
      IF NOT FOUND THEN INSERT INTO public.user_boosts (user_id,   
  amount, updated_at) VALUES (p_user_id, v_prize.reward_amount,    
  now()); END IF;
    ELSIF v_prize.reward_type = 'lupa' THEN
      UPDATE public.user_lupas SET amount = amount +
  v_prize.reward_amount, updated_at = now() WHERE user_id =        
  p_user_id;
      IF NOT FOUND THEN INSERT INTO public.user_lupas (user_id,    
  amount, updated_at) VALUES (p_user_id, v_prize.reward_amount,    
  now()); END IF;
    ELSIF v_prize.reward_type = 'rewind' THEN
      UPDATE public.user_rewinds SET amount = amount +
  v_prize.reward_amount, updated_at = now() WHERE user_id =        
  p_user_id;
      IF NOT FOUND THEN INSERT INTO public.user_rewinds (user_id,  
  amount, updated_at) VALUES (p_user_id, v_prize.reward_amount,    
  now()); END IF;
    ELSIF v_prize.reward_type = 'invisivel_1d' THEN
      UPDATE public.profiles SET incognito_until =
  GREATEST(COALESCE(incognito_until, now()), now()) + interval '1  
  day' WHERE id = p_user_id;
    ELSIF v_prize.reward_type = 'plan_plus_1d' THEN
      UPDATE public.subscriptions SET expires_at =
  GREATEST(COALESCE(expires_at, now()), now()) + interval '1 day'  
  WHERE user_id = p_user_id AND plan = 'plus' AND status =
  'active';
    ELSIF v_prize.reward_type = 'plan_black_1d' THEN
      UPDATE public.subscriptions SET expires_at =
  GREATEST(COALESCE(expires_at, now()), now()) + interval '1 day'  
  WHERE user_id = p_user_id AND plan = 'black' AND status =        
  'active';
    END IF;

    v_reward_type   := v_prize.reward_type;
    v_reward_amount := v_prize.reward_amount;
    v_was_jackpot   := v_prize.reward_type IN ('plan_plus_1d',     
  'plan_black_1d');

    INSERT INTO public.roleta_history (user_id, reward_type,       
  reward_amount, was_jackpot)
    VALUES (p_user_id, v_reward_type, v_reward_amount,
  v_was_jackpot);

    BEGIN
      PERFORM public.award_xp(p_user_id, 'spin_roleta', 20);       
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN QUERY SELECT v_reward_type, v_reward_amount,
  v_was_jackpot;
  END;
  $function$;

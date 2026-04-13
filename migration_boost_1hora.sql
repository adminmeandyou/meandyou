-- Altera duração do Boost de 30 minutos para 1 hora
-- Rodar no Supabase SQL Editor

DROP FUNCTION IF EXISTS activate_boost(UUID);

CREATE OR REPLACE FUNCTION activate_boost(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount INTEGER;
  v_active_until TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Verifica saldo de boosts
  SELECT amount INTO v_amount
  FROM user_boosts
  WHERE user_id = p_user_id;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN json_build_object('success', false, 'reason', 'no_boosts');
  END IF;

  -- Verifica se já tem boost ativo
  SELECT active_until INTO v_active_until
  FROM user_boosts
  WHERE user_id = p_user_id AND active_until > v_now;

  IF v_active_until IS NOT NULL THEN
    RETURN json_build_object('success', false, 'reason', 'already_active', 'active_until', v_active_until);
  END IF;

  -- Define active_until para 1 hora a partir de agora
  v_active_until := v_now + INTERVAL '1 hour';

  -- Debita 1 boost e ativa
  UPDATE user_boosts
  SET amount = amount - 1,
      active_until = v_active_until
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'active_until', v_active_until);
END;
$$;

-- RPC: activate_subscription
-- Chamada pelo webhook AbacatePay após pagamento confirmado
-- Atualiza profiles.plan e registra o order_id

CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id  UUID,
  p_plan     TEXT,
  p_order_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza o plano ativo no perfil
  UPDATE profiles
  SET plan = p_plan
  WHERE id = p_user_id;

  -- Garante que a linha existe (caso profiles ainda não tenha sido criada)
  IF NOT FOUND THEN
    INSERT INTO profiles (id, plan)
    VALUES (p_user_id, p_plan)
    ON CONFLICT (id) DO UPDATE SET plan = EXCLUDED.plan;
  END IF;
END;
$$;

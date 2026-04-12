-- =============================================
-- RPC: spend_fichas
-- Debita fichas de user_fichas atomicamente.
-- Retorna TRUE se o débito foi feito, FALSE se saldo insuficiente.
-- Chamada em: api/loja/gastar/route.ts
-- Execute no Supabase SQL Editor
-- =============================================

CREATE OR REPLACE FUNCTION public.spend_fichas(
  p_user_id    uuid,
  p_amount     integer,
  p_description text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo integer;
BEGIN
  -- Lê o saldo atual com lock para evitar race condition
  SELECT amount INTO v_saldo
  FROM public.user_fichas
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Sem registro = sem saldo
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Saldo insuficiente
  IF v_saldo < p_amount THEN
    RETURN false;
  END IF;

  -- Debita
  UPDATE public.user_fichas
  SET amount = amount - p_amount
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- Apenas service_role pode chamar (chamado via supabaseAdmin no backend)
REVOKE ALL ON FUNCTION public.spend_fichas(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_fichas(uuid, integer, text) TO service_role;

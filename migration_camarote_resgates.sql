-- =============================================
-- RPCs faltantes do Camarote Black — Resgates
-- Corrige o fluxo completo: pedido + resgate com fichas
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. create_access_request: não-Black pede acesso ao Camarote
--    Evita duplicatas: um pedido pending por usuário por vez
CREATE OR REPLACE FUNCTION public.create_access_request(
  p_requester_id uuid,
  p_category     text,
  p_tier         text DEFAULT 'basic'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Cancela pedido pendente anterior do mesmo usuário (sem limite de categoria)
  UPDATE public.access_requests
  SET status = 'expired'
  WHERE requester_id = p_requester_id
    AND status = 'pending';

  -- Cria novo pedido
  INSERT INTO public.access_requests (requester_id, category, status)
  VALUES (p_requester_id, p_category, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_access_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_access_request(uuid, text, text) TO authenticated;

-- 2. rescue_access_request: Black usa 70 fichas para resgatar um pedido
--    Debita fichas atomicamente, marca como resgatado, libera chat por 30 dias
CREATE OR REPLACE FUNCTION public.rescue_access_request(
  p_rescuer_id uuid,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request   public.access_requests%ROWTYPE;
  v_spent     boolean;
  v_expires   timestamptz;
BEGIN
  -- Busca o pedido com lock
  SELECT * INTO v_request
  FROM public.access_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pedido_nao_encontrado');
  END IF;

  -- Verifica se ainda está pendente
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pedido_ja_resgatado');
  END IF;

  -- Não pode resgatar o próprio pedido
  IF v_request.requester_id = p_rescuer_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'nao_pode_resgatar_proprio_pedido');
  END IF;

  -- Debita 70 fichas do resgatador atomicamente
  SELECT public.spend_fichas(p_rescuer_id, 70, 'Resgate Camarote') INTO v_spent;

  IF NOT v_spent THEN
    RETURN jsonb_build_object('ok', false, 'error', 'fichas_insuficientes');
  END IF;

  -- Marca como resgatado e define expiração em 30 dias
  v_expires := now() + INTERVAL '30 days';

  UPDATE public.access_requests
  SET
    status     = 'rescued',
    rescued_by = p_rescuer_id,
    expires_at = v_expires
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'ok',           true,
    'request_id',   p_request_id,
    'requester_id', v_request.requester_id,
    'expires_at',   v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rescue_access_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rescue_access_request(uuid, uuid) TO authenticated;

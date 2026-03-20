-- Camarote Black — Fase 2: Sistema de Resgates
-- Rodar no Supabase SQL Editor

-- 1. Tabela de pedidos de acesso
CREATE TABLE IF NOT EXISTS access_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category        text NOT NULL,
  tier            text NOT NULL DEFAULT 'basic', -- 'basic' | 'premium'
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'rescued' | 'expired'
  rescued_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rescued_at      timestamptz,
  expires_at      timestamptz,
  cakto_order_id  text,
  created_at      timestamptz DEFAULT now()
);

-- Impede pedidos duplicados ativos do mesmo user na mesma categoria
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_active
  ON access_requests (requester_id, category)
  WHERE status = 'pending';

-- RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Usuarios veem os proprios pedidos (como requester ou como resgatador)
CREATE POLICY "users_see_own" ON access_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR rescued_by = auth.uid());

-- Usuarios criam os proprios pedidos
CREATE POLICY "users_insert_own" ON access_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- ─── 2. RPC: create_access_request ───────────────────────────────────────────
-- Chamada pelo modal de pedido de acesso (nao-Black)
-- Retorna o UUID do pedido criado (ou existente)

CREATE OR REPLACE FUNCTION create_access_request(
  p_requester_id  uuid,
  p_target_id     uuid,   -- nao usado, mantido para compatibilidade com a UI
  p_type          text,   -- categoria (ex: 'trisal')
  p_tier          text    -- 'basic' | 'premium'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Tenta inserir; ignora conflito (pedido ja existe)
  INSERT INTO access_requests (requester_id, category, tier)
  VALUES (p_requester_id, p_type, p_tier)
  ON CONFLICT DO NOTHING;

  -- Retorna o id do pedido ativo (seja o recém-criado ou o existente)
  SELECT id INTO v_id
  FROM access_requests
  WHERE requester_id = p_requester_id
    AND category = p_type
    AND status = 'pending'
  LIMIT 1;

  RETURN v_id;
END;
$$;

-- ─── 3. RPC: get_available_requests ──────────────────────────────────────────
-- Pedidos pendentes nas categorias do Black logado

CREATE OR REPLACE FUNCTION get_available_requests(p_user_id uuid)
RETURNS TABLE (
  id            uuid,
  requester_id  uuid,
  category      text,
  tier          text,
  city          text,
  state         text,
  age           int,
  display_name  text,
  created_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- So executa se o caller for Black
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND plan = 'black'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ar.id,
    ar.requester_id,
    ar.category,
    ar.tier,
    p.city,
    p.state,
    p.age::int,
    split_part(p.name, ' ', 1) AS display_name,
    ar.created_at
  FROM access_requests ar
  JOIN profiles p      ON p.id = ar.requester_id
  JOIN profiles caller ON caller.id = p_user_id
  WHERE ar.status = 'pending'
    AND ar.requester_id != p_user_id
    AND ar.rescued_by IS NULL
    AND ar.category = ANY(caller.camarote_interests)
  ORDER BY ar.created_at DESC;
END;
$$;

-- ─── 4. RPC: get_my_rescued_requests ─────────────────────────────────────────
-- Resgates ativos feitos por este Black

CREATE OR REPLACE FUNCTION get_my_rescued_requests(p_user_id uuid)
RETURNS TABLE (
  id            uuid,
  requester_id  uuid,
  category      text,
  city          text,
  state         text,
  age           int,
  display_name  text,
  rescued_at    timestamptz,
  expires_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.requester_id,
    ar.category,
    p.city,
    p.state,
    p.age::int,
    split_part(p.name, ' ', 1) AS display_name,
    ar.rescued_at,
    ar.expires_at
  FROM access_requests ar
  JOIN profiles p ON p.id = ar.requester_id
  WHERE ar.rescued_by = p_user_id
    AND ar.status = 'rescued'
    AND ar.expires_at > now()
  ORDER BY ar.rescued_at DESC;
END;
$$;

-- ─── 5. RPC: activate_access_request ─────────────────────────────────────────
-- Chamada pelo webhook Cakto apos pagamento confirmado

CREATE OR REPLACE FUNCTION activate_access_request(
  p_request_id      uuid,
  p_paid_by         uuid,
  p_cakto_order_id  text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE access_requests SET
    status         = 'rescued',
    rescued_by     = p_paid_by,
    rescued_at     = now(),
    expires_at     = now() + interval '30 days',
    cakto_order_id = p_cakto_order_id
  WHERE id = p_request_id
    AND status = 'pending';
END;
$$;

-- ─── RPCs do Camarote Black — Resgates ─────────────────────────────────────────
-- Rodar no Supabase SQL Editor

-- 1. get_available_requests: retorna pedidos pendentes que o usuario pode resgatar
--    (nao sao dele, categoria bate com seus interesses, status = pending)
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
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ar.id,
    ar.requester_id,
    ar.category,
    COALESCE(p.plan, 'essencial') AS tier,
    COALESCE(p.city, '')          AS city,
    COALESCE(p.state, '')         AS state,
    CASE
      WHEN p.birthdate IS NOT NULL
        THEN EXTRACT(YEAR FROM age(now(), p.birthdate))::int
      ELSE 0
    END AS age,
    COALESCE(p.display_name, p.full_name, 'Anonimo') AS display_name,
    ar.created_at
  FROM access_requests ar
  JOIN profiles p ON p.id = ar.requester_id
  WHERE ar.status = 'pending'
    AND ar.requester_id != p_user_id
    AND ar.category = ANY (
      SELECT unnest(pp.camarote_interests)
      FROM profiles pp
      WHERE pp.id = p_user_id
    )
  ORDER BY ar.created_at DESC
  LIMIT 50;
$$;

-- 2. get_my_rescued_requests: retorna pedidos que o usuario ja resgatou
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
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ar.id,
    ar.requester_id,
    ar.category,
    COALESCE(p.city, '')          AS city,
    COALESCE(p.state, '')         AS state,
    CASE
      WHEN p.birthdate IS NOT NULL
        THEN EXTRACT(YEAR FROM age(now(), p.birthdate))::int
      ELSE 0
    END AS age,
    COALESCE(p.display_name, p.full_name, 'Anonimo') AS display_name,
    ar.created_at AS rescued_at,
    ar.expires_at
  FROM access_requests ar
  JOIN profiles p ON p.id = ar.requester_id
  WHERE ar.rescued_by = p_user_id
    AND ar.status = 'rescued'
  ORDER BY ar.created_at DESC
  LIMIT 50;
$$;

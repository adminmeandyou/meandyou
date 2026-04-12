-- =============================================
-- RPC: award_xp
-- Incrementa profiles.xp e recalcula profiles.xp_level.
-- Retorna o XP efetivamente concedido (após multiplicador de bônus).
-- Chamada em: api/xp/award/route.ts, api/loja/gastar/route.ts, api/moderar-foto/route.ts
-- Execute no Supabase SQL Editor
-- =============================================

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id    uuid,
  p_event_type text,
  p_base_xp    integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_until  timestamptz;
  v_final_xp     integer;
  v_novo_xp      integer;
  v_novo_nivel   integer;
BEGIN
  -- Verifica bônus 2x ativo
  SELECT xp_bonus_until INTO v_bonus_until
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_bonus_until IS NOT NULL AND v_bonus_until > now() THEN
    v_final_xp := p_base_xp * 2;
  ELSE
    v_final_xp := p_base_xp;
  END IF;

  -- Incrementa XP e recalcula nível
  -- Fórmula de nível: floor(sqrt(xp / 100))
  -- Nível 0 = 0 XP, Nível 1 = 100 XP, Nível 2 = 400 XP, Nível 3 = 900 XP ...
  UPDATE public.profiles
  SET
    xp       = COALESCE(xp, 0) + v_final_xp,
    xp_level = floor(sqrt((COALESCE(xp, 0) + v_final_xp)::float / 100))::integer
  WHERE id = p_user_id
  RETURNING xp, xp_level INTO v_novo_xp, v_novo_nivel;

  -- Retorna o XP efetivamente concedido
  RETURN v_final_xp;
END;
$$;

-- Autenticados podem chamar (via supabase client no frontend — api/xp/award)
-- service_role também pode (via supabaseAdmin em api/loja/gastar e api/moderar-foto)
REVOKE ALL ON FUNCTION public.award_xp(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer) TO service_role;

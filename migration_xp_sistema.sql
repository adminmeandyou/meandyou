-- Sistema de XP revisado — fórmula de níveis até 500, recompensas por level-up
-- Rodar no Supabase SQL Editor

-- ── 1. Recria award_xp com fórmula correta (100 * N^1.3) ─────────────────

DROP FUNCTION IF EXISTS public.award_xp(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id    uuid,
  p_event_type text,
  p_base_xp    integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_until  timestamptz;
  v_final_xp     integer;
  v_old_level    integer;
  v_novo_xp      integer;
  v_novo_nivel   integer;
  v_level_up     boolean := false;
  v_tickets_ganhos integer := 0;
BEGIN
  SELECT xp_bonus_until, xp_level INTO v_bonus_until, v_old_level
  FROM public.profiles WHERE id = p_user_id;

  -- Aplica 2x se bônus ativo
  IF v_bonus_until IS NOT NULL AND v_bonus_until > now() THEN
    v_final_xp := p_base_xp * 2;
  ELSE
    v_final_xp := p_base_xp;
  END IF;

  -- Calcula novo nível: menor N onde 100*N^1.3 > xp total
  -- Equivalente: N = floor((xp/100)^(1/1.3))
  UPDATE public.profiles
  SET
    xp       = COALESCE(xp, 0) + v_final_xp,
    xp_level = LEAST(500, floor(power((COALESCE(xp, 0) + v_final_xp)::float / 100.0, 1.0/1.3))::integer)
  WHERE id = p_user_id
  RETURNING xp, xp_level INTO v_novo_xp, v_novo_nivel;

  -- Detecta level-up
  IF v_novo_nivel > COALESCE(v_old_level, 0) THEN
    v_level_up := true;
    -- Tickets por faixa de nível
    IF v_novo_nivel <= 50 THEN
      v_tickets_ganhos := (v_novo_nivel - COALESCE(v_old_level, 0)) * 1;
    ELSIF v_novo_nivel <= 200 THEN
      v_tickets_ganhos := (v_novo_nivel - COALESCE(v_old_level, 0)) * 2;
    ELSE
      v_tickets_ganhos := (v_novo_nivel - COALESCE(v_old_level, 0)) * 3;
    END IF;
    -- Credita tickets
    IF v_tickets_ganhos > 0 THEN
      INSERT INTO public.user_tickets (user_id, amount)
      VALUES (p_user_id, v_tickets_ganhos)
      ON CONFLICT (user_id) DO UPDATE
        SET amount = public.user_tickets.amount + v_tickets_ganhos;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded',      v_final_xp,
    'xp_total',        v_novo_xp,
    'xp_level',        v_novo_nivel,
    'level_up',        v_level_up,
    'tickets_ganhos',  v_tickets_ganhos
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer) TO service_role;

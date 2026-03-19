-- =============================================
-- SISTEMA DE XP — Migration
-- Execute no Supabase SQL Editor
-- =============================================

-- Adicionar colunas de XP na tabela profiles (se não existirem)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_bonus_until timestamptz,
  ADD COLUMN IF NOT EXISTS xp_log jsonb DEFAULT '[]';

-- RPC: award_xp
-- Concede XP ao usuário e atualiza level se necessário
-- Retorna: xp_awarded, new_total_xp, new_level

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_base_xp integer DEFAULT 0,
  p_multiplier float DEFAULT NULL
)
RETURNS TABLE(
  xp_awarded integer,
  new_total_xp integer,
  new_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp integer;
  v_current_level integer;
  v_xp_gained integer;
  v_new_total integer;
  v_new_level integer;
  v_bonus_multiplier float := 1.0;
BEGIN
  -- Buscar XP atual, level e bônus ativo
  SELECT xp, xp_level, xp_bonus_until INTO v_current_xp, v_current_level, v_bonus_multiplier
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_xp IS NULL THEN
    v_current_xp := 0;
  END IF;
  IF v_current_level IS NULL THEN
    v_current_level := 0;
  END IF;

  -- Se bônus está ativo (xp_bonus_until > now()), usar multiplicador
  IF v_bonus_multiplier IS NULL THEN
    v_bonus_multiplier := 1.0;
  ELSIF v_bonus_multiplier <= 1.0 THEN
    v_bonus_multiplier := 1.0;
  END IF;

  -- Se um multiplicador foi passado explicitamente, ele prevalece
  IF p_multiplier IS NOT NULL AND p_multiplier > v_bonus_multiplier THEN
    v_bonus_multiplier := p_multiplier;
  END IF;

  -- Calcular XP ganho com multiplicador
  v_xp_gained := ROUND(p_base_xp * v_bonus_multiplier)::integer;

  v_new_total := v_current_xp + v_xp_gained;

  -- Calcular novo level
  -- Fórmula: level = floor((sqrt(1 + 8 * total_xp / 100) - 1) / 2)
  v_new_level := floor((sqrt(1 + 8 * v_new_total / 100.0) - 1) / 2);

  -- Atualizar perfil
  UPDATE public.profiles
  SET xp = v_new_total,
      xp_level = v_new_level,
      updated_at = now()
  WHERE id = p_user_id;

  -- Registrar no xp_log se a coluna existir
  BEGIN
    UPDATE public.profiles
    SET xp_log = array_append(COALESCE(xp_log, '[]'), jsonb_build_object(
      'amount', v_xp_gained,
      'type', p_event_type,
      'total', v_new_total,
      'level', v_new_level,
      'multiplier', v_bonus_multiplier,
      'at', now()
    ))
    WHERE id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN QUERY SELECT v_xp_gained, v_new_total, v_new_level;
END;
$$;

-- RPC: get_xp_stats — retorna estatísticas do usuário
CREATE OR REPLACE FUNCTION public.get_xp_stats(p_user_id uuid)
RETURNS TABLE(
  total_xp integer,
  current_level integer,
  xp_to_next_level integer,
  progress_percent float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp integer;
  v_level integer;
  v_xp_for_level integer;
  v_xp_next_level integer;
BEGIN
  SELECT xp, xp_level INTO v_xp, v_level
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_xp IS NULL THEN
    v_xp := 0;
  END IF;
  IF v_level IS NULL THEN
    v_level := 0;
  END IF;

  -- XP necessário para o level atual: level * 100 * (level + 1) / 2
  -- Fórmula inversa: xp_acumulado_para_n = n*(n+1)/2 * 100
  v_xp_for_level := (v_level * (v_level + 1) / 2) * 100;
  v_xp_next_level := ((v_level + 1) * (v_level + 2) / 2) * 100;

  RETURN QUERY SELECT
    v_xp,
    v_level,
    (v_xp_next_level - v_xp) as xp_to_next_level,
    LEAST(100.0, GREATEST(0.0, (v_xp - v_xp_for_level)::float / ((v_xp_next_level - v_xp_for_level)::float) * 100.0)) as progress_percent;
END;
$$;

-- FIM DA MIGRATION XP

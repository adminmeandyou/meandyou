-- Migration: Corrige swipes (cooldown 30 dias), matches mutuos e presenca em salas
-- Data: 2026-03-28
-- Status: PENDENTE — rodar no Supabase SQL Editor
-- Bugs corrigidos:
--   1. Perfis reaparecem apos swipe (search_profiles nao filtrava likes/dislikes)
--   2. Match nao era criado quando dois usuarios davam like mutuo (process_like)
--   3. Sala mostrava usuarios fantasma (heartbeat + cleanup)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Garantir que dislikes tem created_at para cooldown de 30 dias
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dislikes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.dislikes ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Garantir que o upsert atualiza o created_at (para resetar o cooldown)
-- Se a coluna ja existia mas nao tinha default:
ALTER TABLE public.dislikes ALTER COLUMN created_at SET DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Garantir que likes tem created_at
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'likes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.likes ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC search_profiles — CORRIGIDA
--    Agora exclui:
--    - Perfis que voce ja deu like nos ultimos 30 dias
--    - Perfis que voce ja deu dislike nos ultimos 30 dias
--    - Perfis em ghost mode
--    - Voce mesmo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_profiles(
  p_user_id         uuid,
  p_lat             double precision DEFAULT NULL,
  p_lng             double precision DEFAULT NULL,
  p_max_distance_km integer DEFAULT 50,
  p_min_age         integer DEFAULT 18,
  p_max_age         integer DEFAULT 120,
  p_gender          text DEFAULT NULL
)
RETURNS TABLE(
  id              uuid,
  name            text,
  birthdate       date,
  bio             text,
  city            text,
  state           text,
  gender          text,
  pronouns        text,
  photo_best      text,
  distance_km     double precision,
  age             integer,
  profile_score   integer,
  last_active_at  timestamptz,
  show_last_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_cutoff timestamptz := now() - interval '30 days';
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.birthdate,
    p.bio,
    p.city,
    p.state,
    p.gender,
    p.pronouns,
    p.photo_best,
    -- Calculo de distancia (se lat/lng disponiveis)
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND p.lat IS NOT NULL AND p.lng IS NOT NULL THEN
        ROUND((
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(p_lat)) * cos(radians(p.lat)) *
              cos(radians(p.lng) - radians(p_lng)) +
              sin(radians(p_lat)) * sin(radians(p.lat))
            ))
          )
        )::numeric, 1)::double precision
      ELSE NULL
    END AS distance_km,
    -- Idade calculada
    EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate))::integer AS age,
    -- Score interno (nao exibir ao usuario)
    COALESCE(p.profile_score, 0)::integer AS profile_score,
    p.last_seen AS last_active_at,
    COALESCE(p.show_last_active, true) AS show_last_active
  FROM profiles p
  WHERE p.id != p_user_id
    -- Filtro de idade
    AND p.birthdate IS NOT NULL
    AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate)) BETWEEN p_min_age AND p_max_age
    -- Filtro de genero (null = todos)
    AND (p_gender IS NULL OR p.gender = p_gender)
    -- Excluir ghost mode
    AND (p.ghost_mode_until IS NULL OR p.ghost_mode_until <= now())
    -- Excluir incognito
    AND (p.incognito_until IS NULL OR p.incognito_until <= now())
    -- COOLDOWN 30 DIAS: excluir perfis que eu ja dei like
    AND NOT EXISTS (
      SELECT 1 FROM likes l
      WHERE l.user_id = p_user_id
        AND l.target_id = p.id
        AND l.created_at > v_cutoff
    )
    -- COOLDOWN 30 DIAS: excluir perfis que eu ja dei dislike
    AND NOT EXISTS (
      SELECT 1 FROM dislikes d
      WHERE d.from_user = p_user_id
        AND d.to_user = p.id
        AND d.created_at > v_cutoff
    )
    -- Excluir perfis com match ativo comigo
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.status = 'active'
        AND ((m.user1 = p_user_id AND m.user2 = p.id) OR (m.user1 = p.id AND m.user2 = p_user_id))
    )
    -- Filtro de distancia (se localização disponivel)
    AND (
      p_lat IS NULL OR p_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL
      OR (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(p_lat)) * cos(radians(p.lat)) *
            cos(radians(p.lng) - radians(p_lng)) +
            sin(radians(p_lat)) * sin(radians(p.lat))
          ))
        )
      ) <= p_max_distance_km
    )
    -- Perfil precisa ter pelo menos nome e foto
    AND p.name IS NOT NULL
    AND p.name != ''
  ORDER BY
    -- Boosted primeiro (tratado client-side, aqui ordena por score)
    COALESCE(p.profile_score, 0) DESC,
    p.last_seen DESC NULLS LAST
  LIMIT 100;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC process_like — CORRIGIDA
--    Agora detecta match mutuo corretamente e cria o match
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_like(
  p_user_id      uuid,
  p_target_id    uuid,
  p_is_superlike boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mutual      boolean := false;
  v_match_id    uuid;
  v_existing_like uuid;
  v_existing_match uuid;
BEGIN
  -- Evitar like em si mesmo
  IF p_user_id = p_target_id THEN
    RETURN jsonb_build_object('is_match', false, 'error', 'cannot_like_self');
  END IF;

  -- Verificar se ja existe match ativo entre os dois
  SELECT id INTO v_existing_match
  FROM matches
  WHERE status = 'active'
    AND ((user1 = p_user_id AND user2 = p_target_id)
      OR (user1 = p_target_id AND user2 = p_user_id))
  LIMIT 1;

  IF v_existing_match IS NOT NULL THEN
    RETURN jsonb_build_object('is_match', true, 'match_id', v_existing_match::text);
  END IF;

  -- Inserir ou atualizar o like (upsert)
  INSERT INTO likes (user_id, target_id, is_superlike, created_at)
  VALUES (p_user_id, p_target_id, p_is_superlike, now())
  ON CONFLICT (user_id, target_id)
  DO UPDATE SET is_superlike = p_is_superlike, created_at = now();

  -- Remover dislike anterior se existir (deu like agora, cancela o dislike)
  DELETE FROM dislikes
  WHERE from_user = p_user_id AND to_user = p_target_id;

  -- Verificar se o outro usuario ja deu like em mim (match mutuo)
  SELECT l.user_id INTO v_existing_like
  FROM likes l
  WHERE l.user_id = p_target_id
    AND l.target_id = p_user_id
  LIMIT 1;

  IF v_existing_like IS NOT NULL THEN
    -- MATCH! Criar o match
    v_mutual := true;
    v_match_id := gen_random_uuid();

    INSERT INTO matches (id, user1, user2, status, created_at)
    VALUES (v_match_id, p_user_id, p_target_id, 'active', now());
  END IF;

  RETURN jsonb_build_object(
    'is_match', v_mutual,
    'match_id', CASE WHEN v_mutual THEN v_match_id::text ELSE NULL END
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SALAS: Adicionar last_heartbeat para presenca real
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_members' AND column_name = 'last_heartbeat'
  ) THEN
    ALTER TABLE public.room_members ADD COLUMN last_heartbeat timestamptz DEFAULT now();
  END IF;
END $$;

-- RPC para heartbeat: atualiza timestamp de atividade do membro na sala
CREATE OR REPLACE FUNCTION public.room_heartbeat(
  p_room_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE room_members
  SET last_heartbeat = now()
  WHERE room_id = p_room_id::uuid
    AND user_id = p_user_id;
END;
$$;

-- RPC para cleanup: remove membros inativos (sem heartbeat ha mais de 2 minutos)
CREATE OR REPLACE FUNCTION public.room_cleanup_inactive(
  p_room_id text
)
RETURNS TABLE(user_id uuid, nickname text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retorna os membros que serao removidos (para notificar)
  RETURN QUERY
  SELECT rm.user_id, rm.nickname
  FROM room_members rm
  WHERE rm.room_id = p_room_id::uuid
    AND rm.last_heartbeat < now() - interval '2 minutes';

  -- Remove os inativos
  DELETE FROM room_members
  WHERE room_id = p_room_id::uuid
    AND last_heartbeat < now() - interval '2 minutes';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Indices para performance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_likes_user_target ON public.likes (user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_target_user ON public.likes (target_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_from_to ON public.dislikes (from_user, to_user);
CREATE INDEX IF NOT EXISTS idx_dislikes_created ON public.dislikes (from_user, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches (user1, user2, status);
CREATE INDEX IF NOT EXISTS idx_room_members_heartbeat ON public.room_members (room_id, last_heartbeat);

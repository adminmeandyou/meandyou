-- Migration: Restaura search_profiles corretamente
-- Remove referência a profile_score (coluna que não existe)
-- Ordenação: último visto primeiro (boost é tratado no client-side)

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
    EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate))::integer AS age,
    (
      -- Perfil completo
      CASE WHEN p.photo_best IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN p.photo_face IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN p.photo_body IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN p.bio IS NOT NULL AND length(p.bio) > 30 THEN 20 ELSE 0 END +
      CASE WHEN p.highlight_tags IS NOT NULL AND array_length(p.highlight_tags, 1) > 0 THEN 15 ELSE 0 END +
      CASE WHEN p.city IS NOT NULL AND p.city != '' THEN 10 ELSE 0 END +
      CASE WHEN p.pronouns IS NOT NULL AND p.pronouns != '' THEN 5 ELSE 0 END +
      CASE WHEN p.verified = true THEN 10 ELSE 0 END +
      -- Atividade recente
      CASE WHEN p.last_seen > now() - interval '1 day'   THEN 40 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '3 days'  THEN 20 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '7 days'  THEN 10 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '30 days' THEN 5  ELSE 0 END
    )::integer AS profile_score,
    p.last_seen AS last_active_at,
    COALESCE(p.show_last_active, true) AS show_last_active
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.birthdate IS NOT NULL
    AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate)) BETWEEN p_min_age AND p_max_age
    AND (p_gender IS NULL OR p.gender = p_gender)
    AND (
      p.ghost_mode_until IS NULL
      OR p.ghost_mode_until <= now()
      OR EXISTS (
        SELECT 1 FROM likes l
        WHERE l.user_id = p.id AND l.target_id = p_user_id
      )
    )
    AND (p.incognito_until IS NULL OR p.incognito_until <= now())
    AND NOT EXISTS (
      SELECT 1 FROM likes l
      WHERE l.user_id = p_user_id
        AND l.target_id = p.id
        AND l.created_at > v_cutoff
    )
    AND NOT EXISTS (
      SELECT 1 FROM dislikes d
      WHERE d.from_user = p_user_id
        AND d.to_user = p.id
        AND d.created_at > v_cutoff
    )
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.status = 'active'
        AND m.created_at > v_cutoff
        AND ((m.user1 = p_user_id AND m.user2 = p.id) OR (m.user1 = p.id AND m.user2 = p_user_id))
    )
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
    AND p.name IS NOT NULL
    AND p.name != ''
  ORDER BY
    (
      CASE WHEN p.photo_best IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN p.photo_face IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN p.photo_body IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN p.bio IS NOT NULL AND length(p.bio) > 30 THEN 20 ELSE 0 END +
      CASE WHEN p.highlight_tags IS NOT NULL AND array_length(p.highlight_tags, 1) > 0 THEN 15 ELSE 0 END +
      CASE WHEN p.city IS NOT NULL AND p.city != '' THEN 10 ELSE 0 END +
      CASE WHEN p.pronouns IS NOT NULL AND p.pronouns != '' THEN 5 ELSE 0 END +
      CASE WHEN p.verified = true THEN 10 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '1 day'   THEN 40 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '3 days'  THEN 20 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '7 days'  THEN 10 ELSE 0 END +
      CASE WHEN p.last_seen > now() - interval '30 days' THEN 5  ELSE 0 END
    ) DESC NULLS LAST
  LIMIT 100;
END;
$$;

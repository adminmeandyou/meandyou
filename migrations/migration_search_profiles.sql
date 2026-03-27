-- RPC search_profiles — busca perfis para o feed de descobrir
-- Parametros: p_user_id, p_lat, p_lng, p_max_distance_km, p_min_age, p_max_age, p_gender
-- Retorna: perfis filtrados por distancia, idade, genero, excluindo o proprio usuario,
--          usuarios banidos, ghost mode ativo, e perfis sem onboarding completo.

CREATE OR REPLACE FUNCTION public.search_profiles(
  p_user_id         uuid,
  p_lat             double precision DEFAULT NULL,
  p_lng             double precision DEFAULT NULL,
  p_max_distance_km integer DEFAULT 50,
  p_min_age         integer DEFAULT 18,
  p_max_age         integer DEFAULT 120,
  p_gender          text DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  name             text,
  birthdate        date,
  bio              text,
  city             text,
  state            text,
  gender           text,
  pronouns         text,
  photo_best       text,
  distance_km      double precision,
  age              integer,
  profile_score    integer,
  last_active_at   timestamptz,
  show_last_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    -- Calcula distancia em km (se ambos tiverem lat/lng)
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND p.lat IS NOT NULL AND p.lng IS NOT NULL THEN
        ROUND(
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(p_lat)) * cos(radians(p.lat)) *
              cos(radians(p.lng) - radians(p_lng)) +
              sin(radians(p_lat)) * sin(radians(p.lat))
            ))
          ))::numeric
        , 1)::double precision
      ELSE 0.0
    END AS distance_km,
    -- Calcula idade
    EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate))::integer AS age,
    -- Score simples para ordenacao
    (CASE WHEN p.photo_best IS NOT NULL THEN 10 ELSE 0 END +
     CASE WHEN p.bio IS NOT NULL AND length(p.bio) > 30 THEN 5 ELSE 0 END)::integer AS profile_score,
    p.last_active_at,
    p.show_last_active
  FROM profiles p
  LEFT JOIN users u ON u.id = p.id
  WHERE
    -- Exclui o proprio usuario
    p.id != p_user_id
    -- Apenas perfis com onboarding completo
    AND p.onboarding_completed = true
    -- Exclui banidos
    AND COALESCE(u.banned, false) = false
    -- Exclui ghost mode ativo
    AND (p.ghost_mode_until IS NULL OR p.ghost_mode_until < NOW())
    -- Exclui incognito (conta pausada)
    AND (p.incognito_until IS NULL OR p.incognito_until < NOW())
    -- Filtro de idade
    AND p.birthdate IS NOT NULL
    AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate)) >= p_min_age
    AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate)) <= p_max_age
    -- Filtro de genero (null = todos)
    AND (p_gender IS NULL OR p.gender = p_gender)
    -- Filtro de distancia (se tem localizacao)
    AND (
      p_lat IS NULL OR p_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL
      OR (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(p.lat))
        ))
      )) <= p_max_distance_km
    )
  ORDER BY profile_score DESC, last_active_at DESC NULLS LAST
  LIMIT 100;
END;
$$;

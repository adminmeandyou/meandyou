-- =============================================================
-- SETUP DO USUARIO ADMIN DEV — MeAndYou
-- =============================================================
-- COMO USAR:
--   1. Va em Supabase Dashboard > Authentication > Users
--   2. Clique em "Add user" > "Create new user"
--   3. Email: devadmin@meandyou.dev  |  Senha: (escolha uma forte)
--   4. Copie o UUID do usuario criado
--   5. Substitua 'COLE_O_UUID_AQUI' abaixo pelo UUID copiado
--   6. Execute este script no Supabase SQL Editor
-- =============================================================

DO $$
DECLARE
  dev_id UUID := 'COLE_O_UUID_AQUI';  -- <-- substituir pelo UUID real
BEGIN

  -- ── Perfil completo ──────────────────────────────────────────────────────
  INSERT INTO profiles (
    id,
    name,
    display_name,
    bio,
    birthdate,
    gender,
    pronouns,
    city,
    state,
    role,
    verified,
    last_seen,
    created_at,
    photo_best,
    photo_face,
    photo_body,
    photo_extra1,
    photo_extra2,
    highlight_tags,
    status_temp,
    profile_question,
    profile_question_answer,
    blur_photos,
    show_last_active,
    notifications_email,
    ghost_mode_until
  ) VALUES (
    dev_id,
    'Dev Admin',
    'DevAdmin',
    'Usuario de desenvolvimento para testar todas as funcionalidades do app. Nao e um perfil real.',
    '1993-06-15',
    'homem',
    'ele/dele',
    'Sao Paulo',
    'SP',
    'admin',         -- <-- acesso total ao painel admin
    true,            -- verificado
    NOW(),
    NOW(),
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ARRAY['Tecnologia', 'Games', 'Musica', 'Viagem', 'Fotografia'],
    'role',
    'Qual seu maior sonho?',
    'Criar conexoes reais entre pessoas.',
    false,
    true,
    true,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    verified = true,
    last_seen = NOW();

  -- ── Filtros preenchidos ──────────────────────────────────────────────────
  INSERT INTO filters (
    user_id,
    gender_preference,
    min_age,
    max_age,
    max_distance,
    show_verified_only
  ) VALUES (
    dev_id,
    ARRAY['mulher', 'homem', 'nao_binario'],
    18,
    55,
    100,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- ── Assinatura Black (plano maximo) ─────────────────────────────────────
  INSERT INTO subscriptions (
    user_id,
    plan,
    status,
    started_at,
    expires_at
  ) VALUES (
    dev_id,
    'black',
    'active',
    NOW(),
    NOW() + INTERVAL '10 years'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'black',
    status = 'active',
    expires_at = NOW() + INTERVAL '10 years';

  -- ── Fichas ───────────────────────────────────────────────────────────────
  INSERT INTO user_fichas (user_id, amount)
  VALUES (dev_id, 99999)
  ON CONFLICT (user_id) DO UPDATE SET amount = 99999;

  -- ── SuperLikes ───────────────────────────────────────────────────────────
  INSERT INTO user_superlikes (user_id, amount)
  VALUES (dev_id, 999)
  ON CONFLICT (user_id) DO UPDATE SET amount = 999;

  -- ── Boosts ───────────────────────────────────────────────────────────────
  INSERT INTO user_boosts (user_id, amount, active_until)
  VALUES (dev_id, 99, NULL)
  ON CONFLICT (user_id) DO UPDATE SET amount = 99;

  -- ── Lupas ────────────────────────────────────────────────────────────────
  INSERT INTO user_lupas (user_id, amount)
  VALUES (dev_id, 99)
  ON CONFLICT (user_id) DO UPDATE SET amount = 99;

  -- ── Rewinds ──────────────────────────────────────────────────────────────
  INSERT INTO user_rewinds (user_id, amount)
  VALUES (dev_id, 99)
  ON CONFLICT (user_id) DO UPDATE SET amount = 99;

  RAISE NOTICE 'Usuario admin dev configurado com sucesso! ID: %', dev_id;
END $$;

-- Verificacao final — deve retornar o perfil com role=admin e plan=black
SELECT
  p.id,
  p.name,
  p.role,
  p.verified,
  s.plan,
  s.status,
  f.amount AS fichas,
  sl.amount AS superlikes,
  b.amount AS boosts
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status = 'active'
LEFT JOIN user_fichas f ON f.user_id = p.id
LEFT JOIN user_superlikes sl ON sl.user_id = p.id
LEFT JOIN user_boosts b ON b.user_id = p.id
WHERE p.id = 'COLE_O_UUID_AQUI';

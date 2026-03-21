-- migration_cadastro_step.sql
-- Funil de cadastro com progresso salvo
-- Rodar no SQL Editor do Supabase

-- 1. Verificação de email na tabela users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verify_token text,
  ADD COLUMN IF NOT EXISTS email_verify_token_expires_at timestamptz;

-- 2. Progresso do onboarding na tabela profiles
--    Valores:
--    0 = email nao verificado
--    1 = email verificado, onboarding nao feito
--    2 = onboarding feito, preencher perfil + verificacao biometrica pendentes
--    3 = tudo concluido, acesso completo
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cadastro_step int DEFAULT 0;

-- 3. Usuarios existentes: marcar email como verificado (ja usam o app)
UPDATE users SET email_verified = true;

-- 4. Usuarios com verificacao biometrica completa = step 3 (acesso total)
UPDATE profiles p
SET cadastro_step = 3
FROM users u
WHERE p.id = u.id AND u.verified = true;

-- 5. Usuarios com onboarding feito mas sem biometria = step 2
UPDATE profiles p
SET cadastro_step = 2
FROM users u
WHERE p.id = u.id
  AND u.verified = false
  AND p.onboarding_done = true
  AND p.cadastro_step < 2;

-- 6. Demais usuarios existentes (email verificado pelo update acima) = step 1
UPDATE profiles
SET cadastro_step = 1
WHERE cadastro_step = 0;

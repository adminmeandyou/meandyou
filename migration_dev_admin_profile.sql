-- =============================================
-- PERFIL DE DEV/ADMIN — devadmin@meandyou.dev
-- UUID: d242ae09-5777-42fd-8b1b-93646f4c605e
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Tabela users (plano Black + dados basicos)
INSERT INTO public.users (id, email, phone, nome_completo, cpf, verified, banned, plan)
VALUES (
  'd242ae09-5777-42fd-8b1b-93646f4c605e',
  'devadmin@meandyou.dev',
  '11999999999',
  'Dev Admin',
  '12345678909',
  true,
  false,
  'black'
)
ON CONFLICT (id) DO UPDATE SET
  plan          = 'black',
  verified      = true,
  banned        = false,
  email         = EXCLUDED.email;

-- 2. Tabela profiles (role admin + onboarding completo)
INSERT INTO public.profiles (id, name, onboarding_done, role, bio)
VALUES (
  'd242ae09-5777-42fd-8b1b-93646f4c605e',
  'Dev Admin',
  true,
  'admin',
  'Perfil de desenvolvimento e testes.'
)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  onboarding_done = true,
  role           = 'admin';

-- 3. Saldos (999 de tudo para testar sem limitacoes)
INSERT INTO public.user_tickets (user_id, amount)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 999)
ON CONFLICT (user_id) DO UPDATE SET amount = 999;

INSERT INTO public.user_lupas (user_id, amount)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 999)
ON CONFLICT (user_id) DO UPDATE SET amount = 999;

INSERT INTO public.user_superlikes (user_id, amount)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 999)
ON CONFLICT (user_id) DO UPDATE SET amount = 999;

INSERT INTO public.user_boosts (user_id, amount)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 999)
ON CONFLICT (user_id) DO UPDATE SET amount = 999;

INSERT INTO public.user_rewinds (user_id, amount)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 999)
ON CONFLICT (user_id) DO UPDATE SET amount = 999;

-- 4. Streak (365 dias para testar premios raros na roleta)
INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_login_date)
VALUES ('d242ae09-5777-42fd-8b1b-93646f4c605e', 365, 365, CURRENT_DATE)
ON CONFLICT (user_id) DO UPDATE SET
  current_streak  = 365,
  longest_streak  = 365,
  last_login_date = CURRENT_DATE;

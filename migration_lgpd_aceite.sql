-- LGPD: registro do aceite de Termos/Privacidade e confirmação de maioridade no cadastro.
-- Aditiva (só adiciona colunas nullable). Seguro rodar mais de uma vez.
alter table public.users add column if not exists terms_accepted_at timestamptz;
alter table public.users add column if not exists terms_version     text;
alter table public.users add column if not exists age_confirmed     boolean;

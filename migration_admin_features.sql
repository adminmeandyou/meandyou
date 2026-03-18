-- migration_admin_features.sql
-- Rodar no Supabase SQL Editor em: https://supabase.com/dashboard

-- ═══════════════════════════════════════════
-- Tabela de reports de bugs
-- ═══════════════════════════════════════════
create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  descricao text not null,
  screenshot_url text,
  status text not null default 'pendente' check (status in ('pendente', 'verificado', 'recusado')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id)
);

alter table bug_reports enable row level security;

create policy "user_insert_own_bug" on bug_reports
  for insert with check (auth.uid() = user_id);

create policy "user_select_own_bug" on bug_reports
  for select using (auth.uid() = user_id);

create policy "service_role_all_bug" on bug_reports
  using (true) with check (true);

-- ═══════════════════════════════════════════
-- Tabela de configurações de notificações automáticas
-- ═══════════════════════════════════════════
create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  canal text not null check (canal in ('email', 'whatsapp')),
  ativo boolean not null default false,
  webhook_url text,
  dias_inatividade int,
  updated_at timestamptz not null default now(),
  unique(evento, canal)
);

alter table notification_settings enable row level security;
create policy "service_role_all_notif" on notification_settings using (true) with check (true);

-- Seed de eventos padrão
insert into notification_settings (evento, canal, ativo) values
  ('new_user', 'email', false),
  ('new_user', 'whatsapp', false),
  ('payment_approved', 'email', false),
  ('payment_approved', 'whatsapp', false),
  ('plan_cancelled', 'email', false),
  ('plan_cancelled', 'whatsapp', false),
  ('user_inactive', 'email', false),
  ('user_inactive', 'whatsapp', false),
  ('new_match', 'email', false),
  ('new_match', 'whatsapp', false)
on conflict (evento, canal) do nothing;

-- ═══════════════════════════════════════════
-- Tabela de histórico de campanhas de marketing
-- ═══════════════════════════════════════════
create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  segmento text not null default 'todos',
  total_destinatarios int not null default 0,
  status text not null default 'enviado' check (status in ('enviado', 'falhou')),
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

alter table marketing_campaigns enable row level security;
create policy "service_role_all_camp" on marketing_campaigns using (true) with check (true);

-- ═══════════════════════════════════════════
-- Bucket bug-screenshots: criar manualmente no Supabase Dashboard
-- Storage → New Bucket → Name: bug-screenshots → Public: NÃO
-- ═══════════════════════════════════════════

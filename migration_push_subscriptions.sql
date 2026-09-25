-- F9: tabela usada por api/push/subscribe e src/lib/push.ts, mas que não existia no banco.
-- Sem ela nenhuma notificação push é salva nem enviada.
-- Acesso só pelo servidor (service_role); RLS ligado sem policies = cliente não lê nem grava.
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

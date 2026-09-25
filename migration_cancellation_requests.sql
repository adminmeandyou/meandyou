-- F8: tabela usada por api/assinatura/cancelar e /admin/cancelamentos, mas que não existia
-- no banco (o registro do cancelamento sumia calado e a tela do admin dava erro).
-- Gravação só pelo servidor (service_role). Leitura/atualização só por admin/equipe.
create table if not exists public.cancellation_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid,
  plan            text not null default 'desconhecido',
  status          text not null default 'pending' check (status in ('pending', 'processing', 'done')),
  requested_at    timestamptz not null default now(),
  processed_at    timestamptz
);

-- FK extra para o embed `users ( email )` usado na tela do admin
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cancellation_requests_user_id_users_fkey') then
    alter table public.cancellation_requests
      add constraint cancellation_requests_user_id_users_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end $$;

create index if not exists cancellation_requests_requested_at_idx on public.cancellation_requests (requested_at desc);

alter table public.cancellation_requests enable row level security;

drop policy if exists cancellation_requests_staff_select on public.cancellation_requests;
create policy cancellation_requests_staff_select on public.cancellation_requests
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.staff_members s where s.user_id = auth.uid() and coalesce(s.active, true))
  );

drop policy if exists cancellation_requests_staff_update on public.cancellation_requests;
create policy cancellation_requests_staff_update on public.cancellation_requests
  for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.staff_members s where s.user_id = auth.uid() and coalesce(s.active, true))
  );

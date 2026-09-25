-- Tabela usada como registro de eventos e base dos limites de tentativa (rate limit):
--   api/moderar-foto (10 uploads/hora — cada upload chama o Sightengine, que é pago)
--   api/validar-token (tentativas por IP)
-- Ela não existia no banco, então os dois limites NÃO funcionavam.
-- Só o servidor acessa (RLS ligado, sem policies). metadata pode ter IP: pela política
-- de privacidade, logs de segurança ficam no máximo 6 meses (limpeza abaixo, se usar pg_cron).
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_type_created_idx on public.analytics_events (user_id, event_type, created_at desc);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);

alter table public.analytics_events enable row level security;

-- Limpeza de 6 meses (rodar só se a extensão pg_cron estiver ativa no projeto):
-- select cron.schedule('limpa_analytics_events', '0 4 * * *',
--   $$delete from public.analytics_events where created_at < now() - interval '6 months'$$);

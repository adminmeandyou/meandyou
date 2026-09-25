create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
create schema auth; grant usage on schema auth to anon, authenticated, service_role;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claims', true)::json->>'role' $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create table public.profiles (id uuid primary key, name text, birthdate date, bio text, cep text, rua text, bairro text, city text, state text, lat float8, lng float8,
  role text default 'user', banned boolean default false, banned_reason text, deleted_at timestamptz, last_seen timestamptz, verified boolean default false,
  verified_plus boolean default false, plan text, plan_override text, plan_override_until timestamptz, xp int default 0, xp_level int default 1, xp_bonus_until timestamptz,
  curtidas_reveals_until timestamptz, ghost_mode_until timestamptz, camarote_expires_at timestamptz, couple_id uuid, referral_code text, referred_by uuid,
  reg_email_verified boolean default false, reg_document_verified boolean default false, reg_facial_verified boolean default false,
  onboarding_completed boolean default false, show_last_active boolean default true, notifications_email boolean default true, incognito_until timestamptz, photo_best text);
create table public.users (id uuid primary key, email text, cpf text, plan text, verified boolean default false, banned boolean default false, email_verified boolean default false);
create table public.staff_members (id uuid primary key default gen_random_uuid(), user_id uuid, role text, active boolean default true);
do $$ declare t text; begin foreach t in array array['user_fichas','user_superlikes','user_boosts','user_tickets','user_lupas','user_rewinds'] loop
  execute format('create table public.%I (user_id uuid primary key, amount int default 0)', t); end loop; end $$;
create table public.friendships (id uuid primary key default gen_random_uuid(), requester_id uuid, receiver_id uuid, status text);
create table public.room_members (room_id uuid, user_id uuid, nickname text);
create table public.room_messages (id uuid primary key default gen_random_uuid(), room_id uuid, sender_id uuid, content text);
create table public.subscriptions (id uuid primary key, user_id uuid);
create table public.matches (id uuid primary key default gen_random_uuid(), user1 uuid, user2 uuid);

-- RLS "como está em produção": dono edita qualquer coluna; perfis legíveis por todos
alter table public.profiles enable row level security;
create policy p_sel on public.profiles for select using (true);
create policy p_upd on public.profiles for update using (auth.uid() = id);
create policy p_ins on public.profiles for insert with check (auth.uid() = id);
alter table public.users enable row level security;
create policy u_sel on public.users for select using (auth.uid() = id);
create policy u_upd on public.users for update using (auth.uid() = id);
do $$ declare t text; begin foreach t in array array['user_fichas','user_superlikes','user_boosts','user_tickets','user_lupas','user_rewinds'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy s on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t); end loop; end $$;
-- friendships com RLS DESLIGADO (para testar o ramo ensure_rls); room_messages com RLS e policy aberta
alter table public.room_messages enable row level security;
create policy rm_all on public.room_messages for all using (true) with check (true);
alter table public.staff_members enable row level security;
create policy sm_sel on public.staff_members for select using (auth.uid() = user_id);

grant all on all tables in schema public to anon, authenticated, service_role;

create view public.admin_users as select p.id, p.name, u.email from public.profiles p join public.users u on u.id = p.id;
create view public.admin_metrics as select count(*) total from public.profiles;
create view public.admin_revenue as select 1 as x;
create view public.admin_signups_daily as select 1 as y;
grant select on public.admin_users, public.admin_metrics, public.admin_revenue, public.admin_signups_daily to anon, authenticated;

create function public.admin_ban_user(p_user_id uuid, p_reason text, p_admin_id uuid) returns void language sql security definer as $$ update public.profiles set banned = true, banned_reason = p_reason where id = p_user_id $$;
create function public.admin_unban_user(p_user_id uuid) returns void language sql security definer as $$ update public.profiles set banned = false where id = p_user_id $$;
create function public.admin_resolve_report(p_report_id uuid, p_action text, p_admin_id uuid) returns void language sql security definer as $$ select 1 $$;

create function public.get_my_matches(p_user_id uuid) returns table(match_id uuid, other_user_id uuid) language sql security definer as $$
  select id, case when user1 = p_user_id then user2 else user1 end from public.matches where p_user_id in (user1, user2) $$;
create function public.get_my_conversations(p_user_id uuid) returns table(match_id uuid) language sql security definer as $$ select id from public.matches where p_user_id in (user1, user2) $$;
-- process_like: decrementa superlike via SECURITY DEFINER (deve continuar funcionando com o trigger de saldo)
create function public.process_like(p_user_id uuid, p_target_id uuid, p_is_superlike boolean default false) returns jsonb language plpgsql security definer as $$
begin
  if p_is_superlike then update public.user_superlikes set amount = amount - 1 where user_id = p_user_id; end if;
  return jsonb_build_object('ok', true, 'as', p_user_id);
end $$;
create function public.room_heartbeat(p_room_id uuid, p_user_id uuid) returns void language sql security definer as $$ select 1 $$;
create function public.search_profiles(p_user_id uuid, p_gender text default null, p_lat float8 default null, p_lng float8 default null, p_max_age int default 99, p_max_distance_km int default 100, p_min_age int default 18)
  returns setof public.profiles language sql security definer as $$ select * from public.profiles where id <> p_user_id $$;
create function public.update_daily_streak(p_user_id uuid) returns integer language sql security definer as $$ select 1 $$;

-- dados: A (comum), B (comum), ADM (admin)
insert into public.profiles (id, name, role, lat, lng, rua) values
 ('aaaaaaaa-0000-0000-0000-000000000001','A','user',-23.55,-46.63,'Rua A'),
 ('bbbbbbbb-0000-0000-0000-000000000002','B','user',-22.90,-43.20,'Rua B'),
 ('cccccccc-0000-0000-0000-000000000003','ADM','admin',null,null,null);
insert into public.users (id, email) select id, name || '@x.com' from public.profiles;
insert into public.user_superlikes values ('aaaaaaaa-0000-0000-0000-000000000001', 3), ('bbbbbbbb-0000-0000-0000-000000000002', 3);
insert into public.user_fichas values ('aaaaaaaa-0000-0000-0000-000000000001', 0);
insert into public.matches (user1, user2) values ('bbbbbbbb-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003');
insert into public.friendships (requester_id, receiver_id, status) values ('bbbbbbbb-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003','accepted');
insert into public.room_members values ('11111111-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000002','bee');
insert into public.room_messages (room_id, sender_id, content) values ('11111111-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000002','oi');

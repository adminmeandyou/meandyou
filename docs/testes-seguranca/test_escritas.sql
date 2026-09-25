-- Rodar depois de test.sql (usa pg_temp.t) e das tabelas extras abaixo no mock:
-- alter table matches add column status text default 'active'; create table user_video_extra(user_id uuid primary key, amount int); create table access_requests(id uuid primary key default gen_random_uuid(), requester_id uuid, status text); create table user_badges(id uuid primary key default gen_random_uuid(), user_id uuid, badge_id uuid); create table couple_profiles(id uuid primary key default gen_random_uuid(), user1_id uuid, user2_id uuid); grant all on all tables in schema public to anon, authenticated, service_role;
create or replace function pg_temp.t(nome text, sql text, deve_falhar boolean) returns text language plpgsql as $$
declare r text;
begin
  begin
    execute sql into r;
    return case when deve_falhar then 'FALHOU (passou, mas devia bloquear): ' else 'ok: ' end || nome || coalesce(' -> ' || r, '');
  exception when others then
    return case when deve_falhar then 'ok (bloqueado): ' else 'FALHOU (bloqueou indevido): ' end || nome || ' [' || sqlerrm || ']';
  end;
end $$;
grant execute on function pg_temp.t(text,text,boolean) to public;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', false);
set role authenticated;
select pg_temp.t('B cria match com A',         $q$insert into matches(user1,user2) values (auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001') returning 'x'$q$, true);
select pg_temp.t('B muda user2 do match',      $q$update matches set user2='aaaaaaaa-0000-0000-0000-000000000001' where user1=auth.uid() returning 'x'$q$, true);
select pg_temp.t('B reativa match (status active)', $q$update matches set status='active' where user1=auth.uid() returning 'x'$q$, true);
select pg_temp.t('B desfaz match (legítimo)',  $q$update matches set status='blocked' where user1=auth.uid() returning status$q$, false);
select pg_temp.t('B apaga match',              $q$delete from matches where user1=auth.uid() returning 'x'$q$, true);
select pg_temp.t('B minutos grátis',           $q$insert into user_video_extra values (auth.uid(), 999) returning 'x'$q$, true);
select pg_temp.t('B access_request aprovado',  $q$insert into access_requests(requester_id,status) values (auth.uid(),'approved') returning 'x'$q$, true);
select pg_temp.t('B emblema',                  $q$insert into user_badges(user_id,badge_id) values (auth.uid(), gen_random_uuid()) returning 'x'$q$, true);
select pg_temp.t('B casal com A',              $q$insert into couple_profiles(user1_id,user2_id) values (auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001') returning 'x'$q$, true);
reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
set role service_role;
select pg_temp.t('SRV cria match',             $q$insert into matches(user1,user2) values ('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003') returning 'ok'$q$, false);
select pg_temp.t('SRV credita minutos',        $q$insert into user_video_extra values ('aaaaaaaa-0000-0000-0000-000000000001', 10) returning 'ok'$q$, false);
reset role;

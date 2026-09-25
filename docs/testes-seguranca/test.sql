\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set ADM '''cccccccc-0000-0000-0000-000000000003'''
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

-- ===== como usuário comum A =====
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', false);
set role authenticated;
select pg_temp.t('A vira admin',            $q$update profiles set role='admin' where id=auth.uid() returning role$q$, true);
select pg_temp.t('A plano black',           $q$update profiles set plan='black' where id=auth.uid() returning plan$q$, true);
select pg_temp.t('A se verifica',           $q$update profiles set verified=true where id=auth.uid() returning verified$q$, true);
select pg_temp.t('A users.verified',        $q$update users set verified=true where id=auth.uid() returning verified$q$, true);
select pg_temp.t('A users.email_verified',  $q$update users set email_verified=true where id=auth.uid() returning email_verified$q$, true);
select pg_temp.t('A 9999 fichas',           $q$update user_fichas set amount=9999 where user_id=auth.uid() returning amount$q$, true);
select pg_temp.t('A insere perfil admin',   $q$insert into profiles(id, role) values ('dddddddd-0000-0000-0000-000000000004','admin') returning id$q$, true);
select pg_temp.t('A edita bio (legítimo)',  $q$update profiles set bio='oi' where id=auth.uid() returning bio$q$, false);
select pg_temp.t('A lat/lng (legítimo)',    $q$update profiles set lat=1, lng=2, last_seen=now() where id=auth.uid() returning 'ok'$q$, false);
select pg_temp.t('A pausa conta (legítimo)',$q$update profiles set incognito_until=now()+interval '30 days' where id=auth.uid() returning 'ok'$q$, false);
select pg_temp.t('A onboarding upsert',     $q$insert into profiles(id, onboarding_completed) values (auth.uid(), true) on conflict (id) do update set onboarding_completed = excluded.onboarding_completed returning 'ok'$q$, false);
select pg_temp.t('A lê perfis (colunas ok)',$q$select count(*)::text from (select id, name, city, bio, verified from profiles) x$q$, false);
select pg_temp.t('A lê rua de B',           $q$select rua from profiles where id='bbbbbbbb-0000-0000-0000-000000000002'$q$, true);
select pg_temp.t('A lê lat de B',           $q$select lat::text from profiles where id='bbbbbbbb-0000-0000-0000-000000000002'$q$, true);
select pg_temp.t('A lê friendships alheias',$q$select count(*)::text from friendships$q$, false);
select pg_temp.t('A lê room_messages alheias',$q$select count(*)::text from room_messages$q$, false);
select pg_temp.t('A lê admin_users',        $q$select count(*)::text from admin_users$q$, true);
select pg_temp.t('A lê admin_metrics',      $q$select total::text from admin_metrics$q$, true);
select pg_temp.t('A bane B via RPC',        $q$select admin_ban_user('bbbbbbbb-0000-0000-0000-000000000002','x','aaaaaaaa-0000-0000-0000-000000000001')::text$q$, true);
select pg_temp.t('A lê matches de B',       $q$select count(*)::text from get_my_matches('bbbbbbbb-0000-0000-0000-000000000002')$q$, true);
select pg_temp.t('A lê conversas de B',     $q$select count(*)::text from get_my_conversations('bbbbbbbb-0000-0000-0000-000000000002')$q$, true);
select pg_temp.t('A lê os próprios matches',$q$select count(*)::text from get_my_matches('aaaaaaaa-0000-0000-0000-000000000001')$q$, false);
select pg_temp.t('A like como B',           $q$select process_like('bbbbbbbb-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003', true)::text$q$, true);
select pg_temp.t('A superlike próprio (RPC desconta saldo)', $q$select process_like('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002', true)::text$q$, false);
select pg_temp.t('A search_profiles próprio (default args)', $q$select count(*)::text from search_profiles('aaaaaaaa-0000-0000-0000-000000000001')$q$, false);
select pg_temp.t('A room_heartbeat de B',   $q$select room_heartbeat('11111111-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000002')::text$q$, true);
select pg_temp.t('A distância até B',       $q$select get_user_distance(null,'bbbbbbbb-0000-0000-0000-000000000002')::text$q$, false);
select pg_temp.t('A chama _impl direto',    $q$select count(*)::text from get_my_matches_impl('bbbbbbbb-0000-0000-0000-000000000002')$q$, true);
reset role;

-- ===== como B (membro da sala, parte da amizade) =====
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', false);
set role authenticated;
select pg_temp.t('B lê suas friendships',   $q$select count(*)::text from friendships$q$, false);
select pg_temp.t('B lê msgs da sua sala',   $q$select count(*)::text from room_messages$q$, false);
select pg_temp.t('B grava msg na sala',     $q$insert into room_messages(room_id, sender_id, content) values ('11111111-0000-0000-0000-000000000000', auth.uid(), 'x') returning 'ok'$q$, false);
select pg_temp.t('B cria amizade (RLS estava off)', $q$insert into friendships(requester_id, receiver_id) values (auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001') returning 'ok'$q$, false);
reset role;

-- ===== como ADMIN pelo navegador =====
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', false);
set role authenticated;
select pg_temp.t('ADM aprova verificação de A', $q$update profiles set verified=true where id='aaaaaaaa-0000-0000-0000-000000000001' returning 'ok'$q$, false);
select pg_temp.t('ADM lê matches de B (staff)', $q$select count(*)::text from get_my_matches('bbbbbbbb-0000-0000-0000-000000000002')$q$, false);
reset role;

-- ===== como servidor (service_role) =====
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
set role service_role;
select pg_temp.t('SRV muda plano de A',     $q$update profiles set plan='black' where id='aaaaaaaa-0000-0000-0000-000000000001' returning plan$q$, false);
select pg_temp.t('SRV credita fichas',      $q$update user_fichas set amount=10 where user_id='aaaaaaaa-0000-0000-0000-000000000001' returning amount::text$q$, false);
select pg_temp.t('SRV lê admin_users',      $q$select count(*)::text from admin_users$q$, false);
select pg_temp.t('SRV bane via RPC',        $q$select admin_ban_user('bbbbbbbb-0000-0000-0000-000000000002','teste','cccccccc-0000-0000-0000-000000000003')::text$q$, false);
select pg_temp.t('SRV matches de B',        $q$select count(*)::text from get_my_matches('bbbbbbbb-0000-0000-0000-000000000002')$q$, false);
reset role;

-- ===== anônimo =====
select set_config('request.jwt.claims', '{"role":"anon"}', false);
set role anon;
select pg_temp.t('anon lê friendships',     $q$select count(*)::text from friendships$q$, false);
select pg_temp.t('anon lê room_messages',   $q$select count(*)::text from room_messages$q$, false);
reset role;
select 'saldo superlike A depois do superlike: ' || amount from user_superlikes where user_id = :A;

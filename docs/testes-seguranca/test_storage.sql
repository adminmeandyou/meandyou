-- Mock extra: create schema storage; create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text); RLS + policy aberta 'for all using(true)'; grants para anon/authenticated/service_role.
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
select pg_temp.t('cliente sobe em fotos',      $q$insert into storage.objects(bucket_id,name) values ('fotos','y/1.jpg') returning 'x'$q$, true);
select pg_temp.t('cliente sobe em documentos', $q$insert into storage.objects(bucket_id,name) values ('documentos','y/frente.jpg') returning 'x'$q$, true);
select pg_temp.t('cliente troca foto',         $q$update storage.objects set name='z' where bucket_id='fotos' returning 'x'$q$, false);
select pg_temp.t('cliente apaga foto',         $q$delete from storage.objects where bucket_id='fotos' returning 'x'$q$, false);
select pg_temp.t('cliente lista documentos',   $q$select count(*)::text from storage.objects where bucket_id='documentos'$q$, false);
select pg_temp.t('cliente lê fotos',           $q$select count(*)::text from storage.objects where bucket_id='fotos'$q$, false);
select pg_temp.t('cliente usa outro bucket',   $q$insert into storage.objects(bucket_id,name) values ('outro','b.txt') returning 'ok'$q$, false);
reset role;
select 'fotos restantes (esperado 1): ' || count(*) from storage.objects where bucket_id='fotos';
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
set role service_role;
select pg_temp.t('servidor sobe em documentos', $q$insert into storage.objects(bucket_id,name) values ('documentos','y/selfie.jpg') returning 'ok'$q$, false);
reset role;

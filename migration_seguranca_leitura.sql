-- ============================================================================
-- SEGURANÇA S4: vazamento de leitura (testado em produção em 2026-09-25)
-- ============================================================================
-- 1. Qualquer usuário logado lia TODAS as colunas de TODOS os perfis, inclusive
--    endereço (rua, bairro, cep) e coordenada exata (lat, lng).
-- 2. room_messages e friendships eram legíveis até sem login (chave anon).
--
-- O app não lê essas colunas de endereço pelo navegador (as APIs do servidor usam
-- service_role e continuam lendo normalmente; RPCs SECURITY DEFINER também).
--
-- ATENÇÃO: com privilégio por coluna, uma coluna NOVA em profiles não fica visível
-- ao cliente automaticamente. Ao criar coluna nova que o front precise ler, rode:
--   grant select (nova_coluna) on public.profiles to authenticated;
-- Seguro rodar mais de uma vez. ROLLBACK no final.
-- ============================================================================

-- ── 1. profiles: esconde endereço e coordenadas do cliente ─────────────────
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'profiles'
     and column_name not in ('rua', 'cep', 'bairro', 'lat', 'lng');

  execute 'revoke select on public.profiles from anon, authenticated';
  execute format('grant select (%s) on public.profiles to authenticated, anon', cols);
end $$;

-- Se o RLS estiver DESLIGADO na tabela, liga e cria policy permissiva equivalente ao
-- comportamento atual (tudo liberado), para não quebrar gravações feitas pelo app.
-- A restrição de leitura vem das policies RESTRICTIVE abaixo.
create or replace function pg_temp.meandyou_ensure_rls(p_table text) returns void
language plpgsql as $f$
begin
  if not (select relrowsecurity from pg_class where oid = ('public.' || p_table)::regclass) then
    execute format('alter table public.%I enable row level security', p_table);
    execute format('drop policy if exists meandyou_legacy_open on public.%I', p_table);
    execute format('create policy meandyou_legacy_open on public.%I for all to anon, authenticated using (true) with check (true)', p_table);
  end if;
end $f$;

-- ── 2. friendships: só as partes envolvidas leem ────────────────────────────
select pg_temp.meandyou_ensure_rls('friendships');
drop policy if exists meandyou_friendships_only_parties on public.friendships;
create policy meandyou_friendships_only_parties
  on public.friendships
  as restrictive
  for select
  to anon, authenticated
  using (auth.uid() is not null and auth.uid() in (requester_id, receiver_id));

-- ── 3. room_messages: só membros da sala leem ───────────────────────────────
select pg_temp.meandyou_ensure_rls('room_messages');
drop policy if exists meandyou_room_messages_only_members on public.room_messages;
create policy meandyou_room_messages_only_members
  on public.room_messages
  as restrictive
  for select
  to anon, authenticated
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.room_members m
       where m.room_id = room_messages.room_id
         and m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ROLLBACK (só se algo quebrar):
-- grant select on public.profiles to anon, authenticated;
-- drop policy if exists meandyou_friendships_only_parties on public.friendships;
-- drop policy if exists meandyou_room_messages_only_members on public.room_messages;
-- ============================================================================

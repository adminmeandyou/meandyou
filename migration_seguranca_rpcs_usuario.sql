-- ============================================================================
-- SEGURANÇA S7: RPCs que confiam no ID de usuário enviado pelo cliente
-- ============================================================================
-- Testado em produção em 2026-09-25 (usuário temporário, só contagem de linhas):
-- get_my_conversations(p_user_id) e get_my_matches(p_user_id) devolvem as conversas
-- e matches de QUALQUER usuário cujo ID for passado. As demais abaixo têm o mesmo
-- padrão (ex.: process_like permite curtir "como" outra pessoa).
--
-- Correção sem depender do código atual das funções (que pode ser diferente do repo):
--   1. renomeia a função original para <nome>_impl e tira o EXECUTE do cliente
--   2. cria <nome> com a MESMA assinatura, que exige ID = auth.uid() quando a chamada
--      vem do navegador (auth.role() = authenticated/anon) e então chama a _impl.
-- Chamadas do servidor (service_role), cron/rotinas internas (sem JWT) e admin/equipe
-- passam direto. Depende de public.meandyou_is_staff (migration_seguranca_colunas_protegidas.sql).
-- Seguro rodar mais de uma vez (pula as que já estão protegidas).
-- ============================================================================

do $$
declare
  alvo   record;
  f      record;
  args   text;
  ident  text;
  result text;
  chamada text;
  corpo  text;
begin
  for alvo in
    select * from (values
      ('get_my_conversations',    'p_user_id'),
      ('get_my_matches',          'p_user_id'),
      ('get_available_requests',  'p_user_id'),
      ('get_my_rescued_requests', 'p_user_id'),
      ('get_highlights',          'p_user_id'),
      ('process_like',            'p_user_id'),
      ('room_heartbeat',          'p_user_id'),
      ('search_profiles',         'p_user_id'),
      ('update_daily_streak',     'p_user_id'),
      ('create_access_request',   'p_requester_id'),
      ('rescue_access_request',   'p_rescuer_id')
    ) as t(nome, param)
  loop
    -- já protegida?
    if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname = alvo.nome || '_impl') then
      raise notice '% já protegida, pulando', alvo.nome;
      continue;
    end if;

    for f in
      select p.oid, p.proargnames, p.pronargs
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = alvo.nome
    loop
      if not (alvo.param = any (f.proargnames)) then
        raise notice '% não tem parâmetro %, pulando', alvo.nome, alvo.param;
        continue;
      end if;

      args   := pg_get_function_arguments(f.oid);
      ident  := pg_get_function_identity_arguments(f.oid);
      result := pg_get_function_result(f.oid);
      select string_agg(format('%1$I => %1$I', a), ', ')
        into chamada
        from unnest(f.proargnames[1:f.pronargs]) a;

      execute format('alter function public.%I(%s) rename to %I', alvo.nome, ident, alvo.nome || '_impl');
      execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', alvo.nome || '_impl', ident);
      execute format('grant execute on function public.%I(%s) to service_role', alvo.nome || '_impl', ident);

      corpo := format($g$
        if coalesce(auth.role(), '') in ('authenticated', 'anon')
           and %1$I is distinct from auth.uid()
           and not public.meandyou_is_staff(auth.uid()) then
          raise exception 'Operação não permitida' using errcode = '42501';
        end if;
      $g$, alvo.param);

      if result ilike 'TABLE(%' or result ilike 'SETOF %' then
        corpo := corpo || format('return query select * from public.%I(%s);', alvo.nome || '_impl', chamada);
      elsif result = 'void' then
        corpo := corpo || format('perform public.%I(%s); return;', alvo.nome || '_impl', chamada);
      else
        corpo := corpo || format('return public.%I(%s);', alvo.nome || '_impl', chamada);
      end if;

      execute format(
        'create function public.%I(%s) returns %s language plpgsql security definer set search_path = public as $w$ begin %s end $w$',
        alvo.nome, args, result, corpo);
      execute format('grant execute on function public.%I(%s) to anon, authenticated, service_role', alvo.nome, ident);

      raise notice '% protegida', alvo.nome;
    end loop;
  end loop;
end $$;

-- ============================================================================
-- ROLLBACK de uma função (ex.: get_my_matches):
--   drop function public.get_my_matches(uuid);
--   alter function public.get_my_matches_impl(uuid) rename to get_my_matches;
--   grant execute on function public.get_my_matches(uuid) to anon, authenticated;
-- ============================================================================

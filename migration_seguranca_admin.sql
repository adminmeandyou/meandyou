-- ============================================================================
-- SEGURANÇA S6 (testado em produção em 2026-09-25 com usuário temporário)
-- ============================================================================
-- Qualquer usuário logado conseguia, direto do navegador:
--   * ler a view admin_users (todos os usuários com e-mail, nome completo, idade,
--     cidade, denúncias) e admin_metrics
--   * executar admin_ban_user / admin_unban_user / admin_resolve_report
--     (banir qualquer pessoa, se desbanir, encerrar denúncias)
-- O painel agora usa api/admin/consulta e api/admin/acao (checam admin no servidor
-- e usam service_role). Este script tira o acesso direto de anon/authenticated.
--
-- APLICAR SÓ DEPOIS de publicar o código novo do painel, senão o /admin para
-- de carregar essas telas até o deploy sair.
-- ============================================================================

revoke all on public.admin_users          from anon, authenticated;
revoke all on public.admin_metrics        from anon, authenticated;
revoke all on public.admin_revenue        from anon, authenticated;
revoke all on public.admin_signups_daily  from anon, authenticated;
grant select on public.admin_users, public.admin_metrics, public.admin_revenue, public.admin_signups_daily to service_role;

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('admin_ban_user', 'admin_unban_user', 'admin_resolve_report')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.assinatura);
    execute format('grant execute on function %s to service_role', f.assinatura);
  end loop;
end $$;

-- ROLLBACK:
-- grant select on public.admin_users, public.admin_metrics, public.admin_revenue, public.admin_signups_daily to authenticated;
-- grant execute on function public.admin_ban_user(uuid, text, uuid), public.admin_unban_user(uuid), public.admin_resolve_report(uuid, text, uuid) to authenticated;

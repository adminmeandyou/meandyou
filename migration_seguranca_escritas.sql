-- ============================================================================
-- SEGURANÇA S8: gravações diretas pelo navegador que não deveriam existir
-- (testado em produção em 2026-09-25 com usuário temporário; linhas gravadas foram apagadas)
--   * matches: usuário criava match com QUALQUER pessoa sem curtida mútua
--   * user_video_extra: minutos de vídeo (item pago) de graça
--   * access_requests: pedido de acesso já "aprovado"
--   * user_badges / couple_profiles: emblema e vínculo de casal com qualquer um
-- Pelo navegador o app só faz em matches: update status = 'blocked' (desfazer match).
-- O resto é feito por APIs do servidor / RPCs SECURITY DEFINER, que continuam livres.
-- Depende de migration_seguranca_colunas_protegidas.sql (meandyou_is_staff e
-- meandyou_block_client_writes). Seguro rodar mais de uma vez.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['user_video_extra', 'access_requests', 'user_badges', 'couple_profiles'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists meandyou_block_client_writes on public.%I', t);
      execute format(
        'create trigger meandyou_block_client_writes before insert or update or delete on public.%I
           for each row execute function public.meandyou_block_client_writes()', t);
    end if;
  end loop;
end $$;

create or replace function public.meandyou_protect_matches()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return coalesce(new, old);
  end if;
  if public.meandyou_is_staff(auth.uid()) then
    return coalesce(new, old);
  end if;
  -- único uso legítimo pelo navegador: desfazer match (status -> 'blocked')
  if tg_op = 'UPDATE'
     and new.status = 'blocked'
     and (to_jsonb(new) - 'status' - 'updated_at') = (to_jsonb(old) - 'status' - 'updated_at') then
    return new;
  end if;
  raise exception 'Alteração não permitida' using errcode = '42501';
end;
$$;

drop trigger if exists meandyou_protect_matches on public.matches;
create trigger meandyou_protect_matches
  before insert or update or delete on public.matches
  for each row execute function public.meandyou_protect_matches();

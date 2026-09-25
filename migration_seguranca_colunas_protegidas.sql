-- ============================================================================
-- SEGURANÇA S1: impede que usuário comum altere colunas sensíveis pelo navegador
-- ============================================================================
-- Problema (testado em produção em 2026-09-25): com a chave anon + sessão própria,
-- qualquer usuário fazia UPDATE em profiles/users/saldos e virava admin, plano Black,
-- verificado, desbanido e com 9999 fichas/superlikes/boosts/etc.
--
-- Como funciona: triggers BEFORE que só agem quando o comando vem DIRETO do cliente
-- (current_user = 'authenticated' ou 'anon', que é o papel usado pelo PostgREST).
-- Passam livres:
--   * APIs do servidor com service_role
--   * RPCs SECURITY DEFINER (rodam como dono da função, ex.: process_swipe)
--   * admins (profiles.role = 'admin') e equipe ativa (staff_members.active)
--
-- Seguro rodar mais de uma vez. Para desfazer, ver bloco ROLLBACK no final.
-- ============================================================================

-- Quem é equipe/admin (SECURITY DEFINER para ler staff_members/profiles sem depender de RLS)
create or replace function public.meandyou_is_staff(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = p_uid and role = 'admin')
      or exists (select 1 from public.staff_members where user_id = p_uid and coalesce(active, true))
$$;

revoke all on function public.meandyou_is_staff(uuid) from public;
grant execute on function public.meandyou_is_staff(uuid) to authenticated, anon, service_role;

-- ── profiles: bloqueia colunas sensíveis ─────────────────────────────────────
create or replace function public.meandyou_protect_profiles()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if public.meandyou_is_staff(auth.uid()) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role                   is distinct from old.role
    or new.banned                 is distinct from old.banned
    or new.banned_reason          is distinct from old.banned_reason
    or new.verified               is distinct from old.verified
    or new.verified_plus          is distinct from old.verified_plus
    or new.plan                   is distinct from old.plan
    or new.plan_override          is distinct from old.plan_override
    or new.plan_override_until    is distinct from old.plan_override_until
    or new.xp                     is distinct from old.xp
    or new.xp_level               is distinct from old.xp_level
    or new.xp_bonus_until         is distinct from old.xp_bonus_until
    or new.curtidas_reveals_until is distinct from old.curtidas_reveals_until
    or new.ghost_mode_until       is distinct from old.ghost_mode_until
    or new.camarote_expires_at    is distinct from old.camarote_expires_at
    or new.couple_id              is distinct from old.couple_id
    or new.referral_code          is distinct from old.referral_code
    or new.referred_by            is distinct from old.referred_by
    or new.deleted_at             is distinct from old.deleted_at
    or new.reg_email_verified     is distinct from old.reg_email_verified
    or new.reg_document_verified  is distinct from old.reg_document_verified
    or new.reg_facial_verified    is distinct from old.reg_facial_verified
    then
      raise exception 'Alteração não permitida' using errcode = '42501';
    end if;
  elsif tg_op = 'INSERT' then
    if coalesce(new.role, 'user') <> 'user'
    or coalesce(new.verified, false)
    or coalesce(new.verified_plus, false)
    or coalesce(new.banned, false)
    or new.plan in ('plus', 'black')
    or new.plan_override is not null
    or new.plan_override_until is not null
    or coalesce(new.xp, 0) > 0
    or new.xp_bonus_until is not null
    or new.curtidas_reveals_until is not null
    or new.ghost_mode_until is not null
    or new.camarote_expires_at is not null
    or new.couple_id is not null
    or coalesce(new.reg_email_verified, false)
    or coalesce(new.reg_document_verified, false)
    or coalesce(new.reg_facial_verified, false)
    then
      raise exception 'Alteração não permitida' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists meandyou_protect_profiles on public.profiles;
create trigger meandyou_protect_profiles
  before insert or update on public.profiles
  for each row execute function public.meandyou_protect_profiles();

-- ── users, saldos: o cliente nunca escreve nessas tabelas, só o servidor ────
create or replace function public.meandyou_block_client_writes()
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
  raise exception 'Alteração não permitida' using errcode = '42501';
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users',
    'user_fichas', 'user_superlikes', 'user_boosts',
    'user_tickets', 'user_lupas', 'user_rewinds'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists meandyou_block_client_writes on public.%I', t);
      execute format(
        'create trigger meandyou_block_client_writes before insert or update or delete on public.%I
           for each row execute function public.meandyou_block_client_writes()', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- ROLLBACK (só se algo quebrar — copie e rode separadamente):
-- drop trigger if exists meandyou_protect_profiles on public.profiles;
-- drop trigger if exists meandyou_block_client_writes on public.users;
-- drop trigger if exists meandyou_block_client_writes on public.user_fichas;
-- drop trigger if exists meandyou_block_client_writes on public.user_superlikes;
-- drop trigger if exists meandyou_block_client_writes on public.user_boosts;
-- drop trigger if exists meandyou_block_client_writes on public.user_tickets;
-- drop trigger if exists meandyou_block_client_writes on public.user_lupas;
-- drop trigger if exists meandyou_block_client_writes on public.user_rewinds;
-- ============================================================================

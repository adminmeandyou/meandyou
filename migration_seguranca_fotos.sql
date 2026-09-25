-- ============================================================================
-- SEGURANÇA S11: URL de foto de perfil arbitrária
-- O editar-perfil grava as URLs das fotos direto em profiles pelo navegador. Um usuário
-- podia pôr qualquer link externo como foto (sem passar pela moderação do Sightengine).
-- Agora, quando o navegador muda uma coluna de foto, o valor novo precisa ser nulo ou
-- uma URL do bucket `fotos` dentro da pasta do próprio usuário (o que api/moderar-foto gera).
-- Valores já gravados não são afetados (só checa coluna que mudou).
-- Seguro rodar mais de uma vez.
-- ============================================================================
create or replace function public.meandyou_check_photo_urls()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  col  text;
  novo text;
  velho text;
  prefixo text;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  prefixo := '%/storage/v1/object/public/fotos/' || new.id::text || '/%';
  foreach col in array array['photo_verification', 'photo_face', 'photo_body', 'photo_side', 'photo_back',
                             'photo_best', 'photo_extra1', 'photo_extra2', 'photo_extra3', 'photo_extra4'] loop
    novo := to_jsonb(new) ->> col;
    velho := case when tg_op = 'UPDATE' then to_jsonb(old) ->> col else null end;
    if novo is not null and novo is distinct from velho and novo not like prefixo then
      raise exception 'Foto inválida' using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists meandyou_check_photo_urls on public.profiles;
create trigger meandyou_check_photo_urls
  before insert or update on public.profiles
  for each row execute function public.meandyou_check_photo_urls();

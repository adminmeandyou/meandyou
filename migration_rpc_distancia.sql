-- F14: RPC usada em /perfil/[id] que não existia no banco (distância aparecia vazia).
-- Calcula no servidor a partir de lat/lng (colunas escondidas do cliente pela
-- migration_seguranca_leitura.sql). Sempre mede a partir de QUEM ESTÁ LOGADO
-- (p_from é ignorado) e arredonda para km inteiro (mínimo 1) para dificultar
-- trilateração da localização exata de outra pessoa.
create or replace function public.get_user_distance(p_from uuid, p_to uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(1, round(
           6371 * 2 * asin(sqrt(
             power(sin(radians(b.lat - a.lat) / 2), 2) +
             cos(radians(a.lat)) * cos(radians(b.lat)) *
             power(sin(radians(b.lng - a.lng) / 2), 2)
           ))
         ))::integer
    from public.profiles a, public.profiles b
   where a.id = auth.uid()
     and b.id = p_to
     and a.lat is not null and a.lng is not null
     and b.lat is not null and b.lng is not null
$$;

revoke all on function public.get_user_distance(uuid, uuid) from public, anon;
grant execute on function public.get_user_distance(uuid, uuid) to authenticated;

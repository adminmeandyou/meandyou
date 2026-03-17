-- ============================================================
-- Migracao: Tabela de Dislikes com cooldown de 30 dias
-- Cole este SQL no Supabase > SQL Editor > New query e execute
-- ============================================================

-- 1. Criar tabela dislikes
CREATE TABLE IF NOT EXISTS public.dislikes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (from_user, to_user)
);

-- 2. Ativar Row Level Security
ALTER TABLE public.dislikes ENABLE ROW LEVEL SECURITY;

-- 3. Politicas RLS
CREATE POLICY "usuario_insere_dislike"
  ON public.dislikes
  FOR INSERT
  WITH CHECK (auth.uid() = from_user);

CREATE POLICY "usuario_ve_dislike"
  ON public.dislikes
  FOR SELECT
  USING (auth.uid() = from_user);

CREATE POLICY "usuario_deleta_dislike"
  ON public.dislikes
  FOR DELETE
  USING (auth.uid() = from_user);

-- 4. Indices para performance
CREATE INDEX IF NOT EXISTS dislikes_from_user_idx
  ON public.dislikes(from_user);

CREATE INDEX IF NOT EXISTS dislikes_lookup_idx
  ON public.dislikes(from_user, to_user, created_at);

-- ============================================================
-- 5. PASSO MANUAL: Editar a funcao search_profiles no Supabase
--
-- Acesse: Supabase > Database > Functions > search_profiles
-- Adicione o trecho abaixo no WHERE da funcao, junto aos outros filtros:
--
--   AND p.id NOT IN (
--     SELECT d.to_user
--     FROM public.dislikes d
--     WHERE d.from_user = p_user_id
--       AND d.created_at > NOW() - INTERVAL '30 days'
--   )
--
-- Isso faz perfis com dislike recente (menos de 30 dias) nao
-- aparecerem no deck. Apos 30 dias voltam automaticamente.
-- ============================================================

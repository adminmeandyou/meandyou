-- Migration: rastreamento de curtidas por modo
-- Cria tabela mode_likes para contar curtidas separadamente por modo de navegacao

CREATE TABLE IF NOT EXISTS public.mode_likes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  mode        VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mode_likes_user_mode_date
  ON public.mode_likes (user_id, mode, (created_at::date));

ALTER TABLE public.mode_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem proprias mode_likes" ON public.mode_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios inserem proprias mode_likes" ON public.mode_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios deletam proprias mode_likes" ON public.mode_likes
  FOR DELETE USING (auth.uid() = user_id);

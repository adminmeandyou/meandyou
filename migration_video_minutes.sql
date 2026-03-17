-- ============================================================
-- Migracao: Tabela video_minutes + funcao register_video_minutes
-- Cole este SQL no Supabase > SQL Editor e execute
-- ============================================================

-- 1. Criar tabela video_minutes (se nao existir)
CREATE TABLE IF NOT EXISTS public.video_minutes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  minutes     integer     NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, date)
);

ALTER TABLE public.video_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprios_minutos"
  ON public.video_minutes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS video_minutes_user_date_idx
  ON public.video_minutes(user_id, date);

-- ============================================================
-- 2. Funcao register_video_minutes
--    Chamada pelo webhook do LiveKit apos fim de sala.
--    Acumula minutos no registro do dia atual para o usuario.
-- ============================================================
CREATE OR REPLACE FUNCTION public.register_video_minutes(
  p_user_id  uuid,
  p_match_id uuid,
  p_minutes  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_minutes <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.video_minutes (user_id, date, minutes, updated_at)
  VALUES (p_user_id, CURRENT_DATE, p_minutes, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    minutes    = public.video_minutes.minutes + EXCLUDED.minutes,
    updated_at = now();
END;
$$;

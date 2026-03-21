-- =============================================
-- ADMIN RECOMPENSAS — Migration
-- Cria streak_calendar_template e atualiza a RPC
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Tabela template do calendário de streak
CREATE TABLE IF NOT EXISTS public.streak_calendar_template (
  day_number  integer PRIMARY KEY,
  reward_type  text    NOT NULL DEFAULT 'ticket',
  reward_amount integer NOT NULL DEFAULT 1
);

-- RLS: somente service role escreve, leitura pública (a RPC usa service role)
ALTER TABLE public.streak_calendar_template ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public_read_streak_template" ON public.streak_calendar_template
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Popular template padrão (30 dias) — só se estiver vazio
INSERT INTO public.streak_calendar_template (day_number, reward_type, reward_amount)
SELECT * FROM (VALUES
  ( 1, 'ticket',        1),
  ( 2, 'supercurtida',  1),
  ( 3, 'ticket',        1),
  ( 4, 'lupa',          1),
  ( 5, 'ticket',        2),
  ( 6, 'supercurtida',  1),
  ( 7, 'boost',         1),
  ( 8, 'ticket',        1),
  ( 9, 'rewind',        1),
  (10, 'ticket',        2),
  (11, 'supercurtida',  2),
  (12, 'lupa',          1),
  (13, 'ticket',        2),
  (14, 'boost',         1),
  (15, 'ticket',        3),
  (16, 'supercurtida',  1),
  (17, 'rewind',        1),
  (18, 'ticket',        2),
  (19, 'lupa',          2),
  (20, 'boost',         1),
  (21, 'ticket',        3),
  (22, 'supercurtida',  2),
  (23, 'invisivel_1d',  1),
  (24, 'ticket',        3),
  (25, 'boost',         2),
  (26, 'lupa',          2),
  (27, 'supercurtida',  3),
  (28, 'ticket',        4),
  (29, 'rewind',        2),
  (30, 'plan_plus_1d',  1)
) AS v(day_number, reward_type, reward_amount)
WHERE NOT EXISTS (SELECT 1 FROM public.streak_calendar_template LIMIT 1);

-- 3. Atualizar a RPC generate_streak_calendar para usar o template
CREATE OR REPLACE FUNCTION public.generate_streak_calendar(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template record;
  v_cycle_size integer := 30;
BEGIN
  -- Apaga calendario existente do usuario (sera recriado)
  DELETE FROM public.streak_calendar WHERE user_id = p_user_id;

  -- Insere 30 dias baseados no template
  FOR v_template IN
    SELECT day_number, reward_type, reward_amount
    FROM public.streak_calendar_template
    ORDER BY day_number
  LOOP
    INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_template.day_number, v_template.reward_type, v_template.reward_amount, false);
  END LOOP;
END;
$$;

-- 4. Atualizar a RPC extend_streak_calendar para usar o template também
CREATE OR REPLACE FUNCTION public.extend_streak_calendar(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_day integer;
  v_template record;
  v_cycle_size integer := 30;
  v_new_day integer;
BEGIN
  -- Pega o maior dia atual do usuario
  SELECT COALESCE(MAX(day_number), 0) INTO v_max_day
  FROM public.streak_calendar
  WHERE user_id = p_user_id;

  -- Adiciona mais 30 dias usando o template (ciclando)
  FOR v_template IN
    SELECT day_number, reward_type, reward_amount
    FROM public.streak_calendar_template
    ORDER BY day_number
  LOOP
    v_new_day := v_max_day + v_template.day_number;
    INSERT INTO public.streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_new_day, v_template.reward_type, v_template.reward_amount, false)
    ON CONFLICT (user_id, day_number) DO NOTHING;
  END LOOP;
END;
$$;

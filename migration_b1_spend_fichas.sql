-- migration_b1_spend_fichas.sql
-- B1: Cria a RPC spend_fichas para debitar fichas do usuario
-- Execute no Supabase SQL Editor

-- Garante que a tabela user_fichas exista (criada pela migration_fichas.sql)
CREATE TABLE IF NOT EXISTS public.user_fichas (
  user_id    uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_fichas ENABLE ROW LEVEL SECURITY;

-- Politica: usuario le proprio saldo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_fichas' AND policyname = 'user_select_own_fichas'
  ) THEN
    CREATE POLICY "user_select_own_fichas" ON public.user_fichas
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- RPC: spend_fichas
-- Debita p_amount fichas do usuario. Retorna true se ok, false se saldo insuficiente.
CREATE OR REPLACE FUNCTION public.spend_fichas(
  p_user_id    uuid,
  p_amount     integer,
  p_description text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  -- Buscar saldo atual
  SELECT amount INTO v_current
  FROM public.user_fichas
  WHERE user_id = p_user_id;

  -- Sem registro = sem fichas
  IF v_current IS NULL THEN
    RETURN false;
  END IF;

  -- Saldo insuficiente
  IF v_current < p_amount THEN
    RETURN false;
  END IF;

  -- Debitar
  UPDATE public.user_fichas
  SET amount     = amount - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- RPC complementar: credit_fichas (upsert de saldo)
-- Ja deve existir, mas recriamos para garantir consistencia de parametros
CREATE OR REPLACE FUNCTION public.credit_fichas(
  p_user_id    uuid,
  p_amount     integer,
  p_description text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_fichas (user_id, amount, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    amount     = public.user_fichas.amount + p_amount,
    updated_at = now();
END;
$$;

-- =============================================
-- ATOMIC INCREMENT: incrementa saldo de qualquer tabela de saldo
-- Resolve race condition em compras simultâneas na loja
-- Execute no Supabase SQL Editor
-- =============================================

-- Função genérica que faz INSERT ... ON CONFLICT DO UPDATE atomicamente
-- Suporta: user_superlikes, user_boosts, user_lupas, user_rewinds, user_fichas, user_tickets
CREATE OR REPLACE FUNCTION public.increment_user_balance(
  p_table  text,
  p_user_id uuid,
  p_amount  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO public.%I (user_id, amount) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET amount = public.%I.amount + $2',
    p_table, p_table
  ) USING p_user_id, p_amount;
END;
$$;

-- Apenas admins/service role podem chamar
REVOKE ALL ON FUNCTION public.increment_user_balance(text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_balance(text, uuid, integer) TO service_role;

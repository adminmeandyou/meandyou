-- ─── Migration: Sistema de Fichas ───────────────────────────────────────────
-- Rodar no Supabase SQL Editor
-- Cria tabela de saldo, tabela de transações e RPCs de crédito/débito

-- 1. Tabela de saldo de fichas
CREATE TABLE IF NOT EXISTS user_fichas (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount    INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de transações (histórico)
CREATE TABLE IF NOT EXISTS fichas_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  order_id    TEXT,   -- Cakto order ID (para créditos)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fichas_transactions_user_idx ON fichas_transactions(user_id, created_at DESC);

-- 3. Colunas extras em profiles para novos itens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS curtidas_reveals_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_bonus_until          TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_plus           BOOLEAN DEFAULT FALSE;

-- 4. RPC: creditar fichas (chamado pelo webhook Cakto)
CREATE OR REPLACE FUNCTION credit_fichas(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_order_id   TEXT,
  p_description TEXT DEFAULT 'Compra de fichas'
) RETURNS void AS $$
BEGIN
  INSERT INTO user_fichas (user_id, amount, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    amount     = user_fichas.amount + EXCLUDED.amount,
    updated_at = NOW();

  INSERT INTO fichas_transactions (user_id, amount, type, description, order_id)
  VALUES (p_user_id, p_amount, 'credit', p_description, p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: gastar fichas (chamado pela API /api/loja/gastar)
CREATE OR REPLACE FUNCTION spend_fichas(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_amount INTEGER;
BEGIN
  SELECT amount INTO current_amount
  FROM user_fichas
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_amount IS NULL OR current_amount < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE user_fichas SET
    amount     = amount - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO fichas_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'debit', p_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS — usuário só vê seu próprio saldo e histórico
ALTER TABLE user_fichas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_fichas_own" ON user_fichas;
CREATE POLICY "user_fichas_own" ON user_fichas
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fichas_transactions_own" ON fichas_transactions;
CREATE POLICY "fichas_transactions_own" ON fichas_transactions
  FOR SELECT USING (auth.uid() = user_id);

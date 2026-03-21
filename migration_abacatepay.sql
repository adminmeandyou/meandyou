-- 1. Tabela payments
CREATE TABLE IF NOT EXISTS payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('subscription','fichas','camarote')),
  gateway_id   text UNIQUE,
  method       text NOT NULL CHECK (method IN ('pix','credit_card')),
  amount       numeric(10,2) NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  metadata     jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  paid_at      timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- 2. Renomear coluna na tabela subscriptions
ALTER TABLE subscriptions RENAME COLUMN cakto_order_id TO gateway_order_id;

-- 3. Adicionar coluna cycle
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cycle text DEFAULT 'monthly'
  CHECK (cycle IN ('monthly','quarterly','semiannual','annual'));

-- 4. Index para idempotencia no webhook
CREATE INDEX IF NOT EXISTS payments_gateway_id_idx ON payments(gateway_id);

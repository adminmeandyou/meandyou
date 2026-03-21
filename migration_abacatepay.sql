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
-- INSERT/UPDATE/DELETE: feito apenas via service_role no backend (sem policy necessaria)

-- 2. Renomear coluna na tabela subscriptions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cakto_order_id'
  ) THEN
    ALTER TABLE subscriptions RENAME COLUMN cakto_order_id TO gateway_order_id;
  END IF;
END $$;

-- 3. Adicionar coluna cycle
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cycle text DEFAULT 'monthly'
  CHECK (cycle IN ('monthly','quarterly','semiannual','annual'));

-- 4. Index para idempotencia no webhook
CREATE INDEX IF NOT EXISTS payments_gateway_id_idx ON payments(gateway_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);

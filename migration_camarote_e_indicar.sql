-- Migration: Camarote Black + Sistema de Indicações
-- Rodar no Supabase SQL Editor

-- ─── 1. Coluna camarote_interests em profiles ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS camarote_interests text[] DEFAULT '{}';

-- ─── 2. Tabela access_requests (pedidos de resgate no camarote) ───────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rescued_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category     text NOT NULL,
  status       text NOT NULL DEFAULT 'pending',  -- pending | rescued | expired
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_requests_requester_idx ON access_requests(requester_id);
CREATE INDEX IF NOT EXISTS access_requests_status_idx    ON access_requests(status);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem seus proprios pedidos" ON access_requests;
CREATE POLICY "Usuarios veem seus proprios pedidos"
  ON access_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = rescued_by);

DROP POLICY IF EXISTS "Usuarios criam seus pedidos" ON access_requests;
CREATE POLICY "Usuarios criam seus pedidos"
  ON access_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Usuarios atualizam seus pedidos" ON access_requests;
CREATE POLICY "Usuarios atualizam seus pedidos"
  ON access_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = rescued_by);

-- ─── 3. Tabela camarote_ratings (avaliações pós-encontro) ────────────────────
CREATE TABLE IF NOT EXISTS camarote_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
  rater_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, rater_id)
);

ALTER TABLE camarote_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios inserem suas proprias avaliacoes" ON camarote_ratings;
CREATE POLICY "Usuarios inserem suas proprias avaliacoes"
  ON camarote_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS "Usuarios veem avaliacoes de seus requests" ON camarote_ratings;
CREATE POLICY "Usuarios veem avaliacoes de seus requests"
  ON camarote_ratings FOR SELECT
  USING (auth.uid() = rater_id OR auth.uid() = rated_id);

-- ─── 4. Tabela camarote_messages (chat do camarote) ──────────────────────────
CREATE TABLE IF NOT EXISTS camarote_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS camarote_messages_request_idx ON camarote_messages(request_id);

ALTER TABLE camarote_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes veem mensagens do request" ON camarote_messages;
CREATE POLICY "Participantes veem mensagens do request"
  ON camarote_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participantes enviam mensagens" ON camarote_messages;
CREATE POLICY "Participantes enviam mensagens"
  ON camarote_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participantes marcam mensagens como lidas" ON camarote_messages;
CREATE POLICY "Participantes marcam mensagens como lidas"
  ON camarote_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
    )
  );

-- ─── 5. Tabela referrals (sistema de indicações) ─────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending',  -- pending | rewarded
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem suas proprias indicacoes" ON referrals;
CREATE POLICY "Usuarios veem suas proprias indicacoes"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Realtime para camarote_messages
ALTER PUBLICATION supabase_realtime ADD TABLE camarote_messages;

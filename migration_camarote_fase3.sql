-- Camarote Black — Fase 3: Chat exclusivo
-- Rodar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS camarote_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) <= 500),
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camarote_messages_request
  ON camarote_messages (request_id, created_at);

ALTER TABLE camarote_messages ENABLE ROW LEVEL SECURITY;

-- Participantes podem ler mensagens (dentro do prazo)
CREATE POLICY "participantes_select" ON camarote_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
        AND ar.expires_at > now()
    )
  );

-- Participantes podem enviar mensagens
CREATE POLICY "participantes_insert" ON camarote_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
        AND ar.expires_at > now()
    )
  );

-- Participantes podem marcar como lida
CREATE POLICY "participantes_update" ON camarote_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM access_requests ar
      WHERE ar.id = request_id
        AND (ar.requester_id = auth.uid() OR ar.rescued_by = auth.uid())
    )
  )
  WITH CHECK (true);

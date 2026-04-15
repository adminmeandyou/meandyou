-- Corrige expire_matches: apaga mensagens antes de apagar o match
-- Antes só deletava o match, deixando mensagens órfãs no banco.

CREATE OR REPLACE FUNCTION expire_matches()
RETURNS void AS $$
BEGIN
  -- Apaga mensagens dos matches sem conversa (7 dias)
  DELETE FROM messages
  WHERE match_id IN (
    SELECT id FROM matches
    WHERE status = 'active'
      AND last_message_at IS NULL
      AND matched_at < NOW() - INTERVAL '7 days'
  );

  -- Apaga o match sem conversa
  DELETE FROM matches
  WHERE status = 'active'
    AND last_message_at IS NULL
    AND matched_at < NOW() - INTERVAL '7 days';

  -- Apaga mensagens dos matches com conversa inativa (14 dias)
  DELETE FROM messages
  WHERE match_id IN (
    SELECT id FROM matches
    WHERE status = 'active'
      AND last_message_at IS NOT NULL
      AND last_message_at < NOW() - INTERVAL '14 days'
  );

  -- Apaga o match com conversa inativa
  DELETE FROM matches
  WHERE status = 'active'
    AND last_message_at IS NOT NULL
    AND last_message_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

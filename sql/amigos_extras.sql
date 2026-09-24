-- Rodar no SQL Editor do Supabase
-- Tabelas novas para o sistema de amigos

-- Mensagens de amigos (somem após 30 dias via pg_cron)
CREATE TABLE IF NOT EXISTS friend_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (char_length(content) <= 500),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friend_messages_friendship ON friend_messages(friendship_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_messages_created   ON friend_messages(created_at);

ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own friend messages" ON friend_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.id = friend_messages.friendship_id
        AND (f.requester_id = auth.uid() OR f.receiver_id = auth.uid())
        AND f.status = 'accepted'
    )
  );

-- Presentes entre amigos
CREATE TABLE IF NOT EXISTS friend_gifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type     text NOT NULL,
  item_amount   int  NOT NULL CHECK (item_amount >= 1 AND item_amount <= 30),
  message       text,
  sent_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friend_gifts_friendship ON friend_gifts(friendship_id, sent_at DESC);

ALTER TABLE friend_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friend gifts" ON friend_gifts
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Avaliações entre amigos (1 por par de amizade por usuário)
CREATE TABLE IF NOT EXISTS friend_ratings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  rater_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        int  NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(friendship_id, rater_id)
);

ALTER TABLE friend_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friend ratings" ON friend_ratings
  FOR SELECT USING (rater_id = auth.uid() OR rated_id = auth.uid());

-- pg_cron: deletar mensagens de amigos com mais de 30 dias
-- (rodar uma vez para agendar)
SELECT cron.schedule(
  'delete-old-friend-messages',
  '0 4 * * *',
  $$ DELETE FROM friend_messages WHERE created_at < now() - interval '30 days' $$
);

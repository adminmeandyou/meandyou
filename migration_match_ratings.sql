-- Tabela de avaliações anônimas de matches
CREATE TABLE IF NOT EXISTS match_ratings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id   uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rater_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, rater_id)
);

-- Índice para consultar avaliações de um perfil específico
CREATE INDEX IF NOT EXISTS idx_match_ratings_rated_id ON match_ratings(rated_id);

-- RLS: usuário só pode ver suas próprias avaliações enviadas
ALTER TABLE match_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rater pode inserir propria avaliacao" ON match_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "usuario ve avaliações que recebeu (anonimas)" ON match_ratings
  FOR SELECT USING (auth.uid() = rated_id OR auth.uid() = rater_id);

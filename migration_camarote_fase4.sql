-- ============================================================
-- Camarote Black — Fase 4: Avaliações pós-interação
-- Rodar no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS camarote_ratings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid        NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
  rater_id    uuid        NOT NULL,
  rated_id    uuid        NOT NULL,
  rating      text        NOT NULL CHECK (rating IN ('bom_papo', 'sairam', 'objetivo', 'bolo', 'denuncia')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (request_id, rater_id)
);

ALTER TABLE camarote_ratings ENABLE ROW LEVEL SECURITY;

-- Cada usuário só insere avaliação com seu próprio rater_id
CREATE POLICY "camarote_ratings_insert" ON camarote_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Cada usuário só lê suas próprias avaliações
CREATE POLICY "camarote_ratings_select" ON camarote_ratings
  FOR SELECT USING (auth.uid() = rater_id);

-- Admin lê tudo (para moderação de denúncias)
CREATE POLICY "camarote_ratings_admin_select" ON camarote_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

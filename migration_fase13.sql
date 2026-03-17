-- ============================================================
-- MeAndYou — Migração Fase 13
-- Novas funcionalidades: expiração de match, status temporário,
-- badges (DB), convite estruturado, segurança privada (DB)
-- ============================================================
-- INSTRUÇÕES:
-- 1. Cole este arquivo inteiro no Supabase SQL Editor e execute.
-- 2. Para ativar o cron de expiração, veja o bloco "CRON" no final.
-- ============================================================


-- ============================================================
-- BLOCO 1: Expiração de matches
-- ============================================================

-- Adiciona last_message_at à tabela matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Trigger: atualiza last_message_at automaticamente quando uma mensagem é enviada
CREATE OR REPLACE FUNCTION update_match_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches SET last_message_at = NEW.created_at WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_match_last_message ON messages;
CREATE TRIGGER trg_update_match_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_match_last_message_at();

-- Função: expira matches silenciosamente (chama pelo cron ou pela API)
CREATE OR REPLACE FUNCTION expire_matches()
RETURNS void AS $$
BEGIN
  -- Matches sem nenhuma mensagem após 7 dias: deleta
  DELETE FROM matches
  WHERE status = 'active'
    AND last_message_at IS NULL
    AND matched_at < NOW() - INTERVAL '7 days';

  -- Matches com conversa mas sem interação há 14 dias: deleta
  DELETE FROM matches
  WHERE status = 'active'
    AND last_message_at IS NOT NULL
    AND last_message_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: cria notificação "match vai expirar" para os dois usuários
-- (chama antes do cron de expiração para avisar com 24h de antecedência)
CREATE OR REPLACE FUNCTION notify_expiring_matches()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- Sem conversa, expira em ~24h (entre 6 e 7 dias de idade)
  FOR r IN
    SELECT id, user1, user2 FROM matches
    WHERE status = 'active'
      AND last_message_at IS NULL
      AND matched_at BETWEEN NOW() - INTERVAL '7 days' AND NOW() - INTERVAL '6 days'
  LOOP
    INSERT INTO notifications (user_id, type, data, read, created_at)
    VALUES
      (r.user1, 'match_expiring', jsonb_build_object('match_id', r.id), false, NOW()),
      (r.user2, 'match_expiring', jsonb_build_object('match_id', r.id), false, NOW());
  END LOOP;

  -- Com conversa, expira em ~24h (entre 13 e 14 dias sem interação)
  FOR r IN
    SELECT id, user1, user2 FROM matches
    WHERE status = 'active'
      AND last_message_at IS NOT NULL
      AND last_message_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '13 days'
  LOOP
    INSERT INTO notifications (user_id, type, data, read, created_at)
    VALUES
      (r.user1, 'match_expiring', jsonb_build_object('match_id', r.id), false, NOW()),
      (r.user2, 'match_expiring', jsonb_build_object('match_id', r.id), false, NOW());
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BLOCO 2: Status temporário no perfil
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_temp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_temp_expires_at TIMESTAMPTZ;


-- ============================================================
-- BLOCO 3: Sistema de badges (DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  rarity      TEXT NOT NULL CHECK (rarity IN ('comum', 'incomum', 'raro', 'lendario')),
  type        TEXT NOT NULL CHECK (type IN ('fundador', 'reputacao', 'conexao', 'indicacao', 'evento', 'temporario')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- RLS: qualquer um pode ver badges de outros (é público)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_read_all" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_delete_own" ON user_badges FOR DELETE USING (auth.uid() = user_id);

-- RLS badges: todos podem ler
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read_all" ON badges FOR SELECT USING (true);

-- Badges iniciais
INSERT INTO badges (id, name, description, icon, rarity, type) VALUES
  ('fundador',       'Fundador',              'Um dos primeiros usuários do MeAndYou',              '🏆', 'lendario', 'fundador'),
  ('pioneiro',       'Pioneiro',              'Estava entre os primeiros 1.000 usuários',            '⭐', 'raro',     'fundador'),
  ('lancamento_2026','Lançamento 2026',        'Participou do lançamento oficial em 2026',            '🎉', 'lendario', 'evento'),
  ('verificado',     'Identidade Verificada', 'Passou pela verificação biométrica',                  '🛡️', 'raro',     'reputacao'),
  ('responde_rapido','Responde Rápido',        'Costuma responder mensagens rapidamente',             '⚡', 'incomum',  'reputacao'),
  ('usuario_ativo',  'Usuário Ativo',          'Ativo no app por mais de 3 meses',                   '🔥', 'incomum',  'reputacao'),
  ('conversador',    'Conversador',            'Iniciou mais de 10 conversas',                        '💬', 'comum',    'conexao'),
  ('match_maker',    'Match Maker',            'Conquistou mais de 10 matches',                       '💘', 'incomum',  'conexao'),
  ('indicou_amigos', 'Embaixador',             'Convidou 3 ou mais amigos',                           '🚀', 'raro',     'indicacao'),
  ('turistando',     'Turistando',             'Está visitando uma nova cidade',                      '🧳', 'comum',    'temporario'),
  ('seguranca',      'Viajante Seguro',        'Usou o registro de segurança antes de um encontro',  '🛡', 'incomum',  'reputacao')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BLOCO 4: Convite de encontro estruturado
-- ============================================================

CREATE TABLE IF NOT EXISTS meeting_invites (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  proposer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local           TEXT NOT NULL,
  meeting_date    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'declined', 'rescheduled', 'cancelled')),
  reschedule_note TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ
);

ALTER TABLE meeting_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_invites_participants" ON meeting_invites
  FOR ALL USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_meeting_invites_match ON meeting_invites(match_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invites_proposer ON meeting_invites(proposer_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invites_receiver ON meeting_invites(receiver_id);


-- ============================================================
-- BLOCO 5: Registros de segurança privados (migração do localStorage)
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id     UUID REFERENCES matches(id) ON DELETE SET NULL,
  match_name   TEXT,
  local        TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  checked_in   BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: só o próprio usuário vê seus registros — NUNCA o match
ALTER TABLE safety_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "safety_records_owner_only" ON safety_records
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_safety_records_user ON safety_records(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_records_match ON safety_records(match_id);


-- ============================================================
-- BLOCO 6: CRON (pg_cron)
-- ATENÇÃO: Execute este bloco separadamente no SQL Editor.
-- O pg_cron precisa estar habilitado nas extensões do projeto Supabase.
-- Para habilitar: Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================================

-- Descomentar e executar depois de habilitar pg_cron:

-- SELECT cron.schedule(
--   'notify-expiring-matches-daily',
--   '0 2 * * *',
--   'SELECT notify_expiring_matches();'
-- );

-- SELECT cron.schedule(
--   'expire-matches-daily',
--   '0 3 * * *',
--   'SELECT expire_matches();'
-- );

-- Para verificar se os jobs foram criados:
-- SELECT * FROM cron.job;

-- Para remover os jobs (se necessário):
-- SELECT cron.unschedule('notify-expiring-matches-daily');
-- SELECT cron.unschedule('expire-matches-daily');

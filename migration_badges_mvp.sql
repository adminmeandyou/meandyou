-- migration_badges_mvp.sql
-- 26 emblemas MVP do MeAndYou
-- Paleta de raridades:
--   comum          #9CA3AF  cinza
--   raro           #22C55E  verde esmeralda
--   super_raro     #A855F7  roxo
--   epico          #F97316  laranja
--   lendario       #F59E0B  dourado
--   super_lendario #E11D48  vermelho rose (identidade visual)
--
-- Idempotente: usa WHERE NOT EXISTS por nome, seguro rodar mais de uma vez.

-- ─────────────────────────────────────────
-- COMUM (cinza) — conquistas básicas
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Bem-vindo', 'Criou uma conta no MeAndYou.', '★', null, 'comum',
  'Criar uma conta no app', 'on_join', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Bem-vindo');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Perfil Completo', 'Preencheu foto e bio com pelo menos 30 caracteres.', '★', null, 'comum',
  'Adicionar foto e preencher a bio com ao menos 30 caracteres', 'profile_complete', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Perfil Completo');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Galeria Rica', 'Tem 5 ou mais fotos no perfil.', '★', null, 'comum',
  'Adicionar 5 ou mais fotos ao perfil', 'photos_gte', '{"count": 5}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Galeria Rica');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Relato Corajoso', 'Reportou ter sido deixado para trás em um encontro.', '★', null, 'comum',
  'Registrar um bolo recebido', 'took_bolo', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Relato Corajoso');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Magnético I', 'Conseguiu o primeiro match no app.', '★', null, 'comum',
  'Conseguir 1 match', 'matches_gte', '{"count": 1}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Magnético I');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Desejado I', 'Recebeu as primeiras curtidas de outros usuários.', '★', null, 'comum',
  'Receber 10 curtidas', 'likes_received_gte', '{"count": 10}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Desejado I');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Embaixador I', 'Indicou o primeiro amigo para o app.', '★', null, 'comum',
  'Indicar 1 amigo', 'invited_gte', '{"count": 1}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Embaixador I');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Presença I', 'Realizou a primeira videochamada no app.', '★', null, 'comum',
  'Realizar 1 videochamada', 'video_calls_gte', '{"count": 1}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Presença I');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Comunicativo I', 'Enviou as primeiras mensagens no app.', '★', null, 'comum',
  'Enviar 10 mensagens', 'messages_sent_gte', '{"count": 10}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Comunicativo I');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Fiel I', 'Manteve streak de 3 dias seguidos no app.', '★', null, 'comum',
  'Manter streak de 3 dias seguidos', 'streak_gte', '{"count": 3}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Fiel I');

-- ─────────────────────────────────────────
-- RARO (verde) — engajamento crescente
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Identidade Verificada', 'Verificou sua identidade com biometria facial.', '★', null, 'raro',
  'Verificar identidade biométrica', 'on_verify', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Identidade Verificada');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Magnético II', 'Já fez mais de 10 matches no app.', '★', null, 'raro',
  'Conseguir 10 matches', 'matches_gte', '{"count": 10}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Magnético II');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Desejado II', 'Recebeu 50 curtidas de outros usuários.', '★', null, 'raro',
  'Receber 50 curtidas', 'likes_received_gte', '{"count": 50}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Desejado II');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Embaixador II', 'Indicou 5 amigos para o app.', '★', null, 'raro',
  'Indicar 5 amigos', 'invited_gte', '{"count": 5}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Embaixador II');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Presença II', 'Realizou 5 videochamadas no app.', '★', null, 'raro',
  'Realizar 5 videochamadas', 'video_calls_gte', '{"count": 5}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Presença II');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Comunicativo II', 'Enviou mais de 100 mensagens no app.', '★', null, 'raro',
  'Enviar 100 mensagens', 'messages_sent_gte', '{"count": 100}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Comunicativo II');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Fiel II', 'Manteve streak de 7 dias seguidos.', '★', null, 'raro',
  'Manter streak de 7 dias seguidos', 'streak_gte', '{"count": 7}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Fiel II');

-- ─────────────────────────────────────────
-- SUPER RARO (roxo) — conquistas difíceis
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Magnético III', 'Fez 50 matches — verdadeira força de atração.', '★', null, 'super_raro',
  'Conseguir 50 matches', 'matches_gte', '{"count": 50}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Magnético III');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Desejado III', 'Recebeu 200 curtidas — um verdadeiro fenômeno.', '★', null, 'super_raro',
  'Receber 200 curtidas', 'likes_received_gte', '{"count": 200}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Desejado III');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Comunicativo III', 'Enviou mais de 500 mensagens no app.', '★', null, 'super_raro',
  'Enviar 500 mensagens', 'messages_sent_gte', '{"count": 500}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Comunicativo III');

-- ─────────────────────────────────────────
-- ÉPICO (laranja) — dedicação extrema
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Embaixador III', 'Indicou 20 amigos — o maior embaixador do app.', '★', null, 'epico',
  'Indicar 20 amigos', 'invited_gte', '{"count": 20}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Embaixador III');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Presença III', 'Acumulou 2 horas em videochamadas no app.', '★', null, 'epico',
  'Acumular 120 minutos em videochamadas', 'video_minutes_gte', '{"count": 120}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Presença III');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Fiel III', 'Alcançou o maior streak de 30 dias.', '★', null, 'epico',
  'Atingir streak máximo de 30 dias', 'streak_longest_gte', '{"count": 30}', '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Fiel III');

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Assinante', 'Tem plano Plus ou Black ativo no app.', '★', null, 'epico',
  'Ter plano Plus ou Black ativo', 'plan_active', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Assinante');

-- ─────────────────────────────────────────
-- LENDÁRIO (dourado) — raridade real
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Membro Fundador', 'Estava aqui desde o início — um verdadeiro pioneiro do MeAndYou.', '★', null, 'lendario',
  'Entrar no app durante o período de lançamento', 'early_adopter', null, '{"reference_date": "2026-08-01"}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Membro Fundador');

-- ─────────────────────────────────────────
-- SUPER LENDÁRIO (vermelho rose #E11D48)
-- ─────────────────────────────────────────

INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
SELECT gen_random_uuid()::text, 'Elite Black', 'Membro com plano Black ativo — o topo do MeAndYou.', '★', null, 'super_lendario',
  'Ter plano Black ativo', 'plan_black', null, '{}', 'all', true, true
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Elite Black');

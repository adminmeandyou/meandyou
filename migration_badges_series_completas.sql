-- ═══════════════════════════════════════════════════════════════════════
-- Migration: séries completas de emblemas — 6 níveis por categoria
-- Data: 2026-04-05
-- Rodar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ─── MAGNÉTICO: II→incomum, III→raro, ADD IV/V/VI ───────────────────────────
UPDATE badges SET rarity = 'incomum' WHERE name = 'Magnetico II';
UPDATE badges SET rarity = 'raro'    WHERE name = 'Magnetico III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Magnetico IV', 'conexao', 'Conseguiu 150 matches - uma forca de atracao incrivel.', '*', NULL, 'super_raro', 'Conseguir 150 matches', 'matches_gte', '{"count":150}', '{}', 'all', true, true),
  (gen_random_uuid(), 'Magnetico V',  'conexao', 'Conseguiu 500 matches - quase irresistivel.',             '*', NULL, 'epico',      'Conseguir 500 matches', 'matches_gte', '{"count":500}', '{}', 'all', true, true),
  (gen_random_uuid(), 'Magnetico VI', 'conexao', 'Conseguiu 1000 matches - o maior magnetico do app.',      '*', NULL, 'lendario',   'Conseguir 1000 matches', 'matches_gte', '{"count":1000}', '{}', 'all', true, true);

-- ─── COMUNICATIVO: I/II/III → messages_total_gte + novos thresholds + rarities + ADD IV/V/VI ──
UPDATE badges SET
  condition_type = 'messages_total_gte',
  condition_value = '{"count":50}',
  rarity = 'comum',
  description = 'Trocou as primeiras 50 mensagens no app.',
  requirement_description = 'Trocar 50 mensagens (enviadas + recebidas)'
WHERE name = 'Comunicativo I';

UPDATE badges SET
  condition_type = 'messages_total_gte',
  condition_value = '{"count":200}',
  rarity = 'incomum',
  description = 'Trocou mais de 200 mensagens no app.',
  requirement_description = 'Trocar 200 mensagens (enviadas + recebidas)'
WHERE name = 'Comunicativo II';

UPDATE badges SET
  condition_type = 'messages_total_gte',
  condition_value = '{"count":500}',
  rarity = 'raro',
  description = 'Trocou mais de 500 mensagens no app.',
  requirement_description = 'Trocar 500 mensagens (enviadas + recebidas)'
WHERE name = 'Comunicativo III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Comunicativo IV', 'conexao', 'Trocou mais de 1000 mensagens - papo que nao para.',       '*', NULL, 'super_raro', 'Trocar 1000 mensagens (enviadas + recebidas)',  'messages_total_gte', '{"count":1000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Comunicativo V',  'conexao', 'Trocou mais de 5000 mensagens - mestre da conversa.',      '*', NULL, 'epico',      'Trocar 5000 mensagens (enviadas + recebidas)',  'messages_total_gte', '{"count":5000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Comunicativo VI', 'conexao', 'Trocou mais de 15000 mensagens - lenda do papo.', '*', NULL, 'lendario',   'Trocar 15000 mensagens (enviadas + recebidas)', 'messages_total_gte', '{"count":15000}', '{}', 'all', true, true);

-- ─── DESEJADO: II→incomum, III→raro, ADD IV/V/VI ────────────────────────────
UPDATE badges SET rarity = 'incomum' WHERE name = 'Desejado II';
UPDATE badges SET rarity = 'raro'    WHERE name = 'Desejado III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Desejado IV', 'reputacao', 'Recebeu 1000 curtidas - um fenomeno do app.',           '*', NULL, 'super_raro', 'Receber 1000 curtidas',  'likes_received_gte', '{"count":1000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Desejado V',  'reputacao', 'Recebeu 3000 curtidas - verdadeiramente irresistivel.', '*', NULL, 'epico',      'Receber 3000 curtidas',  'likes_received_gte', '{"count":3000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Desejado VI', 'reputacao', 'Recebeu 10000 curtidas - a lenda do MeAndYou.',         '*', NULL, 'lendario',   'Receber 10000 curtidas', 'likes_received_gte', '{"count":10000}', '{}', 'all', true, true);

-- ─── PRESENÇA: reescrever I/II para video_minutes_gte, III→raro+300min, ADD IV/V/VI ──
UPDATE badges SET
  condition_type = 'video_minutes_gte',
  condition_value = '{"count":30}',
  rarity = 'comum',
  description = 'Acumulou 30 minutos em videochamadas.',
  requirement_description = 'Acumular 30 minutos em videochamadas'
WHERE name = 'Presenca I';

UPDATE badges SET
  condition_type = 'video_minutes_gte',
  condition_value = '{"count":120}',
  rarity = 'incomum',
  description = 'Acumulou 2 horas em videochamadas.',
  requirement_description = 'Acumular 2 horas em videochamadas'
WHERE name = 'Presenca II';

UPDATE badges SET
  condition_value = '{"count":300}',
  rarity = 'raro',
  description = 'Acumulou 5 horas em videochamadas.',
  requirement_description = 'Acumular 5 horas em videochamadas'
WHERE name = 'Presenca III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Presenca IV', 'conexao', 'Acumulou mais de 16 horas em videochamadas.',    '*', NULL, 'super_raro', 'Acumular 1000 minutos em videochamadas',  'video_minutes_gte', '{"count":1000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Presenca V',  'conexao', 'Acumulou mais de 50 horas em videochamadas.',    '*', NULL, 'epico',      'Acumular 3000 minutos em videochamadas',  'video_minutes_gte', '{"count":3000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Presenca VI', 'conexao', 'Acumulou mais de 166 horas em videochamadas - lenda.', '*', NULL, 'lendario', 'Acumular 10000 minutos em videochamadas', 'video_minutes_gte', '{"count":10000}', '{}', 'all', true, true);

-- ─── FIEL: I/II → streak_longest_gte + novos thresholds, III→raro, ADD IV/V/VI ──
UPDATE badges SET
  condition_type = 'streak_longest_gte',
  condition_value = '{"count":7}',
  rarity = 'comum',
  description = 'Atingiu o maior streak de 7 dias no app.',
  requirement_description = 'Atingir streak maximo de 7 dias'
WHERE name = 'Fiel I';

UPDATE badges SET
  condition_type = 'streak_longest_gte',
  condition_value = '{"count":14}',
  rarity = 'incomum',
  description = 'Atingiu o maior streak de 14 dias seguidos.',
  requirement_description = 'Atingir streak maximo de 14 dias'
WHERE name = 'Fiel II';

UPDATE badges SET rarity = 'raro' WHERE name = 'Fiel III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Fiel IV', 'reputacao', 'Atingiu o maior streak de 60 dias - dedicacao total.',         '*', NULL, 'super_raro', 'Atingir streak maximo de 60 dias',  'streak_longest_gte', '{"count":60}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Fiel V',  'reputacao', 'Atingiu o maior streak de 180 dias - meio ano de presenca.',   '*', NULL, 'epico',      'Atingir streak maximo de 180 dias', 'streak_longest_gte', '{"count":180}', '{}', 'all', true, true),
  (gen_random_uuid(), 'Fiel VI', 'reputacao', 'Atingiu o maior streak de 365 dias - um ano inteiro no app.', '*', NULL, 'lendario',   'Atingir streak maximo de 365 dias', 'streak_longest_gte', '{"count":365}', '{}', 'all', true, true);

-- ─── EMBAIXADOR: II→incomum, III→raro, ADD IV/V/VI ──────────────────────────
UPDATE badges SET rarity = 'incomum' WHERE name = 'Embaixador II';
UPDATE badges SET rarity = 'raro'    WHERE name = 'Embaixador III';

INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Embaixador IV', 'indicacao', 'Indicou 30 amigos - um verdadeiro embaixador.',  '*', NULL, 'super_raro', 'Indicar 30 amigos',  'invited_gte', '{"count":30}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Embaixador V',  'indicacao', 'Indicou 75 amigos - influenciador do amor.',     '*', NULL, 'epico',      'Indicar 75 amigos',  'invited_gte', '{"count":75}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Embaixador VI', 'indicacao', 'Indicou 200 amigos - a lenda das indicacoes.',   '*', NULL, 'lendario',   'Indicar 200 amigos', 'invited_gte', '{"count":200}', '{}', 'all', true, true);

-- ─── CAÇADOR: NOVA SÉRIE completa (likes_sent_gte) ──────────────────────────
INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Cacador I',   'conexao', 'Enviou as primeiras 50 curtidas no app.',             '*', NULL, 'comum',      'Enviar 50 curtidas',    'likes_sent_gte', '{"count":50}',    '{}', 'all', true, true),
  (gen_random_uuid(), 'Cacador II',  'conexao', 'Enviou 200 curtidas no app.',                         '*', NULL, 'incomum',    'Enviar 200 curtidas',   'likes_sent_gte', '{"count":200}',   '{}', 'all', true, true),
  (gen_random_uuid(), 'Cacador III', 'conexao', 'Enviou 500 curtidas - em busca do amor.',             '*', NULL, 'raro',       'Enviar 500 curtidas',   'likes_sent_gte', '{"count":500}',   '{}', 'all', true, true),
  (gen_random_uuid(), 'Cacador IV',  'conexao', 'Enviou 1500 curtidas - um cacador dedicado.',         '*', NULL, 'super_raro', 'Enviar 1500 curtidas',  'likes_sent_gte', '{"count":1500}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Cacador V',   'conexao', 'Enviou 5000 curtidas - incansavel na busca.',         '*', NULL, 'epico',      'Enviar 5000 curtidas',  'likes_sent_gte', '{"count":5000}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Cacador VI',  'conexao', 'Enviou 15000 curtidas - a lenda do amor.',            '*', NULL, 'lendario',   'Enviar 15000 curtidas', 'likes_sent_gte', '{"count":15000}', '{}', 'all', true, true);

-- ─── SOCIAL: NOVA SÉRIE completa (sala_unique_gte) ──────────────────────────
INSERT INTO badges (id, name, type, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published) VALUES
  (gen_random_uuid(), 'Social I',   'conexao', 'Entrou na primeira sala de bate-papo.',                '*', NULL, 'comum',      'Entrar em 1 sala diferente',    'sala_unique_gte', '{"count":1}',    '{}', 'all', true, true),
  (gen_random_uuid(), 'Social II',  'conexao', 'Explorou 5 salas diferentes no app.',                 '*', NULL, 'incomum',    'Entrar em 5 salas diferentes',  'sala_unique_gte', '{"count":5}',    '{}', 'all', true, true),
  (gen_random_uuid(), 'Social III', 'conexao', 'Visitou 20 salas diferentes - verdadeiro social.',    '*', NULL, 'raro',       'Entrar em 20 salas diferentes', 'sala_unique_gte', '{"count":20}',   '{}', 'all', true, true),
  (gen_random_uuid(), 'Social IV',  'conexao', 'Visitou 75 salas - alma do pedaco.',                  '*', NULL, 'super_raro', 'Entrar em 75 salas diferentes', 'sala_unique_gte', '{"count":75}',   '{}', 'all', true, true),
  (gen_random_uuid(), 'Social V',   'conexao', 'Visitou 200 salas - o mais social do app.',           '*', NULL, 'epico',      'Entrar em 200 salas diferentes','sala_unique_gte', '{"count":200}',  '{}', 'all', true, true),
  (gen_random_uuid(), 'Social VI',  'conexao', 'Visitou 1000 salas - lenda das salas do MeAndYou.',   '*', NULL, 'lendario',   'Entrar em 1000 salas diferentes','sala_unique_gte', '{"count":1000}', '{}', 'all', true, true);

-- ═══════════════════════════════════════════════════════════════════════
-- Migration: nomes definitivos dos emblemas — aprovados 06/04
-- Rodar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ─── PASSO 1: Limpar duplicados antigos da sessão 04/04 ────────────────
-- Remove user_badges órfãos antes de deletar os badges
DELETE FROM user_badges WHERE badge_id IN (
  SELECT id FROM badges WHERE name IN (
    'Matcher', 'Match Maker', 'Pegador', 'Irresistivel',
    'Popular', 'Da Paquera', 'Popstar',
    'Bom de Papo',
    'Conversador', 'Falante',
    'Indicador', 'Super Indicador', 'Hiper Indicador'
  )
);

DELETE FROM badges WHERE name IN (
  'Matcher', 'Match Maker', 'Pegador', 'Irresistivel',
  'Popular', 'Da Paquera', 'Popstar',
  'Bom de Papo',
  'Conversador', 'Falante',
  'Indicador', 'Super Indicador', 'Hiper Indicador'
);

-- Embaixador sem número (duplicado, diferente de Embaixador I/II/III)
DELETE FROM user_badges WHERE badge_id IN (
  SELECT id FROM badges WHERE name = 'Embaixador' AND condition_type = 'invited_gte'
);
DELETE FROM badges WHERE name = 'Embaixador' AND condition_type = 'invited_gte';

-- ─── PASSO 2: MATCHES — Atraente → Bunitin → Te Quiero → Muito Quente → Me Liga? → Irresistível ──

UPDATE badges SET name = 'Atraente',       description = 'Conseguiu o primeiro match. O início de tudo.',                  requirement_description = 'Conseguir 1 match'     WHERE name = 'Magnetico I';
UPDATE badges SET name = 'Bunitin',        description = 'Conseguiu 10 matches. Já chamou atenção.',                       requirement_description = 'Conseguir 10 matches'   WHERE name = 'Magnetico II';
UPDATE badges SET name = 'Te Quiero',      description = 'Conseguiu 50 matches. Encanta quem cruza.',                      requirement_description = 'Conseguir 50 matches'   WHERE name = 'Magnetico III';
UPDATE badges SET name = 'Muito Quente',   description = 'Conseguiu 150 matches. Ninguém desvia o olhar.',                 requirement_description = 'Conseguir 150 matches'  WHERE name = 'Magnetico IV';
UPDATE badges SET name = 'Me Liga?',       description = 'Conseguiu 500 matches. Todo mundo quer uma chance.',              requirement_description = 'Conseguir 500 matches'  WHERE name = 'Magnetico V';
UPDATE badges SET name = 'Irresistível',   description = 'Conseguiu 1000 matches. Simplesmente irresistível.',             requirement_description = 'Conseguir 1000 matches' WHERE name = 'Magnetico VI';

-- ─── PASSO 3: MENSAGENS — Desenrola → Sem Vergonha → Papo Solto → Matraca → Dominante → Hipnotiza ──

UPDATE badges SET name = 'Desenrola',      description = 'Trocou 50 mensagens no app. Desenrolou o papo.',                 requirement_description = 'Trocar 50 mensagens'    WHERE name = 'Comunicativo I';
UPDATE badges SET name = 'Sem Vergonha',   description = 'Trocou 200 mensagens. Não tem vergonha de chegar.',              requirement_description = 'Trocar 200 mensagens'   WHERE name = 'Comunicativo II';
UPDATE badges SET name = 'Papo Solto',     description = 'Trocou 500 mensagens. O papo flui sem parar.',                   requirement_description = 'Trocar 500 mensagens'   WHERE name = 'Comunicativo III';
UPDATE badges SET name = 'Matraca',        description = 'Trocou 1000 mensagens. Conversa que não acaba nunca.',            requirement_description = 'Trocar 1000 mensagens'  WHERE name = 'Comunicativo IV';
UPDATE badges SET name = 'Dominante',      description = 'Trocou 5000 mensagens. Domina qualquer conversa.',               requirement_description = 'Trocar 5000 mensagens'  WHERE name = 'Comunicativo V';
UPDATE badges SET name = 'Hipnotiza',      description = 'Trocou 15000 mensagens. Hipnotiza com palavras.',                requirement_description = 'Trocar 15000 mensagens' WHERE name = 'Comunicativo VI';

-- ─── PASSO 4: LIKES RECEBIDOS — Desejável → Me Nota → Tentação → Diferente → Destaque → Inigualável ──

UPDATE badges SET name = 'Desejável',      description = 'Recebeu 10 curtidas. Alguém tá de olho.',                        requirement_description = 'Receber 10 curtidas'    WHERE name = 'Desejado I';
UPDATE badges SET name = 'Me Nota',        description = 'Recebeu 50 curtidas. Difícil passar despercebido.',              requirement_description = 'Receber 50 curtidas'    WHERE name = 'Desejado II';
UPDATE badges SET name = 'Tentação',       description = 'Recebeu 200 curtidas. Difícil resistir.',                        requirement_description = 'Receber 200 curtidas'   WHERE name = 'Desejado III';
UPDATE badges SET name = 'Diferente',      description = 'Recebeu 1000 curtidas. Tem algo diferente em você.',             requirement_description = 'Receber 1000 curtidas'  WHERE name = 'Desejado IV';
UPDATE badges SET name = 'Destaque',       description = 'Recebeu 3000 curtidas. Impossível não notar.',                   requirement_description = 'Receber 3000 curtidas'  WHERE name = 'Desejado V';
UPDATE badges SET name = 'Inigualável',    description = 'Recebeu 10000 curtidas. Não existe igual.',                      requirement_description = 'Receber 10000 curtidas' WHERE name = 'Desejado VI';

-- ─── PASSO 5: VÍDEO — Cara a Cara → Aparece → Olho no Olho → Ao Vivo → Presente → Reality Star ──

UPDATE badges SET name = 'Cara a Cara',    description = 'Acumulou 30 minutos em vídeo. Sem medo de mostrar a cara.',      requirement_description = 'Acumular 30 min em vídeo'   WHERE name = 'Presenca I';
UPDATE badges SET name = 'Aparece',        description = 'Acumulou 2 horas em vídeo. Sempre aparece.',                     requirement_description = 'Acumular 2 horas em vídeo'  WHERE name = 'Presenca II';
UPDATE badges SET name = 'Olho no Olho',   description = 'Acumulou 5 horas em vídeo. Conexão real.',                       requirement_description = 'Acumular 5 horas em vídeo'  WHERE name = 'Presenca III';
UPDATE badges SET name = 'Ao Vivo',        description = 'Acumulou 16 horas em vídeo. Sempre ao vivo.',                    requirement_description = 'Acumular 16 horas em vídeo' WHERE name = 'Presenca IV';
UPDATE badges SET name = 'Presente',       description = 'Acumulou 50 horas em vídeo. Presença constante.',                requirement_description = 'Acumular 50 horas em vídeo'  WHERE name = 'Presenca V';
UPDATE badges SET name = 'Reality Star',   description = 'Acumulou 166 horas em vídeo. Basicamente no BBB.',               requirement_description = 'Acumular 166 horas em vídeo' WHERE name = 'Presenca VI';

-- ─── PASSO 6: STREAK — Pontual → Constante → Não Falha → Da Casa → Forever → Patrimônio ──

UPDATE badges SET name = 'Pontual',        description = 'Streak de 7 dias seguidos. Sempre pontual.',                     requirement_description = 'Atingir streak de 7 dias'   WHERE name = 'Fiel I';
UPDATE badges SET name = 'Constante',      description = 'Streak de 14 dias seguidos. Não falha um dia.',                  requirement_description = 'Atingir streak de 14 dias'  WHERE name = 'Fiel II';
UPDATE badges SET name = 'Não Falha',      description = 'Streak de 30 dias seguidos. Um mês inteiro sem falhar.',         requirement_description = 'Atingir streak de 30 dias'  WHERE name = 'Fiel III';
UPDATE badges SET name = 'Da Casa',        description = 'Streak de 60 dias seguidos. Já é da casa.',                      requirement_description = 'Atingir streak de 60 dias'  WHERE name = 'Fiel IV';
UPDATE badges SET name = 'Forever',        description = 'Streak de 180 dias seguidos. Meio ano sem parar.',               requirement_description = 'Atingir streak de 180 dias' WHERE name = 'Fiel V';
UPDATE badges SET name = 'Patrimônio',     description = 'Streak de 365 dias seguidos. Um ano inteiro. Tesouro do app.',   requirement_description = 'Atingir streak de 365 dias' WHERE name = 'Fiel VI';

-- ─── PASSO 7: INDICAÇÕES — Boca a Boca → Cupido → Famoso → Influência → Celebridade → Lenda Urbana ──

UPDATE badges SET name = 'Boca a Boca',    description = 'Indicou 1 pessoa. Espalhou a palavra.',                          requirement_description = 'Indicar 1 pessoa'    WHERE name = 'Embaixador I';
UPDATE badges SET name = 'Cupido',         description = 'Indicou 5 pessoas. Juntando casais por aí.',                    requirement_description = 'Indicar 5 pessoas'   WHERE name = 'Embaixador II';
UPDATE badges SET name = 'Famoso',         description = 'Indicou 20 pessoas. Todo mundo já sabe.',                        requirement_description = 'Indicar 20 pessoas'  WHERE name = 'Embaixador III';
UPDATE badges SET name = 'Influência',     description = 'Indicou 30 pessoas. Formou opinião.',                            requirement_description = 'Indicar 30 pessoas'  WHERE name = 'Embaixador IV';
UPDATE badges SET name = 'Celebridade',    description = 'Indicou 75 pessoas. Todo mundo conhece.',                        requirement_description = 'Indicar 75 pessoas'  WHERE name = 'Embaixador V';
UPDATE badges SET name = 'Lenda Urbana',   description = 'Indicou 200 pessoas. Falam, mas não acreditam.',                 requirement_description = 'Indicar 200 pessoas' WHERE name = 'Embaixador VI';

-- ─── PASSO 8: LIKES ENVIADOS — De Olho → Coração Acelerado → Sem Freio → Na Pista → Aventura ON → Uma Máquina ──

UPDATE badges SET name = 'De Olho',            description = 'Enviou 50 curtidas. Tá de olho em alguém.',                  requirement_description = 'Enviar 50 curtidas'    WHERE name = 'Cacador I';
UPDATE badges SET name = 'Coração Acelerado',  description = 'Enviou 200 curtidas. Coração batendo forte.',                requirement_description = 'Enviar 200 curtidas'   WHERE name = 'Cacador II';
UPDATE badges SET name = 'Sem Freio',          description = 'Enviou 500 curtidas. Não para mesmo.',                       requirement_description = 'Enviar 500 curtidas'   WHERE name = 'Cacador III';
UPDATE badges SET name = 'Na Pista',           description = 'Enviou 1500 curtidas. Sempre na pista.',                     requirement_description = 'Enviar 1500 curtidas'  WHERE name = 'Cacador IV';
UPDATE badges SET name = 'Aventura ON',        description = 'Enviou 5000 curtidas. Modo aventura ativado.',               requirement_description = 'Enviar 5000 curtidas'  WHERE name = 'Cacador V';
UPDATE badges SET name = 'Uma Máquina',        description = 'Enviou 15000 curtidas. Sobre-humano. Não cansa nunca.',      requirement_description = 'Enviar 15000 curtidas' WHERE name = 'Cacador VI';

-- ─── PASSO 9: SALAS — Visita → Turista → Hóspede → Vibe Boa → Onipresente → Ímã Social ──

UPDATE badges SET name = 'Visita',         description = 'Entrou na primeira sala. A primeira visita.',                    requirement_description = 'Entrar em 1 sala'     WHERE name = 'Social I';
UPDATE badges SET name = 'Turista',        description = 'Visitou 5 salas diferentes. Explorando o território.',           requirement_description = 'Entrar em 5 salas'    WHERE name = 'Social II';
UPDATE badges SET name = 'Hóspede',        description = 'Visitou 20 salas. Figurinha carimbada.',                         requirement_description = 'Entrar em 20 salas'   WHERE name = 'Social III';
UPDATE badges SET name = 'Vibe Boa',       description = 'Visitou 75 salas. A energia boa do lugar.',                      requirement_description = 'Entrar em 75 salas'   WHERE name = 'Social IV';
UPDATE badges SET name = 'Onipresente',    description = 'Visitou 200 salas. Tá em todo lugar ao mesmo tempo.',            requirement_description = 'Entrar em 200 salas'  WHERE name = 'Social V';
UPDATE badges SET name = 'Ímã Social',     description = 'Visitou 1000 salas. Atrai todo mundo pra perto.',                requirement_description = 'Entrar em 1000 salas' WHERE name = 'Social VI';

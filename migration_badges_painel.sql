-- =============================================
-- PAINEL DE EMBLEMAS — migração completa
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Adicionar colunas novas na tabela badges
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS user_cohort text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS condition_extra jsonb DEFAULT '{}';

-- 2. Criar bucket de storage para imagens dos emblemas
-- IMPORTANTE: Execute no Supabase Dashboard → Storage → New bucket
-- Nome: badge-images | Public: SIM
-- Ou execute via Supabase API se preferir

-- 3. Emblemas iniciais (26 emblemas)
-- Usando ON CONFLICT DO NOTHING para não duplicar se já existir com mesmo nome
INSERT INTO public.badges (name, description, icon, rarity, requirement_description, condition_type, condition_value, user_cohort, condition_extra, is_active, is_published)
VALUES
  ('Pioneiro',        'Entrou no app durante o lançamento',                '🚀', 'lendario', 'Entrou no app durante o período de lançamento',          'early_adopter',       NULL,                     'all', '{"reference_date":"2025-12-31"}', true, true),
  ('Bem-vindo',       'Criou uma conta no app',                            '👋', 'comum',    'Criar uma conta no MeAndYou',                             'on_join',             NULL,                     'all', '{}',                             true, true),
  ('Identidade Real', 'Verificou sua identidade no app',                   '🔵', 'incomum',  'Verificar identidade pelo app',                           'on_verify',           NULL,                     'all', '{}',                             true, true),
  ('Perfil Completo', 'Completou todas as informações do perfil',          '✅', 'comum',    'Ter foto e bio preenchidos',                              'profile_complete',    NULL,                     'all', '{}',                             true, true),
  ('Indicador',       'Indicou um amigo para o app',                       '👥', 'comum',    'Indicar 1 amigo',                                         'invited_gte',         '{"count":1}',            'all', '{}',                             true, true),
  ('Super Indicador', 'Indicou 10 ou mais amigos',                         '🌟', 'raro',     'Indicar 10+ amigos',                                      'invited_gte',         '{"count":10}',           'all', '{}',                             true, true),
  ('Hiper Indicador', 'Indicou 20 ou mais amigos',                         '💫', 'lendario', 'Indicar 20+ amigos',                                      'invited_gte',         '{"count":20}',           'all', '{}',                             true, true),
  ('Popular',         'Recebeu mais de 50 curtidas',                       '❤️', 'incomum',  'Ter 50+ curtidas recebidas',                              'likes_received_gte',  '{"count":50}',           'all', '{}',                             true, true),
  ('Da Paquera',      'Recebeu mais de 100 curtidas',                      '💘', 'raro',     'Ter 100+ curtidas recebidas',                             'likes_received_gte',  '{"count":100}',          'all', '{}',                             true, true),
  ('Popstar',         'Recebeu mais de 500 curtidas',                      '👑', 'lendario', 'Ter 500+ curtidas recebidas',                             'likes_received_gte',  '{"count":500}',          'all', '{}',                             true, true),
  ('Conversador',     'Trocou mais de 100 mensagens',                      '💬', 'comum',    'Enviar ou receber 100+ mensagens',                        'messages_total_gte',  '{"count":100}',          'all', '{}',                             true, true),
  ('Bom de Papo',     'Trocou mais de 250 mensagens',                      '🗣️', 'incomum',  'Enviar ou receber 250+ mensagens',                        'messages_total_gte',  '{"count":250}',          'all', '{}',                             true, true),
  ('Falante',         'Enviou mais de 500 mensagens',                      '📢', 'raro',     'Enviar 500+ mensagens',                                   'messages_sent_gte',   '{"count":500}',          'all', '{}',                             true, true),
  ('Encontro Marcado','Marcou um encontro pelo app',                       '📍', 'incomum',  'Marcar 1+ encontro pelo chat',                            'meetup_scheduled',    '{"count":1}',            'all', '{}',                             true, true),
  ('Comprador',       'Fez sua primeira compra na loja',                   '🛍️', 'comum',    'Realizar uma compra na loja',                             'store_purchase',      NULL,                     'all', '{}',                             true, true),
  ('Verificado Plus', 'Tem o Selo Verificado Plus',                        '💎', 'raro',     'Comprar o Selo Verificado Plus na loja',                  'store_item',          '{"item":"selo_verificado_plus"}', 'all', '{}',                    true, true),
  ('Matcher',         'Fez 10 ou mais matches',                            '🔥', 'comum',    'Ter 10+ matches',                                         'matches_gte',         '{"count":10}',           'all', '{}',                             true, true),
  ('Pegador',         'Fez 50 ou mais matches',                            '⚡', 'incomum',  'Ter 50+ matches',                                         'matches_gte',         '{"count":50}',           'all', '{}',                             true, true),
  ('Irresistível',    'Fez 200 ou mais matches',                           '🏆', 'lendario', 'Ter 200+ matches',                                        'matches_gte',         '{"count":200}',          'all', '{}',                             true, true),
  ('Streaker',        '7 dias seguidos no app',                            '📅', 'comum',    'Acessar o app por 7 dias seguidos',                       'streak_gte',          '{"count":7}',            'all', '{}',                             true, true),
  ('Dedicado',        '30 dias seguidos no app',                           '🎯', 'raro',     'Acessar o app por 30 dias seguidos',                      'streak_gte',          '{"count":30}',           'all', '{}',                             true, true),
  ('Na Tela',         'Realizou uma videochamada',                         '📹', 'comum',    'Fazer 1+ videochamada',                                   'video_calls_gte',     '{"count":1}',            'all', '{}',                             true, true),
  ('Conectado',       'Realizou 10 ou mais videochamadas',                 '🎥', 'incomum',  'Fazer 10+ videochamadas',                                 'video_calls_gte',     '{"count":10}',           'all', '{}',                             true, true),
  ('Assinante Plus',  'Tem plano Plus ou Black ativo',                     '⭐', 'incomum',  'Ter plano Plus ou Black',                                 'plan_active',         NULL,                     'all', '{}',                             true, true),
  ('Assinante Black', 'Tem plano Black ativo',                             '🖤', 'raro',     'Ter plano Black',                                         'plan_black',          NULL,                     'all', '{}',                             true, true),
  ('Investidor',      'Gastou 500+ fichas na loja',                        '💰', 'raro',     'Gastar 500+ fichas na loja',                              'store_spent_gte',     '{"count":500}',          'all', '{}',                             true, true)
ON CONFLICT DO NOTHING;

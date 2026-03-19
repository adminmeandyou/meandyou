-- =============================================
-- PAINEL DE EMBLEMAS — migracao completa
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Adicionar colunas novas na tabela badges
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS user_cohort text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS condition_extra jsonb DEFAULT '{}';

-- 2. Garantir constraint unica em name para o ON CONFLICT funcionar
CREATE UNIQUE INDEX IF NOT EXISTS badges_name_unique ON public.badges (name);

-- 3. Emblemas iniciais (26 emblemas)
INSERT INTO public.badges (id, name, description, icon, rarity, type, requirement_description, condition_type, condition_value, user_cohort, condition_extra, is_active, is_published)
VALUES
  (gen_random_uuid()::text, 'Pioneiro',        'Entrou no app durante o lancamento',              'rocket',    'lendario', 'fundador',   'Entrar no app durante o periodo de lancamento',    'early_adopter',      NULL,                              'all', '{"reference_date":"2025-12-31"}', true, true),
  (gen_random_uuid()::text, 'Bem-vindo',        'Criou uma conta no app',                          'hand',      'comum',    'reputacao',  'Criar uma conta no MeAndYou',                      'on_join',            NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Identidade Real',  'Verificou sua identidade no app',                 'shield',    'incomum',  'reputacao',  'Verificar identidade pelo app',                    'on_verify',          NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Perfil Completo',  'Completou todas as informacoes do perfil',        'check',     'comum',    'reputacao',  'Ter foto e bio preenchidos',                       'profile_complete',   NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Indicador',        'Indicou um amigo para o app',                     'users',     'comum',    'indicacao',  'Indicar 1 amigo',                                  'invited_gte',        '{"count":1}',                     'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Super Indicador',  'Indicou 10 ou mais amigos',                       'star',      'raro',     'indicacao',  'Indicar 10 amigos ou mais',                        'invited_gte',        '{"count":10}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Hiper Indicador',  'Indicou 20 ou mais amigos',                       'zap',       'lendario', 'indicacao',  'Indicar 20 amigos ou mais',                        'invited_gte',        '{"count":20}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Popular',          'Recebeu mais de 50 curtidas',                     'heart',     'incomum',  'reputacao',  'Ter 50 ou mais curtidas recebidas',                'likes_received_gte', '{"count":50}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Da Paquera',       'Recebeu mais de 100 curtidas',                    'heart',     'raro',     'reputacao',  'Ter 100 ou mais curtidas recebidas',               'likes_received_gte', '{"count":100}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Popstar',          'Recebeu mais de 500 curtidas',                    'crown',     'lendario', 'reputacao',  'Ter 500 ou mais curtidas recebidas',               'likes_received_gte', '{"count":500}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Conversador',      'Trocou mais de 100 mensagens',                    'message',   'comum',    'conexao',    'Enviar ou receber 100 ou mais mensagens',          'messages_total_gte', '{"count":100}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Bom de Papo',      'Trocou mais de 250 mensagens',                    'message',   'incomum',  'conexao',    'Enviar ou receber 250 ou mais mensagens',          'messages_total_gte', '{"count":250}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Falante',          'Enviou mais de 500 mensagens',                    'megaphone', 'raro',     'conexao',    'Enviar 500 ou mais mensagens',                     'messages_sent_gte',  '{"count":500}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Encontro Marcado', 'Marcou um encontro pelo app',                     'map-pin',   'incomum',  'conexao',    'Marcar 1 ou mais encontros pelo chat',             'meetup_scheduled',   '{"count":1}',                     'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Comprador',        'Fez sua primeira compra na loja',                 'bag',       'comum',    'reputacao',  'Realizar uma compra na loja',                      'store_purchase',     NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Verificado Plus',  'Tem o Selo Verificado Plus',                      'diamond',   'raro',     'reputacao',  'Comprar o Selo Verificado Plus na loja',           'store_item',         '{"item":"selo_verificado_plus"}',  'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Matcher',          'Fez 10 ou mais matches',                          'fire',      'comum',    'conexao',    'Ter 10 ou mais matches',                           'matches_gte',        '{"count":10}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Pegador',          'Fez 50 ou mais matches',                          'bolt',      'incomum',  'conexao',    'Ter 50 ou mais matches',                           'matches_gte',        '{"count":50}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Irresistivel',     'Fez 200 ou mais matches',                         'trophy',    'lendario', 'conexao',    'Ter 200 ou mais matches',                          'matches_gte',        '{"count":200}',                   'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Streaker',         '7 dias seguidos no app',                          'calendar',  'comum',    'reputacao',  'Acessar o app por 7 dias seguidos',                'streak_gte',         '{"count":7}',                     'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Dedicado',         '30 dias seguidos no app',                         'target',    'raro',     'reputacao',  'Acessar o app por 30 dias seguidos',               'streak_gte',         '{"count":30}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Na Tela',          'Realizou uma videochamada',                       'video',     'comum',    'conexao',    'Fazer 1 ou mais videochamadas',                    'video_calls_gte',    '{"count":1}',                     'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Conectado',        'Realizou 10 ou mais videochamadas',               'video',     'incomum',  'conexao',    'Fazer 10 ou mais videochamadas',                   'video_calls_gte',    '{"count":10}',                    'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Assinante Plus',   'Tem plano Plus ou Black ativo',                   'star',      'incomum',  'reputacao',  'Ter plano Plus ou Black',                          'plan_active',        NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Assinante Black',  'Tem plano Black ativo',                           'circle',    'raro',     'reputacao',  'Ter plano Black',                                  'plan_black',         NULL,                              'all', '{}',                             true, true),
  (gen_random_uuid()::text, 'Investidor',       'Gastou 500 ou mais fichas na loja',               'coins',     'raro',     'reputacao',  'Gastar 500 ou mais fichas na loja',                'store_spent_gte',    '{"count":500}',                   'all', '{}',                             true, true)
ON CONFLICT (name) DO NOTHING;

-- Migration: emblemas de marco de nível
-- Rodar no Supabase SQL Editor
-- Imagens (icon_url) serão adicionadas depois pelo admin

INSERT INTO badges (id, name, description, icon, icon_url, rarity, condition_type, condition_value, is_active, is_published, user_cohort)
VALUES
  (
    gen_random_uuid()::text,
    'Nível 10',
    'Atingiu o nível 10 no MeAndYou.',
    '⭐', NULL,
    'comum',
    'level_milestone',
    '{"level": 10}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 25',
    'Atingiu o nível 25 no MeAndYou.',
    '⭐', NULL,
    'raro',
    'level_milestone',
    '{"level": 25}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 50',
    'Atingiu o nível 50 no MeAndYou.',
    '⭐', NULL,
    'raro',
    'level_milestone',
    '{"level": 50}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 100',
    'Atingiu o lendário nível 100 no MeAndYou.',
    '🏆', NULL,
    'lendario',
    'level_milestone',
    '{"level": 100}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 200',
    'Atingiu o nível 200. Veterano de verdade.',
    '🏆', NULL,
    'lendario',
    'level_milestone',
    '{"level": 200}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 300',
    'Atingiu o nível 300. Uma lenda viva.',
    '🏆', NULL,
    'lendario',
    'level_milestone',
    '{"level": 300}'::jsonb,
    true, true, 'all'
  ),
  (
    gen_random_uuid()::text,
    'Nível 500',
    'Atingiu o nível máximo. Supremo.',
    '👑', NULL,
    'super_lendario',
    'level_milestone',
    '{"level": 500}'::jsonb,
    true, true, 'all'
  );

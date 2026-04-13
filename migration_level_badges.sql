-- Migration: emblemas de marco de nível
-- Rodar no Supabase SQL Editor
-- Imagens (icon_url) serão adicionadas depois pelo admin

INSERT INTO badges (id, name, description, icon, icon_url, type, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES
  (
    gen_random_uuid()::text,
    'Nível 10', 'Atingiu o nível 10 no MeAndYou.',
    '', NULL, 'reputacao', 'comum', 'Alcance o nível 10',
    'level_milestone', '{"level": 10}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 25', 'Atingiu o nível 25 no MeAndYou.',
    '', NULL, 'reputacao', 'raro', 'Alcance o nível 25',
    'level_milestone', '{"level": 25}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 50', 'Atingiu o nível 50 no MeAndYou.',
    '', NULL, 'reputacao', 'raro', 'Alcance o nível 50',
    'level_milestone', '{"level": 50}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 100', 'Atingiu o lendário nível 100 no MeAndYou.',
    '', NULL, 'reputacao', 'lendario', 'Alcance o nível 100',
    'level_milestone', '{"level": 100}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 200', 'Atingiu o nível 200. Veterano de verdade.',
    '', NULL, 'reputacao', 'lendario', 'Alcance o nível 200',
    'level_milestone', '{"level": 200}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 300', 'Atingiu o nível 300. Uma lenda viva.',
    '', NULL, 'reputacao', 'lendario', 'Alcance o nível 300',
    'level_milestone', '{"level": 300}'::jsonb, '{}'::jsonb, 'all', true, true
  ),
  (
    gen_random_uuid()::text,
    'Nível 500', 'Atingiu o nível máximo. Supremo.',
    '', NULL, 'reputacao', 'super_lendario', 'Alcance o nível 500',
    'level_milestone', '{"level": 500}'::jsonb, '{}'::jsonb, 'all', true, true
  );

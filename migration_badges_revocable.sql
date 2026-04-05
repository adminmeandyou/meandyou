-- migration_badges_revocable.sql
-- Ajustes no sistema de emblemas:
-- 1. Adiciona coluna is_revocable (badges que podem ser perdidos)
-- 2. Remove "Assinante" (redundante com Elite Black)
-- 3. Elite Black vira lendario (era super_lendario) e é revogável

-- 1. Adicionar coluna is_revocable
ALTER TABLE badges ADD COLUMN IF NOT EXISTS is_revocable boolean DEFAULT false;

-- 2. Desativar "Assinante" (badge redundante — substituído pelo Elite Black)
UPDATE badges
SET is_active = false, is_published = false
WHERE name = 'Assinante';

-- 3. Atualizar Elite Black: rarity lendario + is_revocable = true
UPDATE badges
SET
  rarity = 'lendario',
  is_revocable = true,
  description = 'Membro com plano Black ativo — o topo do MeAndYou. Emblema mantido enquanto o plano estiver ativo.',
  requirement_description = 'Ter plano Black ativo (emblema revogável)'
WHERE name = 'Elite Black';

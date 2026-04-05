-- migration_badges_revocable.sql
-- Ajustes no sistema de emblemas:
-- 1. Adiciona coluna is_revocable (badges que podem ser perdidos)
-- 2. Remove "Assinante" (redundante com Elite Black)
-- 3. Elite Black vira lendario (era super_lendario) e é revogável

-- APLICADO VIA REST API em 2026-04-05
-- Não precisa rodar manualmente — já executado.

-- Desativar "Assinante" (badge redundante — substituído pelo Elite Black)
-- UPDATE badges SET is_active = false, is_published = false WHERE name = 'Assinante';

-- Atualizar Elite Black: rarity lendario + descricao atualizada
-- UPDATE badges SET rarity = 'lendario', description = '...', requirement_description = '...' WHERE name = 'Elite Black';

-- Nota: is_revocable é controlado por código (REVOCABLE_CONDITIONS no check-user/route.ts)
-- Não foi necessário ALTER TABLE.

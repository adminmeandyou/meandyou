-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Emblemas Super Lendários exclusivos da Caixa Super Lendária
-- Rodar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════
-- Estes emblemas NÃO são conquistados por gameplay.
-- São obtidos APENAS comprando a Caixa Super Lendária na Loja (2250 fichas).
-- condition_type = 'caixa_lendaria' — a API /api/loja/gastar sorteia um ao abrir.
-- Raridade: super_lendario (vermelho #E11D48 — a mais alta do sistema).
-- Todos os nomes são unisex.
-- Dois eixos: raridade extrema + riqueza/poder/nobreza.
-- ═══════════════════════════════════════════════════════════════════════

-- Limpar badges antigos da caixa lendária (caso existam da versão anterior)
DELETE FROM user_badges WHERE badge_id IN (
  SELECT id FROM badges WHERE condition_type = 'caixa_lendaria'
);
DELETE FROM badges WHERE condition_type = 'caixa_lendaria';

-- ─── RARIDADE ────────────────────────────────────────────────────────

-- 1. Classe S
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Classe S', 'Acima de A, acima de tudo. A classificação mais alta que existe.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 2. Lenda Viva
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Lenda Viva', 'Falam sobre você sem nunca ter te visto. Seu nome já virou história.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 3. Glitch
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Glitch', 'Erro no sistema. Não deveria existir, mas existe. Sorte hackeada.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 4. Nível 999
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Nível 999', 'Passou do limite. O sistema não foi feito pra alguém assim.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- ─── RIQUEZA / PODER / NOBREZA ──────────────────────────────────────

-- 5. Magnata
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Magnata', 'Quem tem poder não precisa provar nada. O status fala sozinho.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 6. Royalty
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Royalty', 'Sangue real. Nasceu pra brilhar e todo mundo sabe disso.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 7. Majestade
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Majestade', 'Sua presença impõe respeito. Quando entra, o ambiente muda.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 8. Nobreza
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Nobreza', 'Classe que não se compra, se carrega. Elegância que vem de dentro.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 9. Imperium
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Imperium', 'Poder absoluto. Onde pisa, vira território.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- 10. Dinastia
INSERT INTO badges (id, name, description, icon, icon_url, rarity, requirement_description, condition_type, condition_value, condition_extra, user_cohort, is_active, is_published)
VALUES (gen_random_uuid()::text, 'Dinastia', 'Linhagem de poder que não acaba. Seu legado já começou.', '★', null, 'super_lendario',
  'Exclusivo da Caixa Super Lendária', 'caixa_lendaria', null, '{}', 'all', true, true);

-- ═══════════════════════════════════════════════════════════════════════
-- Verificação
-- ═══════════════════════════════════════════════════════════════════════
SELECT name, rarity, condition_type, is_active, is_published
FROM badges
WHERE condition_type = 'caixa_lendaria'
ORDER BY name;

-- Migration: remover campos legados da tabela profiles
-- Executar no Supabase SQL Editor após confirmar que nenhum código ainda referencia estes campos.
--
-- Campos removidos:
--   cadastro_step  — substituído pelos campos reg_* individuais (migration_cadastro_progress.sql)
--   onboarding_done — substituído por onboarding_completed (migration_cadastro_progress.sql)

ALTER TABLE profiles DROP COLUMN IF EXISTS cadastro_step;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_done;

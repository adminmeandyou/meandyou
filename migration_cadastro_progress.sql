-- migration_cadastro_progress.sql
-- Substitui cadastro_step por campos individuais de progresso
-- Rodar no SQL Editor do Supabase

-- ─── PASSO 1: Garantir colunas base na tabela users ──────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verify_token           text,
  ADD COLUMN IF NOT EXISTS email_verify_token_expires_at timestamptz;

-- ─── PASSO 2: Adicionar campos de progresso em profiles ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reg_credentials_set    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_email_verified     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_document_verified  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_facial_verified    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_name_confirmed     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_username_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_invite_provided    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reg_invite_code        text    DEFAULT null,
  ADD COLUMN IF NOT EXISTS onboarding_completed   boolean DEFAULT false;

-- ─── PASSO 3: Migrar usuários existentes ─────────────────────────────────────
-- Todos que já existem no banco = conta criada, credenciais configuradas,
-- nome confirmado, CPF validado. Migrar o que já é sabido do estado atual.

UPDATE profiles p
SET
  reg_credentials_set    = true,
  reg_name_confirmed     = true,
  reg_username_confirmed = true,
  reg_document_verified  = true,

  -- email_verified: se a coluna já existia e estava true, migra; senão marca true
  -- (usuários antigos já usavam o app, logo email estava ok)
  reg_email_verified     = COALESCE(
                             (SELECT u.email_verified FROM users u WHERE u.id = p.id),
                             true
                           ),

  -- facial: usa coluna verified da tabela users
  reg_facial_verified    = COALESCE(
                             (SELECT u.verified FROM users u WHERE u.id = p.id),
                             false
                           ),

  -- invite: se tinha referred_by, tinha código
  reg_invite_provided    = (p.referred_by IS NOT NULL),
  reg_invite_code        = null,

  -- onboarding: migrar de onboarding_done
  onboarding_completed   = COALESCE(p.onboarding_done, false)

WHERE p.id IS NOT NULL;

-- ─── PASSO 4: Marcar email_verified = true para usuários existentes ───────────
-- (usuários antigos já usavam o app antes dessa coluna existir)
UPDATE users
SET email_verified = true
WHERE email_verified IS NULL OR email_verified = false
  AND id IN (SELECT id FROM profiles WHERE reg_credentials_set = true);

-- ─── PASSO 5: Remover campo antigo ───────────────────────────────────────────
-- Só rodar depois de confirmar que tudo funcionou
-- ALTER TABLE profiles DROP COLUMN IF EXISTS cadastro_step;

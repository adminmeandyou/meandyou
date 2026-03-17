-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO — Fase 1 Segurança
-- Rodar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─── 1. Tokens de alteração de email ───────────────────
CREATE TABLE IF NOT EXISTS email_change_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  novo_email  text NOT NULL,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON email_change_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user  ON email_change_tokens(user_id);

-- ─── 2. 2FA (TOTP) ─────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret       text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled      boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup_codes text[];

-- Tabela para tokens 2FA pendentes (login em dois passos)
CREATE TABLE IF NOT EXISTS auth_2fa_pending (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temp_token text NOT NULL UNIQUE,
  access_token  text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_2fa_pending_token ON auth_2fa_pending(temp_token);

-- ─── 3. Sessões ativas ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip            text,
  user_agent    text,
  device_info   text,
  created_at    timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  ended_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, ended_at) WHERE ended_at IS NULL;

-- ─── 4. known_ua_hashes (caso não exista ainda) ────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS known_ua_hashes text[];

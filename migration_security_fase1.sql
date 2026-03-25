-- Migration: Segurança Fase 1
-- Tabelas para 2FA (TOTP), sessoes ativas e alteracao de email
-- Colunas TOTP na tabela public.users
-- NOTA: este arquivo foi recriado em 2026-03-24 a partir do codigo existente
--       as tabelas ja existiam no banco — pode ser rodado sem risco (IF NOT EXISTS)

-- ─── Tabela: auth_2fa_pending ─────────────────────────────────────────────────
-- Guarda token temporario durante o step 2 do login com 2FA

CREATE TABLE IF NOT EXISTS public.auth_2fa_pending (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  temp_token  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.auth_2fa_pending ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (login route usa supabaseAdmin)
CREATE POLICY IF NOT EXISTS "Service role gerencia auth_2fa_pending"
  ON public.auth_2fa_pending
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Tabela: user_sessions ────────────────────────────────────────────────────
-- Registra sessoes de login por dispositivo/IP para gestao de sessoes ativas

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL,
  ip             TEXT,
  user_agent     TEXT,
  device_info    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id ON public.user_sessions (user_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuarios veem proprias sessoes"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Tabela: email_change_tokens ──────────────────────────────────────────────
-- Token de confirmacao para fluxo de alteracao de email

CREATE TABLE IF NOT EXISTS public.email_change_tokens (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  novo_email TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_change_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (API routes usam supabaseAdmin)
CREATE POLICY IF NOT EXISTS "Service role gerencia email_change_tokens"
  ON public.email_change_tokens
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Colunas TOTP em public.users ─────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS totp_secret       TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled      BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT[],
  ADD COLUMN IF NOT EXISTS known_ua_hashes   TEXT[]   DEFAULT '{}';

-- =============================================
-- COLUNAS FALTANTES EM PROFILES
-- Adiciona colunas usadas pela loja, XP e privacidade
-- Execute no Supabase SQL Editor
-- =============================================

-- Verificação de identidade Plus (loja: verified_plus 200 fichas)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_plus boolean DEFAULT false;

-- Sistema de XP
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_level integer DEFAULT 0;

-- Bônus 2x XP da loja (xp_bonus_3d)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_bonus_until timestamptz;

-- Modo fantasma / invisível da loja (ghost_7d / ghost_35d)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ghost_mode_until timestamptz;

-- Emblemas em destaque no perfil (badge_showcase)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_showcase text[];

-- Janela de 24h para ver quem curtiu (reveals_5)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS curtidas_reveals_until timestamptz;

-- Acesso ao Camarote por fichas — 30 dias (passaporte_camarote 70 fichas)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS camarote_expires_at timestamptz;

-- Conta pausada 30 dias (fluxo deletar-conta)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS incognito_until timestamptz;

-- Privacidade: exibir status online para outros usuários
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_last_active boolean DEFAULT true;

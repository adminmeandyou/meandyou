-- migration_a6_emblemas.sql
-- A6: Painel de emblemas do proprio perfil — showcase de ate 3 emblemas
-- Execute no Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badge_showcase text[] DEFAULT '{}';

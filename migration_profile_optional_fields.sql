-- Migration: campos opcionais do perfil
-- Rodar no Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS height_cm        integer,
  ADD COLUMN IF NOT EXISTS occupation       text,
  ADD COLUMN IF NOT EXISTS instagram        text,
  ADD COLUMN IF NOT EXISTS spotify          text,
  ADD COLUMN IF NOT EXISTS show_height      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_occupation  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_instagram   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_spotify     boolean NOT NULL DEFAULT false;

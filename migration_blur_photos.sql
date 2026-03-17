-- Foto desfocada com revelação gradual
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blur_photos boolean DEFAULT false;

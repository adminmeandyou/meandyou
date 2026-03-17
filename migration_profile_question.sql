-- Migration: Pergunta do perfil
-- Adiciona campos para a pergunta opcional e resposta no perfil do usuário

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_question text,
  ADD COLUMN IF NOT EXISTS profile_question_answer text;

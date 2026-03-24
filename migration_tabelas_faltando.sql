-- =============================================
-- TABELAS FALTANDO NO BANCO
-- Avaliacao anonima, bolo, seguranca encontros, convites
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. AVALIACAO ANONIMA POS-CHAT
-- Usada em: conversas/[id] (handleRating), perfil/[id] (exibe % positivo)
CREATE TABLE IF NOT EXISTS public.match_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  rater_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, rater_id)
);

ALTER TABLE public.match_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario vê proprias avaliacoes dadas"
  ON public.match_ratings FOR SELECT
  USING (rater_id = auth.uid());

CREATE POLICY "usuario insere proprias avaliacoes"
  ON public.match_ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid());

-- =============================================

-- 2. RELATORIO DE BOLO (levou um fora no encontro)
-- Usada em: conversas/[id] (handleBolo), badges/auto-award (condition: took_bolo)
-- Nota: user_id = coluna gerada a partir de reporter_id para compatibilidade com auto-award
CREATE TABLE IF NOT EXISTS public.bolo_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  reporter_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id      uuid GENERATED ALWAYS AS (reporter_id) STORED,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, reporter_id)
);

ALTER TABLE public.bolo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario insere proprio bolo"
  ON public.bolo_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "service role le para badges"
  ON public.bolo_reports FOR SELECT
  USING (true);

-- =============================================

-- 3. REGISTRO PRIVADO DE SEGURANCA (guarda info do encontro)
-- Usada em: api/safety/save (salvar), api/safety/checkin (marcar checkin)
CREATE TABLE IF NOT EXISTS public.safety_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id     uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  match_name   text,
  local        text NOT NULL,
  meeting_date text NOT NULL,
  checked_in   boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve e gerencia proprios registros"
  ON public.safety_records FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================

-- 4. CONVITE DE ENCONTRO (proposta estruturada no chat)
-- Usada em: api/meeting/invite (POST criar, PATCH responder)
CREATE TABLE IF NOT EXISTS public.meeting_invites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  proposer_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  local            text NOT NULL,
  meeting_date     text NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','declined','rescheduled','cancelled')),
  reschedule_note  text,
  responded_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participantes veem convites do match"
  ON public.meeting_invites FOR SELECT
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "proposer cria convite"
  ON public.meeting_invites FOR INSERT
  WITH CHECK (proposer_id = auth.uid());

CREATE POLICY "receiver ou proposer atualiza"
  ON public.meeting_invites FOR UPDATE
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid());

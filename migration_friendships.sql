-- =============================================
-- FRIENDSHIPS: sistema de amigos
-- Execute no Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

-- Indices para buscas rapidas
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (a API usa service role)
CREATE POLICY "Service role full access" ON public.friendships
  FOR ALL USING (true) WITH CHECK (true);

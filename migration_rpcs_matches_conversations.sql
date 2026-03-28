-- Migration: RPCs get_my_matches e get_my_conversations + tabela filters
-- Data: 2026-03-27
-- Status: JA RODADA no Supabase
-- Correcao: usa read_at (timestamp) em vez de read (boolean)

CREATE OR REPLACE FUNCTION public.get_my_matches(p_user_id uuid)
RETURNS TABLE(
  match_id text,
  other_user_id uuid,
  name text,
  photo_best text,
  city text,
  state text,
  matched_at timestamptz,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  conversation_id text,
  last_active_at timestamptz,
  show_last_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    m.id::text AS match_id,
    CASE WHEN m.user1 = p_user_id THEN m.user2 ELSE m.user1 END AS other_user_id,
    p.name,
    p.photo_best,
    p.city,
    p.state,
    m.created_at AS matched_at,
    last_msg.content AS last_message,
    last_msg.created_at AS last_message_at,
    COALESCE(unread.cnt, 0) AS unread_count,
    m.id::text AS conversation_id,
    p.last_seen AS last_active_at,
    COALESCE(p.show_last_active, true) AS show_last_active
  FROM matches m
  JOIN profiles p ON p.id = CASE WHEN m.user1 = p_user_id THEN m.user2 ELSE m.user1 END
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM messages
    WHERE messages.match_id = m.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM messages
    WHERE messages.match_id = m.id
      AND messages.read_at IS NULL
      AND messages.sender_id != p_user_id
  ) unread ON true
  WHERE m.status = 'active'
    AND (m.user1 = p_user_id OR m.user2 = p_user_id)
  ORDER BY COALESCE(last_msg.created_at, m.created_at) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_my_conversations(p_user_id uuid)
RETURNS TABLE(
  match_id text,
  other_user_id uuid,
  other_name text,
  other_photo text,
  last_message text,
  last_message_at timestamptz,
  last_sender_id uuid,
  unread_count bigint,
  other_last_active_at timestamptz,
  other_show_last_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    m.id::text AS match_id,
    CASE WHEN m.user1 = p_user_id THEN m.user2 ELSE m.user1 END AS other_user_id,
    p.name AS other_name,
    p.photo_best AS other_photo,
    last_msg.content AS last_message,
    last_msg.created_at AS last_message_at,
    last_msg.sender_id AS last_sender_id,
    COALESCE(unread.cnt, 0) AS unread_count,
    p.last_seen AS other_last_active_at,
    COALESCE(p.show_last_active, true) AS other_show_last_active
  FROM matches m
  JOIN profiles p ON p.id = CASE WHEN m.user1 = p_user_id THEN m.user2 ELSE m.user1 END
  INNER JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM messages
    WHERE messages.match_id = m.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM messages
    WHERE messages.match_id = m.id
      AND messages.read_at IS NULL
      AND messages.sender_id != p_user_id
  ) unread ON true
  WHERE m.status = 'active'
    AND (m.user1 = p_user_id OR m.user2 = p_user_id)
  ORDER BY last_msg.created_at DESC;
$$;

CREATE TABLE IF NOT EXISTS public.filters (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  search_max_distance_km integer DEFAULT 40,
  search_min_age       integer DEFAULT 18,
  search_max_age       integer DEFAULT 60,
  search_gender        text DEFAULT 'all',
  search_state         text DEFAULT '',
  search_saved         boolean DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'filters' AND policyname = 'Users can read own filters') THEN
    CREATE POLICY "Users can read own filters" ON public.filters FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'filters' AND policyname = 'Users can update own filters') THEN
    CREATE POLICY "Users can update own filters" ON public.filters FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'filters' AND policyname = 'Users can insert own filters') THEN
    CREATE POLICY "Users can insert own filters" ON public.filters FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'filters' AND policyname = 'Service role full access on filters') THEN
    CREATE POLICY "Service role full access on filters" ON public.filters FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

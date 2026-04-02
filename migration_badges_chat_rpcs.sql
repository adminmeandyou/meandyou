-- =============================================
-- BADGES: RPCs de agregacao (evita full table scan em JavaScript)
-- CHAT: insert atomico com rate limit no banco
-- Execute no Supabase SQL Editor
-- =============================================

-- Likes recebidos por usuario
CREATE OR REPLACE FUNCTION public.get_users_likes_received(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT to_user AS user_id
  FROM public.likes
  WHERE to_user IS NOT NULL
  GROUP BY to_user
  HAVING COUNT(*) >= min_count;
$$;

-- Likes enviados por usuario
CREATE OR REPLACE FUNCTION public.get_users_likes_sent(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT from_user AS user_id
  FROM public.likes
  WHERE from_user IS NOT NULL
  GROUP BY from_user
  HAVING COUNT(*) >= min_count;
$$;

-- Mensagens enviadas por usuario
CREATE OR REPLACE FUNCTION public.get_users_messages_sent(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT sender_id AS user_id
  FROM public.messages
  WHERE sender_id IS NOT NULL
  GROUP BY sender_id
  HAVING COUNT(*) >= min_count;
$$;

-- Mensagens recebidas por usuario (join com matches para descobrir o receptor)
CREATE OR REPLACE FUNCTION public.get_users_messages_received(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT receiver AS user_id
  FROM (
    SELECT
      CASE WHEN m.user1 = msg.sender_id THEN m.user2 ELSE m.user1 END AS receiver
    FROM public.messages msg
    JOIN public.matches m ON m.id = msg.match_id
    WHERE msg.sender_id IS NOT NULL
  ) t
  WHERE receiver IS NOT NULL
  GROUP BY receiver
  HAVING COUNT(*) >= min_count;
$$;

-- Total de interacoes (enviadas + recebidas) por usuario
CREATE OR REPLACE FUNCTION public.get_users_messages_total(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id FROM (
    SELECT sender_id AS user_id FROM public.messages WHERE sender_id IS NOT NULL
    UNION ALL
    SELECT
      CASE WHEN m.user1 = msg.sender_id THEN m.user2 ELSE m.user1 END AS user_id
    FROM public.messages msg
    JOIN public.matches m ON m.id = msg.match_id
    WHERE msg.sender_id IS NOT NULL
  ) t
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) >= min_count;
$$;

-- Matches ativos por usuario
CREATE OR REPLACE FUNCTION public.get_users_matches(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id FROM (
    SELECT user1 AS user_id FROM public.matches WHERE status = 'active' AND user1 IS NOT NULL
    UNION ALL
    SELECT user2 AS user_id FROM public.matches WHERE status = 'active' AND user2 IS NOT NULL
  ) t
  GROUP BY user_id
  HAVING COUNT(*) >= min_count;
$$;

-- Sessoes de video por usuario
CREATE OR REPLACE FUNCTION public.get_users_video_calls(min_count int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id
  FROM public.video_minutes
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) >= min_count;
$$;

-- Minutos de video por usuario
CREATE OR REPLACE FUNCTION public.get_users_video_minutes(min_minutes int)
RETURNS TABLE(user_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id
  FROM public.video_minutes
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COALESCE(SUM(minutes), 0) >= min_minutes;
$$;

-- =============================================
-- CHAT: send_chat_message atomico com rate limit
-- =============================================
-- Advisory lock serializa envios simultaneos do mesmo usuario no mesmo match,
-- eliminando a race condition de COUNT -> INSERT separados.

CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_match_id  uuid,
  p_sender_id uuid,
  p_content   text,
  p_limit     int      DEFAULT 20,
  p_window    interval DEFAULT '60 seconds'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_count int;
  v_id        uuid;
  v_created   timestamptz;
BEGIN
  -- Lock transacional por usuario+match: serializa envios simultaneos.
  -- Libera automaticamente ao final da transacao.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_sender_id::text)::bigint,
    hashtext(p_match_id::text)::bigint
  );

  -- Contar mensagens na janela (dentro do lock — sem race condition)
  SELECT COUNT(*) INTO v_count
  FROM public.messages
  WHERE sender_id = p_sender_id
    AND match_id  = p_match_id
    AND created_at > now() - p_window;

  IF v_count >= p_limit THEN
    RETURN json_build_object('status', 'rate_limited');
  END IF;

  -- Inserir mensagem
  INSERT INTO public.messages (match_id, sender_id, content, read_at)
  VALUES (p_match_id, p_sender_id, p_content, NULL)
  RETURNING id, created_at INTO v_id, v_created;

  RETURN json_build_object(
    'status', 'ok',
    'message', json_build_object(
      'id',         v_id,
      'match_id',   p_match_id,
      'sender_id',  p_sender_id,
      'content',    p_content,
      'read_at',    null,
      'created_at', v_created
    )
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.send_chat_message(uuid, uuid, text, int, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_chat_message(uuid, uuid, text, int, interval) TO service_role;

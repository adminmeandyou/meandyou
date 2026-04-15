-- Corrige send_chat_message: pg_advisory_xact_lock(bigint, bigint) nao existe no Supabase.
-- Usa pg_advisory_xact_lock(bigint) com hash combinado (XOR) dos dois valores.

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
  v_count     int;
  v_id        uuid;
  v_created   timestamptz;
  v_lock_key  bigint;
BEGIN
  -- Combina os dois hashes num unico bigint para o advisory lock
  v_lock_key := hashtext(p_sender_id::text)::bigint # hashtext(p_match_id::text)::bigint;

  PERFORM pg_advisory_xact_lock(v_lock_key);

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

-- =============================================
-- SALAS: entrar_sala atomico com lock de capacidade
-- Execute no Supabase SQL Editor
-- =============================================
--
-- Resolve race condition em entradas simultaneas:
-- sem esta funcao, dois usuarios podiam entrar ao mesmo tempo,
-- ambos passavam no COUNT, e a sala ficava acima do max_members.
--
-- Solucao: SELECT ... FOR UPDATE na linha da chat_rooms serializa
-- todas as entradas concorrentes para a mesma sala.

CREATE OR REPLACE FUNCTION public.entrar_sala(
  p_room_id  uuid,
  p_user_id  uuid,
  p_nickname text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_members integer;
  v_count       integer;
  v_existing    text;
BEGIN
  -- Lock na linha da sala: serializa entradas concorrentes para a mesma sala.
  -- Duas chamadas simultaneas para a mesma sala serao executadas em sequencia,
  -- nao em paralelo. Salas diferentes nao se bloqueiam entre si.
  SELECT max_members INTO v_max_members
  FROM public.chat_rooms
  WHERE id = p_room_id AND is_active = true
  FOR UPDATE;

  IF v_max_members IS NULL THEN
    RETURN json_build_object('status', 'sala_nao_encontrada');
  END IF;

  -- Verificar se usuario ja esta na sala
  SELECT nickname INTO v_existing
  FROM public.room_members
  WHERE room_id = p_room_id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('status', 'ja_membro', 'nickname', v_existing);
  END IF;

  -- Remover membros fantasmas (sem heartbeat ha mais de 2 minutos)
  DELETE FROM public.room_members
  WHERE room_id = p_room_id
    AND last_heartbeat < now() - interval '2 minutes';

  -- Contar membros ativos (dentro do lock — contagem confiavel)
  SELECT COUNT(*) INTO v_count
  FROM public.room_members
  WHERE room_id = p_room_id;

  IF v_count >= v_max_members THEN
    RETURN json_build_object('status', 'sala_cheia');
  END IF;

  -- Inserir membro
  INSERT INTO public.room_members (room_id, user_id, nickname, last_heartbeat)
  VALUES (p_room_id, p_user_id, p_nickname, now());

  RETURN json_build_object('status', 'ok', 'nickname', p_nickname);

EXCEPTION
  -- Caso extremamente raro: usuario ja era membro (corrida no primeiro SELECT)
  WHEN unique_violation THEN
    SELECT nickname INTO v_existing
    FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id;
    RETURN json_build_object('status', 'ja_membro', 'nickname', COALESCE(v_existing, p_nickname));
END;
$$;

-- Apenas service role pode chamar
REVOKE ALL ON FUNCTION public.entrar_sala(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.entrar_sala(uuid, uuid, text) TO service_role;

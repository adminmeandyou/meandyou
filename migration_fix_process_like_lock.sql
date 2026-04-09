-- migration_fix_process_like_lock.sql
-- Corrige race condition em process_like: dois usuarios dando like mutuo
-- simultaneamente podiam nao gerar match ou gerar match duplicado.
-- Solucao: advisory lock canonico por par de usuarios + unique constraint na tabela matches.

-- 1. Unique constraint para prevenir matches duplicados como rede de segurança
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_users_unique,
  ADD CONSTRAINT matches_users_unique UNIQUE (
    LEAST(user1::text, user2::text)::uuid,
    GREATEST(user1::text, user2::text)::uuid
  );

-- 2. RPC process_like com lock advisory canonico por par
CREATE OR REPLACE FUNCTION public.process_like(
  p_user_id      uuid,
  p_target_id    uuid,
  p_is_superlike boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mutual        boolean := false;
  v_match_id      uuid;
  v_existing_match uuid;
  v_existing_like  uuid;
  v_lock_key       bigint;
BEGIN
  -- Evitar like em si mesmo
  IF p_user_id = p_target_id THEN
    RETURN jsonb_build_object('is_match', false, 'error', 'cannot_like_self');
  END IF;

  -- Lock advisory canonico: garante que apenas UMA transacao processa
  -- o par (A, B) por vez, independente da ordem de chamada.
  -- Usa o hash do par ordenado para sempre obter o mesmo lock key.
  v_lock_key := ('x' || left(
    md5(LEAST(p_user_id::text, p_target_id::text) || '|' || GREATEST(p_user_id::text, p_target_id::text)),
    16
  ))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Verificar se ja existe match ativo entre os dois (dentro do lock)
  SELECT id INTO v_existing_match
  FROM matches
  WHERE status = 'active'
    AND ((user1 = p_user_id AND user2 = p_target_id)
      OR (user1 = p_target_id AND user2 = p_user_id))
  LIMIT 1;

  IF v_existing_match IS NOT NULL THEN
    RETURN jsonb_build_object('is_match', true, 'match_id', v_existing_match::text);
  END IF;

  -- Inserir ou atualizar o like (upsert)
  INSERT INTO likes (user_id, target_id, is_superlike, created_at)
  VALUES (p_user_id, p_target_id, p_is_superlike, now())
  ON CONFLICT (user_id, target_id)
  DO UPDATE SET is_superlike = p_is_superlike, created_at = now();

  -- Remover dislike anterior se existir
  DELETE FROM dislikes
  WHERE from_user = p_user_id AND to_user = p_target_id;

  -- Verificar se o outro usuario ja deu like em mim (dentro do lock — agora e seguro)
  SELECT l.user_id INTO v_existing_like
  FROM likes l
  WHERE l.user_id = p_target_id
    AND l.target_id = p_user_id
  LIMIT 1;

  IF v_existing_like IS NOT NULL THEN
    -- MATCH! Criar o match com ON CONFLICT para segurança extra
    v_mutual := true;
    v_match_id := gen_random_uuid();

    INSERT INTO matches (id, user1, user2, status, created_at)
    VALUES (v_match_id, p_user_id, p_target_id, 'active', now())
    ON CONFLICT ON CONSTRAINT matches_users_unique DO NOTHING;

    -- Recuperar o match_id real (pode ter sido criado por outra transacao antes do lock)
    IF NOT FOUND THEN
      SELECT id INTO v_match_id
      FROM matches
      WHERE status = 'active'
        AND ((user1 = p_user_id AND user2 = p_target_id)
          OR (user1 = p_target_id AND user2 = p_user_id))
      LIMIT 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_match', v_mutual,
    'match_id', CASE WHEN v_mutual THEN v_match_id::text ELSE NULL END
  );
END;
$$;

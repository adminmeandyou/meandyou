-- =============================================
-- FRIENDSHIPS V2: proteger amigos da expiracao + limpar mensagens antigas
-- Execute no Supabase SQL Editor
-- (tabela friendships ja existe da v1)
-- =============================================

-- 1. Atualizar expire_matches para ignorar matches com amizade aceita
CREATE OR REPLACE FUNCTION public.expire_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marca como expired matches SEM conversa com mais de 7 dias
  -- EXCETO se existe amizade aceita entre os dois usuarios
  UPDATE public.matches
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND conversation_id IS NULL
    AND created_at < now() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = matches.user1_id AND f.receiver_id = matches.user2_id)
          OR (f.requester_id = matches.user2_id AND f.receiver_id = matches.user1_id)
        )
    );

  -- Marca como expired matches COM conversa mas 14 dias de inatividade
  -- EXCETO se existe amizade aceita
  UPDATE public.matches m
  SET status = 'expired', updated_at = now()
  FROM public.conversations c
  WHERE m.status = 'active'
    AND m.conversation_id = c.id
    AND c.last_message_at < now() - INTERVAL '14 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = m.user1_id AND f.receiver_id = m.user2_id)
          OR (f.requester_id = m.user2_id AND f.receiver_id = m.user1_id)
        )
    );
END;
$$;

-- 2. Funcao para limpar mensagens com mais de 30 dias
-- Mantem as ultimas 50 mensagens de cada conversa (mesmo que tenham mais de 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.messages
  WHERE created_at < now() - INTERVAL '30 days'
    AND id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY created_at DESC) as rn
        FROM public.messages
      ) ranked
      WHERE rn <= 50
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Permissoes
REVOKE ALL ON FUNCTION public.cleanup_old_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages() TO service_role;

// src/hooks/useChat.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export function useChat(matchId: string) {
  const supabase = createClient()
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<any>(null)

  // Carregar histórico
  useEffect(() => {
    if (!matchId || !user) return
    loadMessages()
    subscribeRealtime()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [matchId, user])

  async function loadMessages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      setError('Erro ao carregar mensagens.')
    } else {
      setMessages(data ?? [])
      markAsRead(data ?? [])
    }
    setLoading(false)
  }

  // Marcar mensagens do outro como lidas
  async function markAsRead(msgs: Message[]) {
    if (!user) return
    const unread = msgs
      .filter((m) => m.sender_id !== user.id && !m.read_at)
      .map((m) => m.id)

    if (unread.length === 0) return

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unread)
  }

  // Realtime
  function subscribeRealtime() {
    channelRef.current = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Evita duplicatas
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Marca como lido se for do outro
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
          }
        }
      )
      .subscribe()
  }

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim() || sending) return
    setSending(true)
    setError(null)

    const trimmed = content.trim()

    // Otimistic update
    const tempId = crypto.randomUUID()
    const tempMsg: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      content: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages((prev) => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: user.id, content: trimmed })
      .select()
      .single()

    if (error) {
      // Reverter optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setError('Erro ao enviar mensagem. Tente novamente.')
    } else {
      // Substituir temp pelo real
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)))
    }

    setSending(false)
  }, [user, matchId, sending, supabase])

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    currentUserId: user?.id,
  }
}
// src/hooks/useChat.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { awardXp } from '@/app/lib/xp'

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

const MAX_CHARS = 500
const MAX_MSGS_PER_MIN = 5  // rate limit client: 5 msgs/min sem resposta do outro

export function useChat(matchId: string) {
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rateLimitRef = useRef<{ count: number; lastReset: number; waitingReply: boolean }>({
    count: 0,
    lastReset: Date.now(),
    waitingReply: false,
  })

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!matchId || !user) return
    loadMessages()
    subscribeRealtime()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [matchId, user?.id])

  async function loadMessages() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (err) {
      setError('Erro ao carregar mensagens.')
    } else {
      setMessages(data ?? [])
      markAsRead(data ?? [])
    }
    setLoading(false)
  }

  async function markAsRead(msgs: Message[]) {
    if (!user) return
    const unread = msgs
      .filter(m => m.sender_id !== user.id && !m.read_at)
      .map(m => m.id)

    if (unread.length === 0) return

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unread)
  }

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
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Se for mensagem do outro usuário → reseta rate limit e marca como lida
          if (newMsg.sender_id !== user?.id) {
            rateLimitRef.current.count = 0
            rateLimitRef.current.waitingReply = false

            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {})
          }
        }
      )
      .subscribe()
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!user || sending) return

    const trimmed = content.trim()
    if (!trimmed) return

    // Limite de caracteres
    if (trimmed.length > MAX_CHARS) {
      setError(`Mensagem muito longa. Máximo de ${MAX_CHARS} caracteres.`)
      return
    }

    // Rate limit: 5 msgs/min sem resposta
    const rl = rateLimitRef.current
    const agora = Date.now()
    const umMinuto = 60 * 1000

    if (agora - rl.lastReset > umMinuto) {
      rl.count = 0
      rl.lastReset = agora
      rl.waitingReply = false
    }

    if (rl.waitingReply && rl.count >= MAX_MSGS_PER_MIN) {
      setError('Aguarde a resposta antes de enviar mais mensagens.')
      return
    }

    setSending(true)
    setError(null)

    // Optimistic update
    const tempId = crypto.randomUUID()
    const tempMsg: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      content: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, tempMsg])

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ matchId, content: trimmed }),
    })

    const json = await res.json()

    if (!res.ok) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError(json.error ?? 'Erro ao enviar mensagem. Tente novamente.')
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? json.message : m))
      rl.count++
      rl.waitingReply = true
      if (user) awardXp(user.id, 'message_sent')
    }

    setSending(false)
  }, [user, matchId, sending])

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    currentUserId: user?.id,
  }
}

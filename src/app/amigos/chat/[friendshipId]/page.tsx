'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { useToast } from '@/components/Toast'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

type FriendInfo = {
  name: string
  photo_best: string | null
  city: string | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function FriendChatPage() {
  const router = useRouter()
  const params = useParams()
  const friendshipId = params.friendshipId as string
  const toast = useToast()

  const [myUserId, setMyUserId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [friendInfo, setFriendInfo] = useState<FriendInfo | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyUserId(user.id)
      await loadChat(user.id)
    }
    init()
  }, [friendshipId])

  // Realtime
  useEffect(() => {
    if (!myUserId) return
    const channel = supabase
      .channel(`friend-chat-${friendshipId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_messages',
        filter: `friendship_id=eq.${friendshipId}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myUserId, friendshipId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages.length])

  async function loadChat(userId: string) {
    setLoading(true)
    try {
      // Buscar mensagens
      const res = await fetch(`/api/amigos/chat/${friendshipId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      } else if (res.status === 404) {
        router.push('/amigos')
        return
      }

      // Buscar info do amigo
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, receiver_id')
        .eq('id', friendshipId)
        .single()

      if (friendships) {
        const otherId = friendships.requester_id === userId ? friendships.receiver_id : friendships.requester_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, photo_best, city')
          .eq('id', otherId)
          .single()
        if (profile) setFriendInfo(profile)
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }

  async function sendMessage() {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      const res = await fetch(`/api/amigos/chat/${friendshipId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setText(content)
        toast.error(data.error ?? 'Erro ao enviar mensagem')
      } else if (data.message) {
        const msg = data.message as Message
        setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
      }
    } catch {
      setText(content)
      toast.error('Sem conexão. Tente de novo.')
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // Agrupar mensagens por dia
  const grouped: Array<{ day: string; msgs: Message[] }> = []
  for (const msg of messages) {
    const day = formatDay(msg.created_at)
    if (!grouped.length || grouped[grouped.length - 1].day !== day) {
      grouped.push({ day, msgs: [msg] })
    } else {
      grouped[grouped.length - 1].msgs.push(msg)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border-soft)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        {friendInfo?.photo_best ? (
          <img src={friendInfo.photo_best} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} color="var(--muted)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {friendInfo?.name ?? '...'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>
            Mensagens somem após 30 dias
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>Carregando...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Users size={24} color="var(--accent)" />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhuma mensagem ainda</p>
            <p style={{ color: 'var(--muted-2)', fontSize: 12, margin: '6px 0 0', lineHeight: 1.6 }}>
              Diga oi para {friendInfo?.name ?? 'seu amigo'}!<br />
              Mensagens somem após 30 dias, mas a amizade fica.
            </p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.day}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-soft)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>{group.day}</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-soft)' }} />
              </div>
              {group.msgs.map(msg => {
                const mine = msg.sender_id === myUserId
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                    <div style={{
                      maxWidth: '78%',
                      padding: '9px 13px',
                      borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: mine ? 'var(--accent)' : 'var(--bg-card)',
                      color: mine ? '#fff' : 'var(--text)',
                      fontSize: 14,
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}>
                      <span>{msg.content}</span>
                      <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 8, whiteSpace: 'nowrap' }}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 20px', borderTop: '1px solid var(--border-soft)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Mensagem..."
            maxLength={500}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 14,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--font-jakarta)',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              backgroundColor: text.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: text.trim() ? '#fff' : 'var(--muted)',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
        {text.length > 400 && (
          <p style={{ fontSize: 11, color: text.length >= 500 ? '#f87171' : 'var(--muted)', margin: '6px 0 0', textAlign: 'right' }}>
            {text.length}/500
          </p>
        )}
      </div>
    </div>
  )
}

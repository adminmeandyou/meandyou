'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Send, Video, ShieldAlert,
  Loader2, AlertCircle, Lock, Mic,
  Sparkles, CalendarPlus, Zap, X, CalendarCheck, Star, Coffee
} from 'lucide-react'
import { ChatBubble } from '@/components/ui/ChatBubble'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  // ✅ campo correto: 'read' boolean, não 'read_at'
  read: boolean
}

interface OtherUser {
  id: string
  name: string
  photo_best: string | null
  verified: boolean
}

const MAX_CHARS = 500
const CONVITE_PREFIX = '__CONVITE__:'
const NUDGE_TOKEN = '__NUDGE__'

const ICEBREAKERS = [
  'Qual o melhor lugar que voce ja visitou?',
  'Se pudesse viajar agora, para onde iria?',
  'O que voce faria num sabado perfeito?',
  'Series ou filmes? Qual recomenda?',
  'Qual superpoder voce escolheria?',
  'Cafe da manha ou jantar romantico?',
]

export default function ChatPage() {
  const params = useParams()
  const matchId = params.id as string
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [rateLimited, setRateLimited] = useState(false)
  const [emergencyModal, setEmergencyModal] = useState(false)

  // Novas features
  const [showIcebreakers, setShowIcebreakers] = useState(false)
  const [showConvite, setShowConvite] = useState(false)
  const [conviteText, setConviteText] = useState('')
  const [shake, setShake] = useState(false)
  const [pendingConvite, setPendingConvite] = useState<string | null>(null)

  // Gamificacao Fase 7
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [showBoloModal, setShowBoloModal] = useState(false)
  const [boloDone, setBoloDone] = useState(false)
  const [boloOportunidade, setBoloOportunidade] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      initChat(user.id)
    })

    return () => {
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [matchId])

  async function initChat(uid: string) {
    setLoading(true)

    // Verifica se o match pertence ao usuário
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, user1, user2')
      .eq('id', matchId)
      .or(`user1.eq.${uid},user2.eq.${uid}`)
      .single()

    if (matchErr || !match) {
      router.push('/conversas')
      return
    }

    const otherId = match.user1 === uid ? match.user2 : match.user1

    // Busca perfil do outro — sem campos sensíveis
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, photo_best')
      .eq('id', otherId)
      .single()

    // Busca se é verificado (tabela users, coluna verified)
    const { data: userRow } = await supabase
      .from('users')
      .select('verified')
      .eq('id', otherId)
      .single()

    setOtherUser({
      id: otherId,
      name: profile?.name ?? 'Usuario',
      photo_best: profile?.photo_best ?? null,
      // ✅ verified fica em users, não profiles
      verified: userRow?.verified ?? false,
    })

    // Carrega mensagens
    await loadMessages(uid)

    // Marca mensagens recebidas como lidas
    await marcarComoLidas(uid)

    // Detecta convite pendente não respondido
    detectPendingConvite(uid)

    // Realtime: escuta novas mensagens deste match
    channelRef.current = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          // Detecta convite recebido e atualiza banner
          if (newMsg.sender_id !== uid && newMsg.content.startsWith(CONVITE_PREFIX)) {
            const text = newMsg.content.slice(CONVITE_PREFIX.length)
            setPendingConvite(text)
          }
          // Nudge recebido: haptics + shake
          if (newMsg.sender_id !== uid && newMsg.content === NUDGE_TOKEN) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            setShake(true)
            setTimeout(() => setShake(false), 700)
          }
          return [...prev, newMsg]
        })
        // Se a mensagem é do outro, marca como lida automaticamente
        if (newMsg.sender_id !== uid) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMsg.id)
        }
        scrollToBottom()
      })
      .subscribe()

    setLoading(false)
    scrollToBottom()
  }

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data || [])
  }

  async function marcarComoLidas(uid: string) {
    // ✅ CORREÇÃO: campo 'read' boolean (não 'read_at')
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', uid)
      .eq('read', false)
  }

  function detectPendingConvite(uid: string) {
    // Detecta se há convite recebido sem resposta (busca nas mensagens carregadas)
    // Será chamado após loadMessages, portanto precisamos passar mensagens como param ou usar state
    // Solução: chamado depois de loadMessages via useEffect em messages
  }

  // Detecta convite pendente toda vez que messages mudar
  useEffect(() => {
    if (!userId || messages.length === 0) return
    // Busca último convite recebido (não meu)
    const convites = messages
      .filter(m => m.sender_id !== userId && m.content.startsWith(CONVITE_PREFIX))
    if (convites.length === 0) { setPendingConvite(null); return }
    const ultimo = convites[convites.length - 1]
    // Verifica se já foi respondido (alguma mensagem minha depois do convite)
    const meuIdx = messages.findIndex(m => m.id === ultimo.id)
    const houveResposta = messages.slice(meuIdx + 1).some(m => m.sender_id === userId)
    setPendingConvite(houveResposta ? null : ultimo.content.slice(CONVITE_PREFIX.length))

    // Detector de Bolo: verifica se houve convite + "Aceito!" como resposta minha
    if (!boloDone) {
      const aceitei = messages.some(m => m.sender_id === userId && m.content === 'Aceito!')
      if (aceitei) setBoloOportunidade(true)
    }
  }, [messages, userId])

  function scrollToBottom() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // ✅ Rate limit local: 5 msgs seguidas sem resposta bloqueiam envio
  function checkRateLimit(): boolean {
    if (!userId) return false
    const ultimas = [...messages].reverse()
    let seguidas = 0
    for (const m of ultimas) {
      if (m.sender_id === userId) seguidas++
      else break
    }
    return seguidas >= 5
  }

  // Função base de envio — usada por handleSend e ações especiais
  async function sendMessage(content: string) {
    if (!content || !userId || sending) return
    setSending(true)
    setError('')
    setRateLimited(false)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ matchId, content }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Erro ao enviar mensagem. Tente novamente.')
    }

    setSending(false)
    scrollToBottom()
  }

  async function handleSend() {
    const texto = input.trim()
    if (!texto || !userId || sending) return
    if (texto.length > MAX_CHARS) { setError(`Maximo ${MAX_CHARS} caracteres.`); return }

    if (checkRateLimit()) {
      setRateLimited(true)
      setError('Aguarde uma resposta antes de enviar mais mensagens.')
      return
    }

    setInput('')
    await sendMessage(texto)
    inputRef.current?.focus()
  }

  async function handleNudge() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 150])
    await sendMessage(NUDGE_TOKEN)
  }

  async function handleSendConvite() {
    const texto = conviteText.trim()
    if (!texto) return
    await sendMessage(`${CONVITE_PREFIX}${texto}`)
    setShowConvite(false)
    setConviteText('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleRating(opcao: string) {
    setRatingDone(true)
    setShowRatingModal(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      // Tentativa silenciosa — tabela match_ratings pode nao existir ainda
      await supabase.from('match_ratings').insert({
        match_id: matchId,
        rater_id: userId,
        rated_id: otherUser?.id,
        rating: opcao,
      })
    } catch { /* silencioso */ }
  }

  async function handleBolo(opcao: string) {
    setBoloDone(true)
    setShowBoloModal(false)
    setBoloOportunidade(false)
    if (opcao === 'bolo') {
      try {
        await supabase.from('bolo_reports').insert({
          match_id: matchId,
          reporter_id: userId,
          reported_id: otherUser?.id,
        })
      } catch { /* silencioso */ }
    }
  }

  function formatMsgTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Agrupa mensagens por data
  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  // Renderiza uma mensagem (normal, nudge ou convite)
  function renderMsg(msg: Message, isMe: boolean) {
    // Nudge
    if (msg.content === NUDGE_TOKEN) {
      return (
        <div key={msg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={12} color="var(--accent)" />
            {isMe ? 'Voce deu um nudge!' : `${otherUser?.name} deu um nudge!`}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )
    }

    // Convite encontro
    if (msg.content.startsWith(CONVITE_PREFIX)) {
      const texto = msg.content.slice(CONVITE_PREFIX.length)
      return (
        <ConviteCard
          key={msg.id}
          text={texto}
          isMe={isMe}
          time={formatMsgTime(msg.created_at)}
          onReply={(r) => sendMessage(r)}
        />
      )
    }

    // Mensagem normal — usa ChatBubble da Fase 2
    return (
      <ChatBubble
        key={msg.id}
        message={msg.content}
        direction={isMe ? 'sent' : 'received'}
        time={formatMsgTime(msg.created_at)}
        status={isMe ? (msg.read ? 'read' : 'delivered') : undefined}
      />
    )
  }

  // Renderiza mensagens com separadores de data
  function renderMessages() {
    const items: React.ReactNode[] = []
    let lastDate = ''

    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.created_at)
      if (dateLabel !== lastDate) {
        lastDate = dateLabel
        items.push(
          <div key={`date-${msg.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted-2)', padding: '0 8px', whiteSpace: 'nowrap' }}>{dateLabel}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        )
      }

      const isMe = msg.sender_id === userId
      items.push(renderMsg(msg, isMe))
    })

    return items
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="rgba(248,249,250,0.3)" className="animate-spin" />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes nudge-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .chat-shake { animation: nudge-shake 0.65s ease; }
      `}</style>

      <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta)', position: 'relative' }}>

        {/* ── Header ── */}
        <header style={{
          flexShrink: 0,
          background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
        }}>
          <button
            onClick={() => router.push('/conversas')}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
          </button>

          {/* Avatar clicável → perfil */}
          <Link href={`/perfil/${otherUser?.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textDecoration: 'none' }}>
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', flexShrink: 0, border: '1px solid var(--border)' }}>
              {otherUser?.photo_best ? (
                <Image src={otherUser.photo_best} alt={otherUser.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 16 }}>{otherUser?.name[0]}</span>
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {otherUser?.name}
                {otherUser?.verified && (
                  <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--accent)' }}>✓</span>
                )}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: 0 }}>Toque para ver perfil</p>
            </div>
          </Link>

          {/* Botão de videochamada */}
          <button
            onClick={() => router.push(`/videochamada/${matchId}`)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            title="Videochamada"
          >
            <Video size={15} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
          </button>

          {/* Botão de emergência oculto */}
          <button
            onClick={() => setEmergencyModal(true)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            title="Emergencia"
          >
            <ShieldAlert size={15} color="rgba(248,249,250,0.20)" strokeWidth={1.5} />
          </button>
        </header>

        {/* ── Banner convite pendente ── */}
        {pendingConvite && (
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: 'rgba(225,29,72,0.10)',
            borderBottom: '1px solid var(--accent-border)',
          }}>
            <CalendarCheck size={15} color="var(--accent)" strokeWidth={1.5} />
            <p style={{ flex: 1, fontSize: 13, color: 'var(--accent)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Convite: {pendingConvite}
            </p>
            <button
              onClick={() => sendMessage('Aceito!')}
              style={{
                padding: '4px 12px', borderRadius: 100,
                background: 'var(--accent)', border: 'none',
                fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}
            >
              Aceito!
            </button>
            <button
              onClick={() => setPendingConvite(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} color="var(--muted)" />
            </button>
          </div>
        )}

        {/* ── Aviso de privacidade ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '6px 0',
          color: 'var(--muted-2)', fontSize: 11,
        }}>
          <Lock size={9} strokeWidth={1.5} />
          Conversa privada — respeite os limites
        </div>

        {/* ── Mensagens ── */}
        <div
          className={shake ? 'chat-shake' : ''}
          style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px' }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted-2)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', position: 'relative' }}>
                {otherUser?.photo_best && (
                  <Image src={otherUser.photo_best} alt="" fill className="object-cover" sizes="64px" />
                )}
              </div>
              <p style={{ fontSize: 14, textAlign: 'center', margin: 0 }}>
                Voces fizeram um match!<br />
                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Seja o(a) primeiro(a) a dizer ola.</span>
              </p>
            </div>
          ) : (
            <>
              {renderMessages()}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Erro / rate limit ── */}
        {(error || rateLimited) && (
          <div style={{
            flexShrink: 0, margin: '0 16px 8px',
            padding: '8px 12px', borderRadius: 12,
            background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} color="#F43F5E" />
            <p style={{ fontSize: 12, color: '#F43F5E', margin: 0 }}>
              {error || 'Aguarde uma resposta antes de enviar mais mensagens.'}
            </p>
          </div>
        )}

        {/* ── Painel Quebra-gelo ── */}
        {showIcebreakers && (
          <div style={{
            flexShrink: 0, margin: '0 16px 8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: '14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="var(--accent)" strokeWidth={1.5} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Quebra-gelo</span>
              </div>
              <button onClick={() => setShowIcebreakers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} color="var(--muted)" />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICEBREAKERS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); setShowIcebreakers(false); inputRef.current?.focus() }}
                  style={{
                    padding: '7px 12px', borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--muted)', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Painel Convite Encontro ── */}
        {showConvite && (
          <div style={{
            flexShrink: 0, margin: '0 16px 8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: '14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarPlus size={14} color="var(--accent)" strokeWidth={1.5} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Convite de Encontro</span>
              </div>
              <button onClick={() => setShowConvite(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} color="var(--muted)" />
              </button>
            </div>
            <input
              type="text"
              value={conviteText}
              onChange={e => setConviteText(e.target.value)}
              placeholder="Ex: Tomar um cafe sabado, 14h?"
              maxLength={200}
              autoFocus
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-jakarta)', marginBottom: 10,
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSendConvite() }}
            />
            <button
              onClick={handleSendConvite}
              disabled={!conviteText.trim() || sending}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12,
                background: conviteText.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: conviteText.trim() ? 'pointer' : 'default',
                color: conviteText.trim() ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--font-jakarta)', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CalendarPlus size={14} />
              Enviar convite
            </button>
          </div>
        )}

        {/* ── Barra de entrada ── */}
        <div style={{
          flexShrink: 0,
          background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          padding: '10px 16px',
        }}>
          {/* Botões de ações rápidas */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {/* Mic */}
            <ActionBtn
              icon={<Mic size={14} strokeWidth={1.5} />}
              label="Audio"
              onClick={() => setError('Audio em breve')}
            />
            {/* Quebra-gelo */}
            <ActionBtn
              icon={<Sparkles size={14} strokeWidth={1.5} />}
              label="Quebra-gelo"
              onClick={() => { setShowConvite(false); setShowIcebreakers(v => !v) }}
              active={showIcebreakers}
            />
            {/* Convite */}
            <ActionBtn
              icon={<CalendarPlus size={14} strokeWidth={1.5} />}
              label="Encontro"
              onClick={() => { setShowIcebreakers(false); setShowConvite(v => !v) }}
              active={showConvite}
            />
            {/* Nudge */}
            <ActionBtn
              icon={<Zap size={14} strokeWidth={1.5} />}
              label="Nudge"
              onClick={handleNudge}
              accent
            />
            {/* Avaliar — so aparece apos 5+ msgs e nao avaliou ainda */}
            {messages.length >= 5 && !ratingDone && (
              <ActionBtn
                icon={<Star size={14} strokeWidth={1.5} />}
                label="Avaliar"
                onClick={() => setShowRatingModal(true)}
              />
            )}
            {/* Bolo — so aparece se aceitou encontro */}
            {boloOportunidade && !boloDone && (
              <ActionBtn
                icon={<Coffee size={14} strokeWidth={1.5} />}
                label="O encontro?"
                onClick={() => setShowBoloModal(true)}
                active
              />
            )}
          </div>

          {/* Input + send */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (error) setError('')
                  if (rateLimited) setRateLimited(false)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem..."
                maxLength={MAX_CHARS}
                rows={1}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border)',
                  borderRadius: 14, padding: '11px 14px',
                  fontSize: 14, color: 'var(--text)',
                  outline: 'none', resize: 'none', overflow: 'hidden',
                  maxHeight: 120, boxSizing: 'border-box',
                  fontFamily: 'var(--font-jakarta)',
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
              {input.length > MAX_CHARS * 0.8 && (
                <span style={{
                  position: 'absolute', bottom: 8, right: 12,
                  fontSize: 10,
                  color: input.length >= MAX_CHARS ? '#F43F5E' : 'var(--muted-2)',
                }}>
                  {input.length}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || input.length > MAX_CHARS}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: input.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s',
                boxShadow: input.trim() ? '0 4px 16px rgba(225,29,72,0.30)' : 'none',
              }}
            >
              {sending
                ? <Loader2 size={18} color="#fff" className="animate-spin" />
                : <Send size={18} color={input.trim() ? '#fff' : 'var(--muted)'} strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>

        {/* ── Modal Avaliacao Anonima ── */}
        {showRatingModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowRatingModal(false)}
          >
            <div
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: 0 }}>Como foi a conversa?</h3>
                <button onClick={() => setShowRatingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="var(--muted)" strokeWidth={1.5} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 20px' }}>Avaliacao anonima — {otherUser?.name} nao saberá quem avaliou.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'incrivel', emoji: '✨', label: 'Pessoa incrivel!', color: '#10b981' },
                  { id: 'agradavel', emoji: '😊', label: 'Conversa agradavel', color: '#60a5fa' },
                  { id: 'nao_interessei', emoji: '😐', label: 'Nao me interessei', color: 'rgba(248,249,250,0.45)' },
                  { id: 'ignorado', emoji: '😶', label: 'Fui ignorado(a)', color: '#F43F5E' },
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => handleRating(op.id)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: 15, fontWeight: 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-jakarta)', transition: 'all 0.15s' }}
                  >
                    <span style={{ fontSize: 20 }}>{op.emoji}</span>
                    <span style={{ color: op.color }}>{op.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Detector de Bolo ── */}
        {showBoloModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', padding: 20 }}
            onClick={() => setShowBoloModal(false)}
          >
            <div
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px', maxWidth: 360, width: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>☕</div>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>O encontro aconteceu?</h3>
                <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: 0, lineHeight: 1.55 }}>Voce aceitou um convite de encontro. Nos conte como foi!</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'incrivel', emoji: '🥰', label: 'Foi incrivel!' },
                  { id: 'estranho', emoji: '😅', label: 'Foi estranho' },
                  { id: 'bolo', emoji: '😤', label: 'Levei um bolo' },
                  { id: 'ainda_nao', emoji: '⏳', label: 'Ainda nao aconteceu' },
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => handleBolo(op.id)}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: op.id === 'bolo' ? '1px solid rgba(225,29,72,0.30)' : '1px solid var(--border)', backgroundColor: op.id === 'bolo' ? 'rgba(225,29,72,0.07)' : 'rgba(255,255,255,0.04)', color: op.id === 'bolo' ? 'var(--accent)' : 'var(--text)', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-jakarta)', transition: 'all 0.15s' }}
                  >
                    <span style={{ fontSize: 18 }}>{op.emoji}</span>
                    <span>{op.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowBoloModal(false)}
                style={{ width: '100%', marginTop: 12, padding: '10px', background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Perguntar depois
              </button>
            </div>
          </div>
        )}

        {/* ── Modal de Emergência ── */}
        {emergencyModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', padding: 20 }}
            onClick={() => setEmergencyModal(false)}
          >
            <div
              style={{ background: 'var(--bg-card)', border: '1px solid rgba(225,29,72,0.30)', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={26} color="#F43F5E" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>Voce esta em perigo?</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
                Esta acao ligara imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.70)' }}>Policia Militar (190)</strong>. Use apenas em situacoes de risco real.
              </p>
              <a
                href="tel:190"
                style={{
                  display: 'block', width: '100%', padding: '14px 0',
                  borderRadius: 12, background: '#E11D48',
                  color: '#fff', fontFamily: 'var(--font-jakarta)',
                  fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 10,
                }}
              >
                Ligar 190 agora
              </a>
              <button
                onClick={() => setEmergencyModal(false)}
                style={{ display: 'block', width: '100%', padding: '12px 0', color: 'var(--muted)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Botão de ação rápida ─────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onClick, active = false, accent = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 100,
        border: active || accent ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        background: active || accent ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
        color: active || accent ? 'var(--accent)' : 'var(--muted)',
        fontSize: 12, fontFamily: 'var(--font-jakarta)',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── Card de Convite Encontro ─────────────────────────────────────────────────

const RESPOSTAS_RAPIDAS = ['Aceito!', 'Nao posso', 'Em breve', 'Me conta mais!']

function ConviteCard({
  text, isMe, time, onReply,
}: {
  text: string
  isMe: boolean
  time: string
  onReply: (r: string) => void
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '80%',
        background: isMe ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: `1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        overflow: 'hidden',
      }}>
        {/* Header do card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px 8px',
          borderBottom: `1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'}`,
        }}>
          <CalendarPlus size={14} color="var(--accent)" strokeWidth={1.5} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Convite de Encontro</span>
        </div>

        {/* Texto da proposta */}
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.45 }}>{text}</p>
          <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{time}</span>
        </div>

        {/* Respostas rapidas — so para quem recebeu */}
        {!isMe && (
          <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {RESPOSTAS_RAPIDAS.map((r) => (
              <button
                key={r}
                onClick={() => onReply(r)}
                style={{
                  padding: '5px 12px', borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text)', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

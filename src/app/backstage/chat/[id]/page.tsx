'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Image from 'next/image'
import { ArrowLeft, Crown, Send, Loader2, Lock, Clock, Star, ThumbsUp, ThumbsDown, HeartHandshake, Trophy, Flag, X } from 'lucide-react'

// ─── Constantes ────────────────────────────────────────────────────────────────

const G         = '#F59E0B'
const G_SOFT    = 'rgba(245,158,11,0.10)'
const G_BORDER  = 'rgba(245,158,11,0.25)'
const BG        = '#08090E'
const BG_CARD   = '#0F1117'

const CATEGORIAS: Record<string, string> = {
  trisal: 'Trisal', menage: 'Menage', bdsm: 'BDSM',
  sado: 'Sadomasoquismo', sugar: 'Sugar', swing: 'Swing', poliamor: 'Poliamor',
}

const MAX_CHARS = 500

const RATING_OPTIONS = [
  { key: 'bom_papo',  label: 'Bom de papo',               icon: ThumbsUp,       color: '#2ec4a0' },
  { key: 'sairam',    label: 'Sairam para se conhecer',   icon: HeartHandshake, color: '#E11D48' },
  { key: 'objetivo',  label: 'Alcancaram o objetivo',     icon: Trophy,         color: G         },
  { key: 'bolo',      label: 'Levou bolo',                icon: ThumbsDown,     color: 'rgba(248,249,250,0.40)' },
  { key: 'denuncia',  label: 'Denunciar',                 icon: Flag,           color: '#f87171' },
]

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
}

interface RequestData {
  id: string
  requester_id: string
  rescued_by: string
  category: string
  expires_at: string
}

interface OtherProfile {
  id: string
  name: string
  photo_best: string | null
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

export default function CamaroteChatPage() {
  const params = useParams()
  const requestId = params.id as string
  const router = useRouter()

  const [userId, setUserId]       = useState<string | null>(null)
  const [request, setRequest]     = useState<RequestData | null>(null)
  const [other, setOther]         = useState<OtherProfile | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const [expired, setExpired]     = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const msgTimestamps  = useRef<number[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      // Checar se já avaliou (localStorage)
      const done = localStorage.getItem(`camarote_rating_${requestId}`)
      if (done) setRatingDone(true)
      init(user.id)
    })
    return () => { channelRef.current?.unsubscribe() }
  }, [requestId])

  async function init(uid: string) {
    setLoading(true)

    const { data: req } = await supabase
      .from('access_requests')
      .select('id, requester_id, rescued_by, category, expires_at')
      .eq('id', requestId)
      .eq('status', 'rescued')
      .single()

    if (!req) { router.push('/backstage'); return }
    if (req.requester_id !== uid && req.rescued_by !== uid) { router.push('/backstage'); return }

    if (new Date(req.expires_at) < new Date()) {
      setExpired(true)
      setRequest(req)
      setLoading(false)
      return
    }

    setRequest(req)

    const otherId = req.requester_id === uid ? req.rescued_by : req.requester_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, photo_best')
      .eq('id', otherId)
      .single()

    setOther({
      id: otherId,
      name: profile?.name ?? 'Usuario',
      photo_best: profile?.photo_best ?? null,
    })

    await loadMessages()
    await markRead(uid)

    channelRef.current = supabase
      .channel(`camarote-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'camarote_messages',
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        if (msg.sender_id !== uid) markRead(uid)
      })
      .subscribe()

    setLoading(false)
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('camarote_messages')
      .select('id, sender_id, content, created_at, read')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function markRead(uid: string) {
    await supabase
      .from('camarote_messages')
      .update({ read: true })
      .eq('request_id', requestId)
      .neq('sender_id', uid)
      .eq('read', false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !userId || !request || sending || expired) return
    if (input.length > MAX_CHARS) return

    const now = Date.now()
    msgTimestamps.current = msgTimestamps.current.filter(t => now - t < 60000)
    if (msgTimestamps.current.length >= 5) {
      setError('Aguarde um momento antes de enviar mais mensagens.')
      return
    }
    msgTimestamps.current.push(now)

    setSending(true)
    setError('')
    const text = input.trim()
    setInput('')

    const { error: sendErr } = await supabase
      .from('camarote_messages')
      .insert({ request_id: requestId, sender_id: userId, content: text })

    if (sendErr) {
      setError('Erro ao enviar. Tente novamente.')
      setInput(text)
    }
    setSending(false)
  }

  async function submitRating(ratingKey: string) {
    if (!userId || !request || ratingSubmitting) return
    setRatingSubmitting(true)

    const otherId = request.requester_id === userId ? request.rescued_by : request.requester_id

    try {
      await supabase.from('camarote_ratings').insert({
        request_id: requestId,
        rater_id:   userId,
        rated_id:   otherId,
        rating:     ratingKey,
      })
    } catch {
      // silencioso — avaliação não é bloqueante
    }

    localStorage.setItem(`camarote_rating_${requestId}`, ratingKey)
    setRatingDone(true)
    setShowRating(false)
    setRatingSubmitting(false)
  }

  function daysLeft() {
    if (!request?.expires_at) return 0
    const diff = new Date(request.expires_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const canRate = messages.length >= 5 && !ratingDone

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: G }} />
      </div>
    )
  }

  // ─── Expirado ───────────────────────────────────────────────────────────────

  if (expired) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', fontFamily: 'var(--font-jakarta)' }}>
        <Lock size={36} color={G} strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>
          Conversa encerrada
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 28px' }}>
          O periodo de 30 dias desta conversa do Camarote expirou.
        </p>

        {/* Avaliacao na tela de expirado */}
        {!ratingDone ? (
          <div style={{ width: '100%', maxWidth: 360, background: BG_CARD, borderRadius: 20, border: `1px solid ${G_BORDER}`, padding: '24px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Star size={16} color={G} strokeWidth={1.5} />
              <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, color: '#fff', fontWeight: 700 }}>
                Como foi essa conversa?
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: '0 0 16px' }}>
              Sua avaliacao e anonima e ajuda a melhorar o Camarote.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RATING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.key}
                    onClick={() => submitRating(opt.key)}
                    disabled={ratingSubmitting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'background 0.15s',
                    }}
                  >
                    <Icon size={16} color={opt.color} strokeWidth={1.5} />
                    <span style={{ fontSize: 14, color: '#fff', fontFamily: 'var(--font-jakarta)' }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { setRatingDone(true); localStorage.setItem(`camarote_rating_${requestId}`, 'skip') }}
              style={{ marginTop: 12, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}
            >
              Pular avaliacao
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={14} color={G} strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Avaliacao enviada</span>
          </div>
        )}

        <button
          onClick={() => router.push('/backstage')}
          style={{ padding: '13px 28px', borderRadius: 14, background: `linear-gradient(135deg, #c9a84c, ${G})`, color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Voltar ao Camarote
        </button>
      </div>
    )
  }

  // ─── Chat ───────────────────────────────────────────────────────────────────

  const days = daysLeft()
  const catLabel = CATEGORIAS[request?.category ?? ''] ?? request?.category ?? ''

  return (
    <div style={{ height: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta)', maxWidth: 480, margin: '0 auto', position: 'relative' }}>

      {/* Header */}
      <header style={{ flexShrink: 0, background: 'rgba(8,9,14,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push('/backstage')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>

        {/* Avatar */}
        <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${G_BORDER}`, overflow: 'hidden', flexShrink: 0, background: G_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {other?.photo_best ? (
            <Image src={other.photo_best} alt={other.name} width={38} height={38} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          ) : (
            <Crown size={16} color={G} strokeWidth={1.5} />
          )}
        </div>

        {/* Nome + categoria + expiry */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {other?.name ?? '...'}
            </span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}`, color: G, fontWeight: 700, flexShrink: 0 }}>
              {catLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Clock size={9} color={days <= 5 ? '#f87171' : 'rgba(255,255,255,0.30)'} strokeWidth={1.5} />
            <span style={{ fontSize: 11, color: days <= 5 ? '#f87171' : 'rgba(255,255,255,0.30)' }}>
              {days} dias restantes
            </span>
          </div>
        </div>

        {/* Botao avaliar ou badge Black */}
        {canRate ? (
          <button
            onClick={() => setShowRating(true)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}`, cursor: 'pointer' }}
          >
            <Star size={12} color={G} strokeWidth={1.5} />
            <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>Avaliar</span>
          </button>
        ) : (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}` }}>
            <Crown size={12} color={G} strokeWidth={1.5} />
            <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>Black</span>
          </div>
        )}
      </header>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Aviso de contexto */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: BG_CARD, padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
            Conversa exclusiva do Camarote Black
          </span>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Crown size={28} color={G_BORDER} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
              Nenhuma mensagem ainda. Diga ola!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine
                  ? 'linear-gradient(135deg, #c9a84c, #F59E0B)'
                  : BG_CARD,
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 14, color: isMine ? '#000' : '#fff', margin: '0 0 3px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {msg.content}
                </p>
                <p style={{ fontSize: 10, color: isMine ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.30)', margin: 0, textAlign: 'right' }}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Erro */}
      {error && (
        <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.10)', borderTop: '1px solid rgba(239,68,68,0.20)' }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '12px 16px 24px', borderTop: `1px solid ${G_BORDER}`, background: 'rgba(8,9,14,0.97)', backdropFilter: 'blur(12px)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Digite uma mensagem..."
          maxLength={MAX_CHARS}
          rows={1}
          style={{
            flex: 1, padding: '11px 14px', borderRadius: 20, resize: 'none', outline: 'none',
            background: BG_CARD,
            border: `1px solid ${input.length > 0 ? G_BORDER : 'rgba(255,255,255,0.07)'}`,
            color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: 14, lineHeight: 1.5,
            maxHeight: 100, overflow: 'auto',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() ? `linear-gradient(135deg, #c9a84c, ${G})` : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {sending
            ? <Loader2 size={17} className="animate-spin" style={{ color: input.trim() ? '#000' : 'rgba(255,255,255,0.30)' }} />
            : <Send size={17} color={input.trim() ? '#000' : 'rgba(255,255,255,0.30)'} strokeWidth={2} />
          }
        </button>
      </div>

      {/* Painel de avaliacao (slide up) */}
      {showRating && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowRating(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)', zIndex: 10 }}
          />
          {/* Sheet */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11,
            background: BG_CARD,
            borderTop: `1px solid ${G_BORDER}`,
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px 32px',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />

            {/* Titulo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={16} color={G} strokeWidth={1.5} />
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', fontWeight: 700 }}>
                  Como foi essa conversa?
                </span>
              </div>
              <button
                onClick={() => setShowRating(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>
              Sua avaliacao e anonima. Ajuda outros usuarios e melhora o Camarote.
            </p>

            {/* Opcoes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RATING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.key}
                    onClick={() => submitRating(opt.key)}
                    disabled={ratingSubmitting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: opt.key === 'denuncia'
                        ? '1px solid rgba(248,113,113,0.20)'
                        : '1px solid rgba(255,255,255,0.07)',
                      cursor: ratingSubmitting ? 'default' : 'pointer',
                      textAlign: 'left', width: '100%',
                      transition: 'background 0.15s',
                      opacity: ratingSubmitting ? 0.5 : 1,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={opt.color} strokeWidth={1.5} />
                    </div>
                    <span style={{ fontSize: 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontFamily: 'var(--font-jakarta)', fontWeight: 500 }}>
                      {opt.label}
                    </span>
                    {ratingSubmitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>

            {/* Pular */}
            <button
              onClick={() => {
                setShowRating(false)
                localStorage.setItem(`camarote_rating_${requestId}`, 'skip')
                setRatingDone(true)
              }}
              style={{ marginTop: 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}
            >
              Pular avaliacao
            </button>
          </div>
        </>
      )}
    </div>
  )
}

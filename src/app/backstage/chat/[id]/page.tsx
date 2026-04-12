'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Image from 'next/image'
import {
  ArrowLeft, Crown, Send, Loader2, Lock, Clock,
  Star, ThumbsUp, ThumbsDown, HeartHandshake, Trophy, Flag, X,
  MapPin, CalendarPlus, Check,
} from 'lucide-react'

// ─── Constantes ────────────────────────────────────────────────────────────────

const G        = '#F59E0B'
const G_SOFT   = 'rgba(245,158,11,0.10)'
const G_BORDER = 'rgba(245,158,11,0.25)'
const BG       = '#08090E'
const BG_CARD  = '#0F1117'

const CATEGORIAS: Record<string, string> = {
  trisal: 'Trisal', menage: 'Menage', bdsm: 'BDSM',
  sado: 'Sadomasoquismo', sugar: 'Sugar', swing: 'Swing', poliamor: 'Poliamor',
}

const MAX_CHARS = 500

const RATING_OPTIONS = [
  { key: 'bom_papo',  label: 'Bom de papo',              icon: ThumbsUp,       color: '#2ec4a0' },
  { key: 'sairam',    label: 'Sairam para se conhecer',  icon: HeartHandshake, color: '#E11D48' },
  { key: 'objetivo',  label: 'Alcancaram o objetivo',    icon: Trophy,         color: G         },
  { key: 'bolo',      label: 'Levou bolo',               icon: ThumbsDown,     color: 'rgba(248,249,250,0.40)' },
  { key: 'denuncia',  label: 'Denunciar',                icon: Flag,           color: '#f87171' },
]

const INVITE_PREFIX = '__CONVITE__:'
const INVITE_RESPONSES = ['Aceito!', 'Não posso', 'Em breve', 'Me conta mais!']

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
  rescued_at: string | null
  created_at: string
}

interface OtherProfile {
  id: string
  name: string
  photo_best: string | null
}

interface MeetingForm {
  local: string
  date: string
  time: string
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

export default function CamaroteChatPage() {
  const params    = useParams()
  const requestId = params.id as string
  const router    = useRouter()

  const [userId, setUserId]             = useState<string | null>(null)
  const [request, setRequest]           = useState<RequestData | null>(null)
  const [other, setOther]               = useState<OtherProfile | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(true)
  const [sending, setSending]           = useState(false)
  const [error, setError]               = useState('')
  const [expired, setExpired]           = useState(false)

  // Avaliacao
  const [showRating, setShowRating]           = useState(false)
  const [ratingDone, setRatingDone]           = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingBannerDismissed, setRatingBannerDismissed] = useState(false)

  // Convite
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [inviteText, setInviteText]           = useState('')

  // Registro privado
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm]           = useState<MeetingForm>({ local: '', date: '', time: '' })
  const [meetingSaved, setMeetingSaved]         = useState(false)

  const bottomRef     = useRef<HTMLDivElement>(null)
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const msgTimestamps = useRef<number[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
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
      .select('id, requester_id, rescued_by, category, expires_at, rescued_at, created_at')
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

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || !userId || !request || sending || expired) return
    if (content.length > MAX_CHARS) return

    const now = Date.now()
    msgTimestamps.current = msgTimestamps.current.filter(t => now - t < 60000)
    if (msgTimestamps.current.length >= 5) {
      setError('Aguarde um momento antes de enviar mais mensagens.')
      return
    }
    msgTimestamps.current.push(now)

    setSending(true)
    setError('')
    if (!text) setInput('')

    const { error: sendErr } = await supabase
      .from('camarote_messages')
      .insert({ request_id: requestId, sender_id: userId, content })

    if (sendErr) {
      setError('Erro ao enviar. Tente novamente.')
      if (!text) setInput(content)
    }
    setSending(false)
  }

  async function sendInvite() {
    if (!inviteText.trim()) return
    await sendMessage(`${INVITE_PREFIX}${inviteText.trim()}`)
    setInviteText('')
    setShowInvitePanel(false)
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
      // silencioso
    }

    localStorage.setItem(`camarote_rating_${requestId}`, ratingKey)
    setRatingDone(true)
    setShowRating(false)
    setRatingSubmitting(false)
  }

  function saveMeeting() {
    if (!meetingForm.local || !meetingForm.date || !meetingForm.time || !other) return
    const meetings = JSON.parse(localStorage.getItem('meandyou_meetings') || '[]')
    meetings.push({
      id: crypto.randomUUID(),
      requestId,
      with_name: other.name,
      local: meetingForm.local,
      date: meetingForm.date,
      time: meetingForm.time,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('meandyou_meetings', JSON.stringify(meetings))
    setMeetingSaved(true)
    setTimeout(() => { setMeetingSaved(false); setShowMeetingModal(false); setMeetingForm({ local: '', date: '', time: '' }) }, 1800)
  }

  function daysLeft() {
    if (!request?.expires_at) return 0
    const diff = new Date(request.expires_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Avaliacao ativa apos 3 dias desde o inicio do chat
  function daysActive(): number {
    if (!request) return 0
    const start = request.rescued_at ?? request.created_at
    return (Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  }

  const canRate  = daysActive() >= 3 && !ratingDone
  const showBanner = canRate && !ratingBannerDismissed

  // Convite nao respondido do outro lado
  function getPendingInvite(): Message | null {
    if (!userId) return null
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.sender_id !== userId && msg.content.startsWith(INVITE_PREFIX)) {
        // Tem alguma resposta minha depois?
        const hasReply = messages.slice(i + 1).some(m => m.sender_id === userId)
        return hasReply ? null : msg
      }
    }
    return null
  }

  const pendingInvite = getPendingInvite()

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

        {!ratingDone ? (
          <RatingPanel
            onSubmit={submitRating}
            onSkip={() => { localStorage.setItem(`camarote_rating_${requestId}`, 'skip'); setRatingDone(true) }}
            submitting={ratingSubmitting}
            inline
          />
        ) : (
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={14} color={G} strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Avaliacao enviada</span>
          </div>
        )}

        <button
          onClick={() => router.push('/backstage')}
          style={{ padding: '13px 28px', borderRadius: 14, background: `linear-gradient(135deg, #c9a84c, ${G})`, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Voltar ao Camarote
        </button>
      </div>
    )
  }

  // ─── Chat ───────────────────────────────────────────────────────────────────

  const days     = daysLeft()
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

        <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${G_BORDER}`, overflow: 'hidden', flexShrink: 0, background: G_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {other?.photo_best ? (
            <Image src={other.photo_best} alt={other.name} width={38} height={38} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          ) : (
            <Crown size={16} color={G} strokeWidth={1.5} />
          )}
        </div>

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

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}` }}>
          <Crown size={12} color={G} strokeWidth={1.5} />
          <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>Black</span>
        </div>
      </header>

      {/* Banner convite pendente */}
      {pendingInvite && (
        <div style={{ flexShrink: 0, padding: '10px 16px', background: 'rgba(225,29,72,0.08)', borderBottom: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarPlus size={14} color='#E11D48' strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>
            {other?.name} te convidou para um encontro
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Aceito!', 'Agora não'].map(r => (
              <button
                key={r}
                onClick={() => sendMessage(r)}
                style={{ padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: r === 'Aceito!' ? '#E11D48' : 'rgba(255,255,255,0.08)', color: r === 'Aceito!' ? '#fff' : 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-jakarta)' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Banner avaliacao (aparece apos 3 dias, fica ate avaliar) */}
      {showBanner && (
        <div style={{ flexShrink: 0, padding: '10px 16px', background: G_SOFT, borderBottom: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={14} color={G} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>
            Como está sendo essa conversa?
          </span>
          <button
            onClick={() => setShowRating(true)}
            style={{ padding: '5px 14px', borderRadius: 100, background: `linear-gradient(135deg, #c9a84c, ${G})`, color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', flexShrink: 0 }}
          >
            Avaliar
          </button>
          <button
            onClick={() => setRatingBannerDismissed(true)}
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={11} color="rgba(255,255,255,0.40)" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: BG_CARD, padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
            Conversa exclusiva do Camarote Black
          </span>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Crown size={28} color={G_BORDER} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
              Nenhuma mensagem ainda. Diga olá!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === userId
          if (msg.content.startsWith(INVITE_PREFIX)) {
            const text = msg.content.slice(INVITE_PREFIX.length)
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', borderRadius: 16, overflow: 'hidden', border: `1px solid ${isMine ? G_BORDER : 'rgba(225,29,72,0.30)'}` }}>
                  {/* Header do card convite */}
                  <div style={{ padding: '8px 14px', background: isMine ? G_SOFT : 'rgba(225,29,72,0.10)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarPlus size={13} color={isMine ? G : '#E11D48'} strokeWidth={1.5} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isMine ? G : '#E11D48' }}>
                      {isMine ? 'Você enviou um convite' : `${other?.name} te convidou`}
                    </span>
                  </div>
                  {/* Texto */}
                  <div style={{ padding: '10px 14px', background: BG_CARD }}>
                    <p style={{ fontSize: 14, color: '#fff', margin: '0 0 10px', lineHeight: 1.5 }}>{text}</p>
                    {/* Pills de resposta (so no convite recebido) */}
                    {!isMine && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {INVITE_RESPONSES.map(r => (
                          <button
                            key={r}
                            onClick={() => sendMessage(r)}
                            style={{ padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${G_BORDER}`, background: G_SOFT, color: G, fontFamily: 'var(--font-jakarta)' }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: '8px 0 0', textAlign: 'right' }}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%', padding: '10px 14px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? 'linear-gradient(135deg, #c9a84c, #F59E0B)' : BG_CARD,
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 14, color: '#fff', margin: '0 0 3px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {msg.content}
                </p>
                <p style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.30)', margin: 0, textAlign: 'right' }}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Painel de convite */}
      {showInvitePanel && (
        <div style={{ flexShrink: 0, padding: '12px 16px', background: BG_CARD, borderTop: `1px solid ${G_BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CalendarPlus size={14} color={G} strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 700, color: G, fontFamily: 'var(--font-fraunces)' }}>Convite de encontro</span>
            <button onClick={() => setShowInvitePanel(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={14} color="rgba(255,255,255,0.40)" strokeWidth={1.5} />
            </button>
          </div>
          <textarea
            value={inviteText}
            onChange={e => setInviteText(e.target.value)}
            placeholder={`Ex: Que tal nos encontrarmos sábado? Pensei em...`}
            rows={2}
            maxLength={200}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, resize: 'none', outline: 'none', background: BG, border: `1px solid ${G_BORDER}`, color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: 13, lineHeight: 1.5, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={sendInvite}
              disabled={!inviteText.trim()}
              style={{ padding: '9px 20px', borderRadius: 12, background: inviteText.trim() ? `linear-gradient(135deg, #c9a84c, ${G})` : 'rgba(255,255,255,0.06)', color: inviteText.trim() ? '#fff' : 'rgba(255,255,255,0.30)', fontWeight: 700, fontSize: 13, border: 'none', cursor: inviteText.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-jakarta)' }}
            >
              Enviar convite
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{ flexShrink: 0, padding: '8px 16px', background: 'rgba(239,68,68,0.10)', borderTop: '1px solid rgba(239,68,68,0.20)' }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '10px 16px 24px', borderTop: `1px solid ${G_BORDER}`, background: 'rgba(8,9,14,0.97)', backdropFilter: 'blur(12px)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>

        {/* Botoes de acao extras */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingBottom: 2 }}>
          <button
            onClick={() => { setShowMeetingModal(true); setShowInvitePanel(false) }}
            title="Registrar encontro"
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${G_BORDER}`, background: G_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MapPin size={15} color={G} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => { setShowInvitePanel(v => !v) }}
            title="Enviar convite de encontro"
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${showInvitePanel ? G_BORDER : 'rgba(255,255,255,0.08)'}`, background: showInvitePanel ? G_SOFT : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <CalendarPlus size={15} color={showInvitePanel ? G : 'rgba(255,255,255,0.40)'} strokeWidth={1.5} />
          </button>
        </div>

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
            maxHeight: 100, overflow: 'auto', transition: 'border-color 0.15s',
          }}
        />
        <button
          onClick={() => sendMessage()}
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
            ? <Loader2 size={17} className="animate-spin" style={{ color: input.trim() ? '#fff' : 'rgba(255,255,255,0.30)' }} />
            : <Send size={17} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.30)'} strokeWidth={2} />
          }
        </button>
      </div>

      {/* Modal registro privado */}
      {showMeetingModal && (
        <>
          <div onClick={() => setShowMeetingModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11, background: BG_CARD, borderTop: `1px solid ${G_BORDER}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 32px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MapPin size={15} color={G} strokeWidth={1.5} />
              <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, color: '#fff', fontWeight: 700 }}>Registrar encontro</span>
              <button onClick={() => setShowMeetingModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <X size={14} color="rgba(255,255,255,0.40)" strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
              Registro privado, salvo so no seu dispositivo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 5 }}>Com quem</label>
                <input
                  value={other?.name ?? ''}
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)', fontSize: 13, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 5 }}>Local</label>
                <input
                  value={meetingForm.local}
                  onChange={e => setMeetingForm(f => ({ ...f, local: e.target.value }))}
                  placeholder="Ex: Café do Centro"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: BG, border: `1px solid ${meetingForm.local ? G_BORDER : 'rgba(255,255,255,0.07)'}`, color: '#fff', fontSize: 13, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 5 }}>Data</label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: BG, border: `1px solid ${meetingForm.date ? G_BORDER : 'rgba(255,255,255,0.07)'}`, color: '#fff', fontSize: 13, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 5 }}>Hora</label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={e => setMeetingForm(f => ({ ...f, time: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: BG, border: `1px solid ${meetingForm.time ? G_BORDER : 'rgba(255,255,255,0.07)'}`, color: '#fff', fontSize: 13, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            {meetingSaved ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, background: 'rgba(46,196,160,0.12)', border: '1px solid rgba(46,196,160,0.30)' }}>
                <Check size={16} color="#2ec4a0" strokeWidth={2} />
                <span style={{ fontSize: 14, color: '#2ec4a0', fontWeight: 700 }}>Encontro registrado!</span>
              </div>
            ) : (
              <button
                onClick={saveMeeting}
                disabled={!meetingForm.local || !meetingForm.date || !meetingForm.time}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: meetingForm.local && meetingForm.date && meetingForm.time ? `linear-gradient(135deg, #c9a84c, ${G})` : 'rgba(255,255,255,0.06)', color: meetingForm.local && meetingForm.date && meetingForm.time ? '#fff' : 'rgba(255,255,255,0.30)', fontWeight: 700, fontSize: 14, border: 'none', cursor: meetingForm.local && meetingForm.date && meetingForm.time ? 'pointer' : 'default', fontFamily: 'var(--font-jakarta)' }}
              >
                Salvar registro
              </button>
            )}
          </div>
        </>
      )}

      {/* Painel de avaliacao (slide up) */}
      {showRating && (
        <>
          <div onClick={() => setShowRating(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11, background: BG_CARD, borderTop: `1px solid ${G_BORDER}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 32px' }}>
            <RatingPanel
              onSubmit={async (key) => { await submitRating(key) }}
              onSkip={() => setShowRating(false)}
              submitting={ratingSubmitting}
              withHeader
              onClose={() => setShowRating(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Componente RatingPanel (reutilizado no expirado e no overlay) ─────────────

function RatingPanel({
  onSubmit,
  onSkip,
  submitting,
  inline,
  withHeader,
  onClose,
}: {
  onSubmit: (key: string) => void
  onSkip: () => void
  submitting: boolean
  inline?: boolean
  withHeader?: boolean
  onClose?: () => void
}) {
  const G        = '#F59E0B'
  const G_SOFT   = 'rgba(245,158,11,0.10)'
  const G_BORDER = 'rgba(245,158,11,0.25)'
  const BG_CARD  = '#0F1117'

  return (
    <div style={inline ? { width: '100%', maxWidth: 360, background: BG_CARD, borderRadius: 20, border: `1px solid ${G_BORDER}`, padding: '24px 20px', marginBottom: 24 } : {}}>
      {withHeader && (
        <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} color={G} strokeWidth={1.5} />
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: inline ? 16 : 18, color: '#fff', fontWeight: 700 }}>
            Como foi essa conversa?
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
        Sua avaliacao e anonima. Ajuda outros usuarios e melhora o Camarote.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RATING_OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.key}
              onClick={() => onSubmit(opt.key)}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: inline ? 12 : 14,
                padding: inline ? '12px 16px' : '14px 16px', borderRadius: inline ? 12 : 14,
                background: 'rgba(255,255,255,0.03)',
                border: opt.key === 'denuncia' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.07)',
                cursor: submitting ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {!inline && (
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={opt.color} strokeWidth={1.5} />
                </div>
              )}
              {inline && <Icon size={16} color={opt.color} strokeWidth={1.5} />}
              <span style={{ fontSize: inline ? 14 : 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontFamily: 'var(--font-jakarta)', fontWeight: 500 }}>
                {opt.label}
              </span>
              {submitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </div>

      <button
        onClick={onSkip}
        style={{ marginTop: inline ? 12 : 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: inline ? 12 : 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}
      >
        Agora não
      </button>
    </div>
  )
}

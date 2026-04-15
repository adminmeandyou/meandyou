'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Send, Video, ShieldAlert,
  Loader2, AlertCircle, Lock, Menu,
  Sparkles, CalendarPlus, Zap, X, CalendarCheck, Star, Coffee,
  MapPin, Shield, HeartCrack, Ghost, Phone, CheckCircle2, UserPlus, Check, Smile
} from 'lucide-react'
import { ChatBubble } from '@/components/ui/ChatBubble'
import { ReportModal } from '@/components/ReportModal'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

interface OtherUser {
  id: string
  name: string
  photo_best: string | null
  verified: boolean
  last_seen: string | null
  show_last_active: boolean
}

const MAX_CHARS = 500
const CONVITE_PREFIX = '__CONVITE__:'
const NUDGE_TOKEN = '__NUDGE__'

const ICEBREAKERS = [
  'Qual o melhor lugar que você já visitou?',
  'Se pudesse viajar agora, para onde iria?',
  'O que você faria num sábado perfeito?',
  'Séries ou filmes? Qual recomenda?',
  'Qual superpoder você escolheria?',
  'Café da manhã ou jantar romântico?',
]

export default function ChatPage() {
  const params = useParams()
  const matchId = params.id as string
  const router = useRouter()
  const toast = useToast()

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
  const [showMenu, setShowMenu] = useState(false)
  const [showIcebreakers, setShowIcebreakers] = useState(false)
  const [showConvite, setShowConvite] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [conviteText, setConviteText] = useState('')
  const [conviteLocal, setConviteLocal] = useState('')
  const [conviteDate, setConviteDate] = useState('')
  const [conviteTime, setConviteTime] = useState('')
  const [shake, setShake] = useState(false)
  const [pendingConvite, setPendingConvite] = useState<string | null>(null)

  // ── Fase 8: Segurança Encontros ──────────────────────────────────────────────
  // Registro privado
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingLocal, setMeetingLocal]         = useState('')
  const [meetingDateVal, setMeetingDateVal]     = useState('')
  const [meetingTimeVal, setMeetingTimeVal]     = useState('')
  const [meetingSaved, setMeetingSaved]         = useState(false)
  // Check-in pós-encontro (bloqueante)
  const [checkinMeeting, setCheckinMeeting] = useState<{ id: string; local: string; date: string } | null>(null)
  const [checkinRecordId, setCheckinRecordId] = useState<string | null>(null)
  // Central de segurança
  const [showSecuritySheet, setShowSecuritySheet] = useState(false)
  const [unmatchConfirm, setUnmatchConfirm]       = useState(false)
  const [unmatchDone, setUnmatchDone]             = useState(false)
  const [ghostModeUntil, setGhostModeUntil]       = useState<string | null>(null)
  const [showReport, setShowReport]               = useState(false)
  // ─────────────────────────────────────────────────────────────────────────────

  // Gamificacao Fase 7
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [showBoloModal, setShowBoloModal] = useState(false)
  const [boloDone, setBoloDone] = useState(false)
  const [boloOportunidade, setBoloOportunidade] = useState(false)

  // Adicionar como amigo (M4)
  const [friendSent, setFriendSent] = useState(false)

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
      .select('id, name, photo_best, verified, last_seen, show_last_active')
      .eq('id', otherId)
      .single()

    setOtherUser({
      id: otherId,
      name: profile?.name ?? 'Usuário',
      photo_best: profile?.photo_best ?? null,
      verified: profile?.verified ?? false,
      last_seen: profile?.last_seen ?? null,
      show_last_active: profile?.show_last_active ?? true,
    })

    // Carrega mensagens
    await loadMessages(uid)

    // Marca mensagens recebidas como lidas
    await marcarComoLidas(uid)

    // Detecta convite pendente não respondido
    detectPendingConvite(uid)

    // Realtime: Broadcast (gratuito no plano free — não usa postgres_changes com filtro)
    channelRef.current = supabase
      .channel(`chat-${matchId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const newMsg = payload as Message

        // Adiciona mensagem com dedup (evita duplicatas do optimistic update)
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        // Side effects fora do state updater (React exige updaters puros)
        if (newMsg.sender_id !== uid) {
          // Convite recebido
          if (newMsg.content.startsWith(CONVITE_PREFIX)) {
            setPendingConvite(newMsg.content.slice(CONVITE_PREFIX.length))
          }
          // Nudge recebido: haptics + shake
          if (newMsg.content === NUDGE_TOKEN) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            setShake(true)
            setTimeout(() => setShake(false), 700)
          }
          // Marca como lida automaticamente
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id)
            .then(() => {})
        }
        scrollToBottom()
      })
      .subscribe()

    // Fase 8: busca ghost mode para exibir na Central de Segurança
    const { data: ghostData } = await supabase
      .from('profiles')
      .select('ghost_mode_until')
      .eq('id', uid)
      .single()
    setGhostModeUntil(ghostData?.ghost_mode_until ?? null)

    // Fase 8: check-in pós-encontro — verifica localStorage
    try {
      const records: any[] = JSON.parse(localStorage.getItem('meandyou_meetings') ?? '[]')
      const pending = records.find(
        (r) => r.matchId === matchId && !r.checkedIn &&
               new Date(r.date).getTime() + 2 * 60 * 60 * 1000 < Date.now()
      )
      if (pending) setCheckinMeeting({ id: pending.id, local: pending.local, date: pending.date })
    } catch { /* localStorage indisponível */ }

    setLoading(false)
    scrollToBottom()
  }

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data || [])
  }

  async function marcarComoLidas(uid: string) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', uid)
      .is('read_at', null)
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

    // Optimistic update: mostra a mensagem imediatamente
    const tempId = crypto.randomUUID()
    const tempMsg: Message = {
      id: tempId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    try {
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
        // Remove a mensagem otimista em caso de erro
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setError(json.error ?? 'Erro ao enviar mensagem. Tente novamente.')
      } else {
        const json = await res.json()
        // Substitui a mensagem otimista pela real (com id do banco)
        if (json.message) {
          setMessages(prev => prev.map(m => m.id === tempId ? json.message : m))
          // Broadcast para o outro usuário (gratuito no plano free)
          channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: json.message,
          })
        }
      }
    } catch {
      // Rede falhou — remove a mensagem otimista
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSending(false)
      scrollToBottom()
    }
  }

  async function handleSend() {
    const texto = input.trim()
    if (!texto || !userId || sending) return
    if (texto.length > MAX_CHARS) { setError(`Máximo ${MAX_CHARS} caracteres.`); return }

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
    const nudgeKey = `nudge_last_${matchId}`
    const last = localStorage.getItem(nudgeKey)
    if (last) {
      const diff = Date.now() - parseInt(last)
      if (diff < 60 * 60 * 1000) {
        const mins = Math.ceil((60 * 60 * 1000 - diff) / 60000)
        toast.info(`Aguarde ${mins} min para dar outro nudge.`)
        return
      }
    }
    localStorage.setItem(nudgeKey, Date.now().toString())
    if (navigator.vibrate) navigator.vibrate([100, 50, 150])
    await sendMessage(NUDGE_TOKEN)
  }

  async function handleSendConvite() {
    const texto = conviteText.trim()
    if (!texto && !conviteLocal.trim()) return

    // Se tem local/data/hora, envia formato estruturado __MEETING__
    if (conviteLocal.trim()) {
      const payload = JSON.stringify({
        texto: texto || null,
        local: conviteLocal.trim(),
        date: conviteDate || null,
        time: conviteTime || null,
      })
      await sendMessage(`__MEETING__:${payload}`)
      // Cria registro na tabela meeting_invites via API
      if (otherUser && conviteDate && conviteTime) {
        const { data: { session } } = await supabase.auth.getSession()
        const meetingDate = new Date(`${conviteDate}T${conviteTime}`).toISOString()
        fetch('/api/meeting/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ matchId, receiverId: otherUser.id, local: conviteLocal.trim(), meetingDate }),
        }).catch(() => {})
      }
    } else {
      await sendMessage(`${CONVITE_PREFIX}${texto}`)
    }

    setShowConvite(false)
    setConviteText('')
    setConviteLocal('')
    setConviteDate('')
    setConviteTime('')
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
        // Verifica emblema Relato Corajoso
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token && userId) {
          fetch('/api/badges/trigger', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId, trigger: 'took_bolo' }),
          }).catch(() => {})
        }
      } catch { /* silencioso */ }
    }
  }

  // ── Fase 8: handlers ─────────────────────────────────────────────────────────

  async function handleSaveMeeting() {
    if (!meetingLocal.trim() || !meetingDateVal || !meetingTimeVal) return
    const meetingDate = `${meetingDateVal}T${meetingTimeVal}`

    // Salva no banco (privado — o match não vê)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/safety/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ matchId, matchName: otherUser?.name ?? 'Match', local: meetingLocal.trim(), meetingDate }),
      })
      const json = await res.json()
      if (json.id) setCheckinRecordId(json.id)
    } catch { /* silencioso */ }

    // Mantém também localStorage como fallback
    try {
      const record = { id: String(Date.now()), matchId, matchName: otherUser?.name ?? 'Match', local: meetingLocal.trim(), date: meetingDate, checkedIn: false }
      const existing: any[] = JSON.parse(localStorage.getItem('meandyou_meetings') ?? '[]')
      localStorage.setItem('meandyou_meetings', JSON.stringify([...existing, record]))
    } catch { /* ignore */ }

    // XP: encontro registrado (fire-and-forget)
    try {
      const { data: { session: xpSession } } = await supabase.auth.getSession()
      if (xpSession?.access_token) {
        fetch('/api/xp/award', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${xpSession.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'meeting_registered' }),
        }).catch(() => {})
      }
    } catch { /* silencioso */ }

    setMeetingSaved(true)
    setTimeout(() => {
      setShowMeetingModal(false)
      setMeetingSaved(false)
      setMeetingLocal('')
      setMeetingDateVal('')
      setMeetingTimeVal('')
    }, 1500)
  }

  async function handleCheckinBem() {
    if (!checkinMeeting) return

    // Check-in no banco
    if (checkinRecordId) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        fetch('/api/safety/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ recordId: checkinRecordId }),
        }).catch(() => {})
      } catch { /* silencioso */ }
    }

    // Atualiza localStorage
    try {
      const records: any[] = JSON.parse(localStorage.getItem('meandyou_meetings') ?? '[]')
      localStorage.setItem('meandyou_meetings', JSON.stringify(
        records.map((r) => r.id === checkinMeeting.id ? { ...r, checkedIn: true } : r)
      ))
    } catch { /* ignore */ }
    setCheckinMeeting(null)
  }

  async function handleUnmatch() {
    try {
      await supabase
        .from('matches')
        .update({ status: 'blocked' })
        .eq('id', matchId)
    } catch { /* ignore */ }
    router.push('/conversas')
  }

  async function handleAddFriend() {
    if (friendSent || !otherUser) return
    setFriendSent(true)
    try {
      const res = await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUser.id }),
      })
      if (!res.ok) setFriendSent(false)
    } catch {
      setFriendSent(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

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
            {isMe ? 'Você deu um nudge!' : `${otherUser?.name} deu um nudge!`}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )
    }

    // Convite estruturado (com local/data/hora)
    if (msg.content.startsWith('__MEETING__:')) {
      try {
        const data = JSON.parse(msg.content.slice('__MEETING__:'.length))
        const linhas = [
          data.local && data.local,
          (data.date && data.time) && `🗓 ${new Date(`${data.date}T${data.time}`).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
          data.texto,
        ].filter(Boolean).join('\n')
        return (
          <ConviteCard key={msg.id} text={linhas} isMe={isMe} time={formatMsgTime(msg.created_at)} onReply={(r) => sendMessage(r)} />
        )
      } catch { /* fallback abaixo */ }
    }

    // Convite encontro (texto livre — legado)
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

    // Mensagem normal — estilo editorial
    return (
      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
        <div style={{
          maxWidth: '78%',
          background: isMe
            ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)'
            : '#1e1f25',
          color: '#fff',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          boxShadow: isMe ? '0 2px 12px rgba(225,29,72,0.22)' : 'none',
        }}>
          <p style={{ fontSize: 14, margin: '0 0 4px', lineHeight: 1.5, fontFamily: 'var(--font-jakarta)', wordBreak: 'break-word' }}>{msg.content}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.55)' : 'rgba(248,249,250,0.35)' }}>{formatMsgTime(msg.created_at)}</span>
            {isMe && msg.read_at && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>✓✓</span>
            )}
          </div>
        </div>
      </div>
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
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
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

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', overscrollBehavior: 'none', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta)', zIndex: 50 }}>

        {/* ── Header glass ── */}
        <header style={{
          flexShrink: 0,
          background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(20px) saturate(1.3)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 'max(10px, env(safe-area-inset-top, 0px))',
          paddingBottom: '10px',
          paddingLeft: '12px',
          paddingRight: '12px',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 10,
        }}>
          <button
            onClick={() => router.push('/conversas')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} color="rgba(248,249,250,0.75)" strokeWidth={1.5} />
          </button>

          {/* Avatar + nome clicavel */}
          <Link href={`/perfil/${otherUser?.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textDecoration: 'none' }}>
            {(() => {
              const otherMsgs = messages.filter(m => m.sender_id !== userId).length
              const blurPx = otherMsgs >= 20 ? 0 : otherMsgs >= 10 ? 2 : otherMsgs >= 5 ? 5 : 10
              const revealLabel = blurPx > 0 ? `${Math.max(0, (blurPx === 10 ? 5 : blurPx === 5 ? 10 : 20) - otherMsgs)} msgs` : null

              /* Detecta online (< 5min) */
              const isOnlineNow = otherUser?.last_seen && (Date.now() - new Date(otherUser.last_seen).getTime()) < 5 * 60 * 1000

              return (
                <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }} title={revealLabel ? `Foto revela em ${revealLabel}` : undefined}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--bg-card2)',
                    border: '2px solid rgba(255,255,255,0.07)',
                    filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
                    transition: 'filter 0.4s',
                  }}>
                    {otherUser?.photo_best ? (
                      <Image src={otherUser.photo_best} alt={otherUser.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 16 }}>{otherUser?.name[0]}</span>
                      </div>
                    )}
                  </div>
                  {/* Bolinha verde online */}
                  {isOnlineNow && !revealLabel && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid #08090E' }} />
                  )}
                  {revealLabel && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,14,0.45)' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{revealLabel}</span>
                    </div>
                  )}
                </div>
              )
            })()}
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-fraunces)', letterSpacing: '-0.01em',
              }}>
                {otherUser?.name}
                {otherUser?.verified && (
                  <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-jakarta)', fontWeight: 700 }}>✓</span>
                )}
              </p>
              {/* "Ativo agora" em vermelho ou status normal */}
              {(() => {
                const isOnline = otherUser?.last_seen && (Date.now() - new Date(otherUser.last_seen).getTime()) < 5 * 60 * 1000
                if (isOnline) {
                  return <p style={{ fontSize: 10, color: 'var(--accent)', margin: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ativo agora</p>
                }
                return (
                  <OnlineIndicator
                    lastActiveAt={otherUser?.last_seen}
                    showLastActive={otherUser?.show_last_active}
                    mode="text"
                    size={7}
                  />
                )
              })()}
            </div>
          </Link>

          {/* Ícone de vídeo */}
          <button
            onClick={() => router.push(`/videochamada/${matchId}`)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Videochamada"
          >
            <Video size={18} color="rgba(248,249,250,0.4)" strokeWidth={1.5} />
          </button>

          {/* Ícone info / Central de Segurança */}
          <button
            onClick={() => setShowSecuritySheet(true)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Segurança"
          >
            <Shield size={18} color="rgba(248,249,250,0.25)" strokeWidth={1.5} />
          </button>

          {/* Hamburguer — abre menu de ações */}
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showMenu ? 'rgba(225,29,72,0.12)' : 'transparent',
              color: showMenu ? 'var(--accent)' : 'rgba(248,249,250,0.40)',
              transition: 'all 0.2s',
            }}
            title="Ações"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </header>

        {/* ── Menu de ações (dropdown abaixo do header) ── */}
        {showMenu && (
          <div style={{
            position: 'absolute', top: 60, right: 12, zIndex: 40,
            width: 260,
            background: 'rgba(15,17,23,0.98)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'ui-slide-up 0.18s ease',
          }}>
            {[
              { icon: <Sparkles size={16} strokeWidth={1.5} />, label: 'Quebra-gelo', sub: 'Sugestões para começar', onClick: () => { setShowMenu(false); setShowConvite(false); setShowIcebreakers(v => !v) }, active: showIcebreakers },
              { icon: <CalendarPlus size={16} strokeWidth={1.5} />, label: 'Chamar para Encontro', sub: 'Proponha um encontro', onClick: () => { setShowMenu(false); setShowIcebreakers(false); setShowConvite(v => !v) }, active: showConvite },
              { icon: <MapPin size={16} strokeWidth={1.5} />, label: 'Registrar Encontro', sub: 'Salvar local e horário', onClick: () => { setShowMenu(false); setShowMeetingModal(true) } },
              { icon: <Zap size={16} strokeWidth={1.5} />, label: 'Nudge', sub: 'Chame a atenção da pessoa', onClick: () => { setShowMenu(false); handleNudge() } },
              { icon: friendSent ? <Check size={16} strokeWidth={1.5} /> : <UserPlus size={16} strokeWidth={1.5} />, label: friendSent ? 'Amigo adicionado' : 'Adicionar como amigo', sub: friendSent ? 'Solicitação enviada' : 'Conectem-se fora do app', onClick: () => { setShowMenu(false); handleAddFriend() }, success: friendSent },
              ...(messages.length >= 5 && !ratingDone ? [{ icon: <Star size={16} strokeWidth={1.5} />, label: 'Avaliar conversa', sub: 'Avaliação anônima', onClick: () => { setShowMenu(false); setShowRatingModal(true) } }] : []),
              ...(boloOportunidade && !boloDone ? [{ icon: <Coffee size={16} strokeWidth={1.5} />, label: 'O encontro aconteceu?', sub: 'Conte como foi', onClick: () => { setShowMenu(false); setShowBoloModal(true) } }] : []),
            ].map((item, i, arr) => (
              <button key={i} onClick={item.onClick} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: item.active ? 'rgba(225,29,72,0.08)' : (item as {success?: boolean}).success ? 'rgba(16,185,129,0.08)' : 'transparent',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.active ? 'rgba(225,29,72,0.15)' : (item as {success?: boolean}).success ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                  color: item.active ? 'var(--accent)' : (item as {success?: boolean}).success ? '#10b981' : 'rgba(248,249,250,0.60)',
                }}>
                  {item.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: item.active ? 'var(--accent)' : (item as {success?: boolean}).success ? '#10b981' : 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--font-jakarta)' }}>{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}


        {/* ── Banner convite pendente ── */}
        {pendingConvite && (
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: 'rgba(225,29,72,0.08)',
            borderBottom: '1px solid rgba(225,29,72,0.15)',
          }}>
            <CalendarCheck size={14} color="var(--accent)" strokeWidth={1.5} />
            <p style={{ flex: 1, fontSize: 13, color: 'var(--accent)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }}>
              {pendingConvite}
            </p>
            <button
              onClick={() => sendMessage('Aceito!')}
              style={{ padding: '4px 14px', borderRadius: 100, background: 'var(--accent)', border: 'none', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              Aceito!
            </button>
            <button onClick={() => setPendingConvite(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} color="var(--muted)" />
            </button>
          </div>
        )}

        {/* ── Aviso de privacidade ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '5px 0',
          color: 'rgba(248,249,250,0.18)', fontSize: 10,
        }}>
          <Lock size={8} strokeWidth={1.5} />
          Conversa privada
        </div>

        {/* ── Mensagens ── */}
        <div
          className={shake ? 'chat-shake' : ''}
          style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 14px 8px' }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--muted-2)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', position: 'relative', border: '2px solid rgba(255,255,255,0.06)' }}>
                {otherUser?.photo_best && (
                  <Image src={otherUser.photo_best} alt="" fill className="object-cover" sizes="72px" />
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>
                  Vocês fizeram um match!
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: 0 }}>Seja o(a) primeiro(a) a dizer ola.</p>
              </div>
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

        {/* ── Painel Quebra-gelo (editorial) ── */}
        {showIcebreakers && (
          <div style={{
            flexShrink: 0, margin: '0 14px 8px',
            background: 'rgba(15,17,23,0.96)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16, padding: '14px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Puxando assunto</span>
              <button onClick={() => setShowIcebreakers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} color="var(--muted)" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ICEBREAKERS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); setShowIcebreakers(false); inputRef.current?.focus() }}
                  style={{
                    padding: '9px 12px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(248,249,250,0.65)', fontSize: 13,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-fraunces)', fontStyle: 'italic',
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
            {/* Local (obrigatório para convite estruturado) */}
            <input
              type="text"
              value={conviteLocal}
              onChange={e => setConviteLocal(e.target.value)}
              placeholder="Local (ex: Café do Centro, Praia do Gonzaga)"
              maxLength={100}
              autoFocus
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-jakarta)', marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="date"
                value={conviteDate}
                onChange={e => setConviteDate(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 13, color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
                  colorScheme: 'dark',
                }}
              />
              <input
                type="time"
                value={conviteTime}
                onChange={e => setConviteTime(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 13, color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <input
              type="text"
              value={conviteText}
              onChange={e => setConviteText(e.target.value)}
              placeholder="Mensagem opcional..."
              maxLength={200}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-jakarta)', marginBottom: 10,
              }}
            />
            <button
              onClick={handleSendConvite}
              disabled={(!conviteLocal.trim() && !conviteText.trim()) || sending}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12,
                background: (conviteLocal.trim() || conviteText.trim()) ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: (conviteLocal.trim() || conviteText.trim()) ? 'pointer' : 'default',
                color: (conviteLocal.trim() || conviteText.trim()) ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--font-jakarta)', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CalendarPlus size={14} />
              Enviar convite
            </button>
          </div>
        )}

        {/* ── Barra de entrada glass ── */}
        <div style={{
          flexShrink: 0,
          background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(20px) saturate(1.3)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: '10px',
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
        }}>
          {/* Emoji picker */}
          {showEmojis && (
            <div style={{ marginBottom: 8, padding: '10px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['😊','😂','🥰','😍','🔥','💕','❤️','✨','😘','🥺','😭','💀','😅','🤣','😉','😏','🤍','💯','🙏','👀','🫶','😈','💋','🥹','😇','🤗','😌','🫠','💫','🎉'].map(e => (
                <button key={e} onClick={() => { setInput(v => v + e); setShowEmojis(false) }}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '2px 4px', borderRadius: 6 }}
                >{e}</button>
              ))}
            </div>
          )}

          {/* Input + send */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setShowEmojis(v => !v)}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: showEmojis ? 'rgba(225,29,72,0.10)' : 'transparent', color: showEmojis ? 'var(--accent)' : 'rgba(248,249,250,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Smile size={17} strokeWidth={1.5} />
            </button>
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
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 0,
                  padding: '10px 0',
                  fontSize: 15, color: 'var(--text)',
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
                <span style={{ position: 'absolute', bottom: 6, right: 0, fontSize: 10, color: input.length >= MAX_CHARS ? '#F43F5E' : 'var(--muted-2)' }}>
                  {input.length}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || input.length > MAX_CHARS}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: input.trim() ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s',
                boxShadow: input.trim() ? '0 4px 16px rgba(225,29,72,0.30)' : 'none',
              }}
            >
              {sending
                ? <Loader2 size={17} color="#fff" className="animate-spin" />
                : <Send size={17} color={input.trim() ? '#fff' : 'rgba(248,249,250,0.25)'} strokeWidth={1.5} />
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
              <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 20px' }}>Avaliação anônima: {otherUser?.name} não saberá quem avaliou.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'incrivel', label: 'Pessoa incrível!', color: '#10b981' },
                  { id: 'agradavel', label: 'Conversa agradável', color: '#60a5fa' },
                  { id: 'nao_interessei', label: 'Não me interessei', color: 'rgba(248,249,250,0.45)' },
                  { id: 'ignorado', label: 'Fui ignorado(a)', color: '#F43F5E' },
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => handleRating(op.id)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: 15, fontWeight: 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                  >
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
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>O encontro aconteceu?</h3>
                <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: 0, lineHeight: 1.55 }}>Você aceitou um convite de encontro. Nos conte como foi!</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'incrivel', label: 'Foi incrível!' },
                  { id: 'estranho', label: 'Foi estranho' },
                  { id: 'bolo', label: 'Levei um bolo' },
                  { id: 'ainda_nao', label: 'Ainda não aconteceu' },
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => handleBolo(op.id)}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: op.id === 'bolo' ? '1px solid rgba(225,29,72,0.30)' : '1px solid var(--border)', backgroundColor: op.id === 'bolo' ? 'rgba(225,29,72,0.07)' : 'rgba(255,255,255,0.04)', color: op.id === 'bolo' ? 'var(--accent)' : 'var(--text)', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                  >
                    {op.label}
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

        {/* ── Modal Registro Privado ── */}
        {showMeetingModal && (
          <div style={{ position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.80)',backdropFilter:'blur(8px)' }} onClick={() => setShowMeetingModal(false)}>
            <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'24px 24px 0 0',padding:'24px 20px 40px',width:'100%',maxWidth:480 }} onClick={e => e.stopPropagation()}>
              <div style={{ width:40,height:4,borderRadius:4,background:'rgba(255,255,255,0.15)',margin:'0 auto 20px' }} />
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <MapPin size={16} color="var(--accent)" strokeWidth={1.5} />
                  <span style={{ fontFamily:'var(--font-fraunces)',fontSize:18,color:'var(--text)' }}>Registrar encontro</span>
                </div>
                <button onClick={() => setShowMeetingModal(false)} style={{ background:'none',border:'none',cursor:'pointer',padding:4 }}><X size={16} color="var(--muted)" /></button>
              </div>
              {meetingSaved ? (
                <div style={{ textAlign:'center',padding:'20px 0' }}>
                  <CheckCircle2 size={40} color="#10b981" style={{ margin:'0 auto 12px' }} />
                  <p style={{ color:'var(--text)',fontSize:14,fontWeight:600 }}>Encontro registrado!</p>
                  <p style={{ color:'var(--muted-2)',fontSize:12,marginTop:4 }}>Faremos um check-in com você depois.</p>
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  <div>
                    <label style={{ fontSize:12,color:'var(--muted-2)',display:'block',marginBottom:6 }}>Com quem</label>
                    <input value={otherUser?.name ?? ''} readOnly style={{ width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:12,padding:'11px 14px',fontSize:14,color:'var(--muted)',fontFamily:'var(--font-jakarta)',boxSizing:'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize:12,color:'var(--muted-2)',display:'block',marginBottom:6 }}>Local *</label>
                    <input value={meetingLocal} onChange={e => setMeetingLocal(e.target.value)} placeholder="Ex: Café Central, Shopping Norte..." autoFocus style={{ width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:12,padding:'11px 14px',fontSize:14,color:'var(--text)',fontFamily:'var(--font-jakarta)',boxSizing:'border-box' as const,outline:'none' }} />
                  </div>
                  <div style={{ display:'flex',gap:10 }}>
                    <div style={{ flex:1 }}>
                      <label style={{ fontSize:12,color:'var(--muted-2)',display:'block',marginBottom:6 }}>Data *</label>
                      <input type="date" value={meetingDateVal} onChange={e => setMeetingDateVal(e.target.value)} style={{ width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:12,padding:'11px 14px',fontSize:14,color:'var(--text)',fontFamily:'var(--font-jakarta)',boxSizing:'border-box' as const,outline:'none',colorScheme:'dark' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={{ fontSize:12,color:'var(--muted-2)',display:'block',marginBottom:6 }}>Hora *</label>
                      <input type="time" value={meetingTimeVal} onChange={e => setMeetingTimeVal(e.target.value)} style={{ width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:12,padding:'11px 14px',fontSize:14,color:'var(--text)',fontFamily:'var(--font-jakarta)',boxSizing:'border-box' as const,outline:'none',colorScheme:'dark' }} />
                    </div>
                  </div>
                  <p style={{ fontSize:11,color:'var(--muted-2)',lineHeight:1.5,margin:0 }}>Este registro fica somente no seu dispositivo. Faremos um check-in 2h após o horário marcado.</p>
                  <button onClick={handleSaveMeeting} disabled={!meetingLocal.trim()||!meetingDateVal||!meetingTimeVal} style={{ width:'100%',padding:'13px 0',borderRadius:12,background:meetingLocal.trim()&&meetingDateVal&&meetingTimeVal?'var(--accent)':'rgba(255,255,255,0.08)',border:'none',color:meetingLocal.trim()&&meetingDateVal&&meetingTimeVal?'#fff':'var(--muted)',fontFamily:'var(--font-jakarta)',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                    <MapPin size={14} />
                    Salvar registro
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Modal Check-in Pós-Encontro (BLOQUEANTE) ── */}
        {checkinMeeting && (
          <div style={{ position:'fixed',inset:0,zIndex:70,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.90)',backdropFilter:'blur(12px)',padding:20 }}>
            <div style={{ background:'var(--bg-card)',border:'1px solid rgba(225,29,72,0.30)',borderRadius:24,padding:'32px 24px',maxWidth:340,width:'100%',textAlign:'center' }}>
              <div style={{ fontSize:48,marginBottom:16 }}>🔔</div>
              <h3 style={{ fontFamily:'var(--font-fraunces)',fontSize:22,color:'var(--text)',margin:'0 0 8px' }}>Check-in de seguranca</h3>
              <p style={{ fontSize:13,color:'var(--muted)',margin:'0 0 6px',lineHeight:1.55 }}>Você tinha um encontro com <strong style={{ color:'rgba(248,249,250,0.75)' }}>{otherUser?.name}</strong></p>
              <p style={{ fontSize:12,color:'var(--muted-2)',margin:'0 0 28px' }}>{checkinMeeting.local} · {new Date(checkinMeeting.date).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
              <p style={{ fontSize:14,color:'var(--text)',fontWeight:600,margin:'0 0 20px' }}>Como você está?</p>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <button onClick={handleCheckinBem} style={{ width:'100%',padding:'15px 0',borderRadius:14,background:'#10b981',border:'none',color:'#fff',fontFamily:'var(--font-jakarta)',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                  <CheckCircle2 size={18} />
                  Estou bem
                </button>
                <a href="tel:190" style={{ width:'100%',padding:'15px 0',borderRadius:14,background:'var(--accent)',border:'none',color:'#fff',fontFamily:'var(--font-jakarta)',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,textDecoration:'none' }}>
                  <Phone size={18} />
                  Preciso de ajuda (190)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Central de Segurança (BottomSheet) ── */}
        {showSecuritySheet && (
          <div style={{ position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)' }} onClick={() => { setShowSecuritySheet(false); setUnmatchConfirm(false) }}>
            <div style={{ background:'var(--bg-card2)',border:'1px solid var(--border)',borderRadius:'24px 24px 0 0',padding:'20px 20px 40px',width:'100%',maxWidth:480 }} onClick={e => e.stopPropagation()}>
              <div style={{ width:40,height:4,borderRadius:4,background:'rgba(255,255,255,0.15)',margin:'0 auto 18px' }} />
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <Shield size={16} color="rgba(248,249,250,0.60)" strokeWidth={1.5} />
                  <span style={{ fontFamily:'var(--font-fraunces)',fontSize:18,color:'var(--text)' }}>Central de seguranca</span>
                </div>
                <button onClick={() => { setShowSecuritySheet(false); setUnmatchConfirm(false) }} style={{ background:'none',border:'none',cursor:'pointer',padding:4 }}><X size={16} color="var(--muted)" /></button>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                {/* Denunciar */}
                <button onClick={() => { setShowSecuritySheet(false); setShowReport(true) }} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><ShieldAlert size={18} color="#ef4444" strokeWidth={1.5} /></div>
                  <div style={{ textAlign:'left' }}>
                    <p style={{ fontSize:14,fontWeight:600,color:'var(--text)',margin:0 }}>Denunciar {otherUser?.name}</p>
                    <p style={{ fontSize:12,color:'var(--muted-2)',margin:0 }}>Perfil falso, assedio, golpe...</p>
                  </div>
                </button>
                {/* Desfazer match */}
                {unmatchConfirm ? (
                  <div style={{ padding:'14px 16px',borderRadius:16,background:'rgba(225,29,72,0.08)',border:'1px solid rgba(225,29,72,0.25)' }}>
                    <p style={{ fontSize:13,color:'var(--text)',margin:'0 0 12px',textAlign:'center' }}>Tem certeza? O chat será encerrado.</p>
                    <div style={{ display:'flex',gap:8 }}>
                      <button onClick={() => setUnmatchConfirm(false)} style={{ flex:1,padding:'10px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:13,cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>Cancelar</button>
                      <button onClick={handleUnmatch} style={{ flex:1,padding:'10px',borderRadius:12,background:'var(--accent)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>Desfazer</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setUnmatchConfirm(true)} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>
                    <div style={{ width:40,height:40,borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><HeartCrack size={18} color="rgba(248,249,250,0.45)" strokeWidth={1.5} /></div>
                    <div style={{ textAlign:'left' }}>
                      <p style={{ fontSize:14,fontWeight:600,color:'var(--text)',margin:0 }}>Desfazer match</p>
                      <p style={{ fontSize:12,color:'var(--muted-2)',margin:0 }}>Encerrar conversa e remover match</p>
                    </div>
                  </button>
                )}
                {/* Modo Invisível */}
                <button onClick={() => { setShowSecuritySheet(false); router.push('/loja') }} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Ghost size={18} color="rgba(248,249,250,0.45)" strokeWidth={1.5} /></div>
                  <div style={{ textAlign:'left',flex:1 }}>
                    <p style={{ fontSize:14,fontWeight:600,color:'var(--text)',margin:0 }}>Modo invisível</p>
                    <p style={{ fontSize:12,color:'var(--muted-2)',margin:0 }}>
                      {ghostModeUntil && new Date(ghostModeUntil) > new Date()
                        ? `Ativo até ${new Date(ghostModeUntil).toLocaleDateString('pt-BR')}`
                        : 'Some das buscas temporariamente'}
                    </p>
                  </div>
                  {ghostModeUntil && new Date(ghostModeUntil) > new Date() && (
                    <span style={{ fontSize:11,color:'#b8f542',background:'rgba(184,245,66,0.12)',border:'1px solid rgba(184,245,66,0.25)',padding:'2px 8px',borderRadius:100 }}>Ativo</span>
                  )}
                </button>
                {/* Emergência */}
                <a href="tel:190" style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:16,background:'rgba(225,29,72,0.06)',border:'1px solid rgba(225,29,72,0.20)',textDecoration:'none' }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'rgba(225,29,72,0.12)',border:'1px solid rgba(225,29,72,0.30)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Phone size={18} color="#F43F5E" strokeWidth={1.5} /></div>
                  <div style={{ textAlign:'left' }}>
                    <p style={{ fontSize:14,fontWeight:600,color:'#F43F5E',margin:0 }}>Ligar 190</p>
                    <p style={{ fontSize:12,color:'var(--muted-2)',margin:0 }}>Polícia Militar, emergência real</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── ReportModal ── */}
        {showReport && otherUser && (
          <ReportModal
            reportedId={otherUser.id}
            reportedName={otherUser.name}
            onClose={() => setShowReport(false)}
          />
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
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>Você está em perigo?</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
                Esta ação ligará imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.70)' }}>Polícia Militar (190)</strong>. Use apenas em situações de risco real.
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
  icon, label, onClick, active = false, accent = false, success = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  accent?: boolean
  success?: boolean
}) {
  const border = success ? '1px solid rgba(16,185,129,0.25)' : (active || accent ? '1px solid var(--accent-border)' : '1px solid var(--border)')
  const bg = success ? 'rgba(16,185,129,0.10)' : (active || accent ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)')
  const color = success ? '#10b981' : (active || accent ? 'var(--accent)' : 'var(--muted)')
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 100,
        border, background: bg, color,
        fontSize: 12, fontFamily: 'var(--font-jakarta)',
        cursor: success ? 'default' : 'pointer',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── Card de Convite Encontro ─────────────────────────────────────────────────

const RESPOSTAS_RAPIDAS = ['Aceito!', 'Não posso', 'Em breve', 'Me conta mais!']

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

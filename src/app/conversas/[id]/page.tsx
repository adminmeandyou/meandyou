'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Send, ShieldAlert,
  Loader2, AlertCircle, Lock, Menu,
  Sparkles, CalendarPlus, Zap, X, CalendarCheck, Star, Coffee,
  MapPin, Shield, HeartCrack, Phone, CheckCircle2, UserPlus, Check, Smile, Vibrate
} from 'lucide-react'
import { ChatBubble } from '@/components/ui/ChatBubble'
import { ReportModal } from '@/components/ReportModal'
import { VideoCallButton } from '@/components/VideoCall'
import { EmojiPicker } from '@/components/EmojiPicker'
import { useSounds } from '@/hooks/useSounds'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'
import { pickRandomIcebreakers } from '@/lib/icebreakers'

import {
  Message, OtherUser, MAX_CHARS, CONVITE_PREFIX, NUDGE_TOKEN, RESPOSTAS_RAPIDAS,
  formatMsgTime, getDateLabel, getConviteResponse, checkRateLimit,
} from './_components/helpers'
import { ConviteCard } from './_components/ConviteCard'
import { RatingModal } from './_components/RatingModal'
import { BoloModal } from './_components/BoloModal'
import { MeetingModal } from './_components/MeetingModal'
import { CheckinModal } from './_components/CheckinModal'
import { SecuritySheet } from './_components/SecuritySheet'
import { EmergencyModal } from './_components/EmergencyModal'
import { ConvitePanel } from './_components/ConvitePanel'
import { IcebreakerPanel } from './_components/IcebreakerPanel'


export default function ChatPage() {
  const params = useParams()
  const matchId = params.id as string
  const router = useRouter()
  const toast = useToast()
  const sounds = useSounds()

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
  const [icebreakerList, setIcebreakerList] = useState<string[]>(() => pickRandomIcebreakers(6))
  const [showConvite, setShowConvite] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [conviteText, setConviteText] = useState('')
  const [conviteLocal, setConviteLocal] = useState('')
  const [conviteLocalQuery, setConviteLocalQuery] = useState('')
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ display_name: string; name: string; address: any }>>([])
  const [showPlaces, setShowPlaces] = useState(false)
  const placeDebounce = useRef<NodeJS.Timeout | null>(null)
  const [conviteDate, setConviteDate] = useState('')
  const [conviteTime, setConviteTime] = useState('')
  const [shake, setShake] = useState(false)
  const [pendingConvite, setPendingConvite] = useState<string | null>(null)

  // Fase 8: Seguranca Encontros
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingLocal, setMeetingLocal]         = useState('')
  const [meetingPlaceSuggestions, setMeetingPlaceSuggestions] = useState<Array<{ display_name: string; name: string; address: any }>>([])
  const [showMeetingPlaces, setShowMeetingPlaces] = useState(false)
  const meetingPlaceDebounce = useRef<NodeJS.Timeout | null>(null)
  const [meetingDateVal, setMeetingDateVal]     = useState('')
  const [meetingTimeVal, setMeetingTimeVal]     = useState('')
  const [meetingSaved, setMeetingSaved]         = useState(false)
  const [meetingCep, setMeetingCep]             = useState('')
  const [meetingRua, setMeetingRua]             = useState('')
  const [meetingNumero, setMeetingNumero]       = useState('')
  const [meetingBairro, setMeetingBairro]       = useState('')
  const [meetingCidade, setMeetingCidade]       = useState('')
  const [meetingUf, setMeetingUf]               = useState('')
  const [cepLoading, setCepLoading]             = useState(false)
  const [cepError, setCepError]                 = useState('')
  // Check-in pos-encontro (bloqueante)
  const [checkinMeeting, setCheckinMeeting] = useState<{ id: string; local: string; date: string } | null>(null)
  const [checkinRecordId, setCheckinRecordId] = useState<string | null>(null)
  // Central de seguranca
  const [showSecuritySheet, setShowSecuritySheet] = useState(false)
  const [unmatchConfirm, setUnmatchConfirm]       = useState(false)
  const [unmatchDone, setUnmatchDone]             = useState(false)
  const [showReport, setShowReport]               = useState(false)

  // Gamificacao Fase 7
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [ratingConfirmOpcao, setRatingConfirmOpcao] = useState<string | null>(null)
  const [showBoloModal, setShowBoloModal] = useState(false)
  const [boloDone, setBoloDone] = useState(false)
  const [boloOportunidade, setBoloOportunidade] = useState(false)

  // Adicionar como amigo (M4)
  const [friendSent, setFriendSent] = useState(false)
  const [friendshipId, setFriendshipId] = useState<string | null>(null)

  // Encontro aceito fixo
  const [acceptedMeeting, setAcceptedMeeting] = useState<{ text: string; date?: string } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Visual viewport para teclado mobile
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const apply = () => {
      document.documentElement.style.setProperty('--chat-vh', `${vv.height}px`)
      document.documentElement.style.setProperty('--chat-vo', `${vv.offsetTop}px`)
    }
    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
      document.documentElement.style.removeProperty('--chat-vh')
      document.documentElement.style.removeProperty('--chat-vo')
    }
  }, [])

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

    await loadMessages(uid)
    await marcarComoLidas(uid)
    detectPendingConvite(uid)

    // Carregar estado de amizade existente
    try {
      const friendRes = await fetch('/api/amigos')
      if (friendRes.ok) {
        const friendData = await friendRes.json()
        const allFriendships = [...(friendData.friends ?? []), ...(friendData.pending ?? [])]
        const existing = allFriendships.find(
          (f: { requester_id: string; receiver_id: string }) =>
            (f.requester_id === uid && f.receiver_id === otherId) ||
            (f.requester_id === otherId && f.receiver_id === uid)
        )
        if (existing) {
          setFriendSent(true)
          setFriendshipId(existing.id)
        }
      }
    } catch { /* silencioso */ }

    const savedRating = localStorage.getItem(`rating_${matchId}`)
    if (savedRating) setRatingDone(true)

    // Realtime: Broadcast
    channelRef.current = supabase
      .channel(`chat-${matchId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const newMsg = payload as Message

        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        if (newMsg.sender_id !== uid) {
          if (newMsg.content.startsWith(CONVITE_PREFIX)) {
            setPendingConvite(newMsg.content.slice(CONVITE_PREFIX.length))
          }
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15)
          }

          if (newMsg.content === NUDGE_TOKEN) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([250, 120, 250, 120, 250])
            }
            sounds.play('attention')
            setShake(true)
            setTimeout(() => setShake(false), 1850)
          } else {
            sounds.play('receive')
          }
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id)
            .then(() => {})
        }
        scrollToBottom()
      })
      .subscribe()

    // Fase 8: check-in pos-encontro
    try {
      const records: any[] = JSON.parse(localStorage.getItem('meandyou_meetings') ?? '[]')
      const pending = records.find(
        (r) => r.matchId === matchId && !r.checkedIn &&
               new Date(r.date).getTime() + 2 * 60 * 60 * 1000 < Date.now()
      )
      if (pending) setCheckinMeeting({ id: pending.id, local: pending.local, date: pending.date })
    } catch { /* localStorage indisponivel */ }

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

  function handlePlaceSearch(query: string) {
    setConviteLocalQuery(query)
    setConviteLocal('')
    if (placeDebounce.current) clearTimeout(placeDebounce.current)
    if (query.length < 3) { setPlaceSuggestions([]); setShowPlaces(false); return }
    placeDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=br&accept-language=pt-BR`, {
          headers: { 'User-Agent': 'MeAndYou/1.0' }
        })
        const data = await res.json()
        setPlaceSuggestions(data)
        setShowPlaces(data.length > 0)
      } catch { setPlaceSuggestions([]); setShowPlaces(false) }
    }, 500)
  }

  function selectPlace(place: any) {
    const addr = place.address || {}
    const nome = place.name || ''
    const rua = addr.road || ''
    const numero = addr.house_number || ''
    const bairro = addr.suburb || addr.neighbourhood || ''
    const cidade = addr.city || addr.town || addr.village || addr.municipality || ''
    const estado = addr.state || ''
    const cep = addr.postcode || ''

    const partes = [nome, rua && numero ? `${rua}, ${numero}` : rua, bairro, cidade && estado ? `${cidade} - ${estado}` : cidade, cep].filter(Boolean)
    const unicas = [...new Set(partes)]
    const formatado = unicas.join(', ')

    setConviteLocal(formatado)
    setConviteLocalQuery(formatado)
    setShowPlaces(false)
  }

  function detectPendingConvite(uid: string) {
    // Detecta se ha convite recebido sem resposta (chamado apos loadMessages via useEffect)
  }

  // Detecta convite pendente toda vez que messages mudar
  useEffect(() => {
    if (!userId || messages.length === 0) return
    const convites = messages
      .filter(m => m.sender_id !== userId && m.content.startsWith(CONVITE_PREFIX))
    if (convites.length === 0) { setPendingConvite(null); return }
    const ultimo = convites[convites.length - 1]
    const meuIdx = messages.findIndex(m => m.id === ultimo.id)
    const houveResposta = messages.slice(meuIdx + 1).some(m => m.sender_id === userId)
    setPendingConvite(houveResposta ? null : ultimo.content.slice(CONVITE_PREFIX.length))

    // Detector de Bolo
    if (!boloDone) {
      const aceitei = messages.some(m => m.sender_id === userId && m.content === 'Aceito!')
      if (aceitei) setBoloOportunidade(true)
    }

    // Detecta encontro aceito (para banner fixo)
    const meetingMsgs = messages.filter(m => m.content.startsWith('__MEETING__:') || m.content.startsWith(CONVITE_PREFIX))
    for (let i = meetingMsgs.length - 1; i >= 0; i--) {
      const mIdx = messages.findIndex(m => m.id === meetingMsgs[i].id)
      const resp = getConviteResponse(messages, mIdx)
      if (resp === 'Aceito!') {
        try {
          if (meetingMsgs[i].content.startsWith('__MEETING__:')) {
            const d = JSON.parse(meetingMsgs[i].content.slice('__MEETING__:'.length))
            const dateStr = (d.date && d.time) ? new Date(`${d.date}T${d.time}`).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : undefined
            setAcceptedMeeting({ text: d.local || d.texto || 'Encontro marcado', date: dateStr })
          } else {
            setAcceptedMeeting({ text: meetingMsgs[i].content.slice(CONVITE_PREFIX.length) })
          }
        } catch { setAcceptedMeeting({ text: 'Encontro marcado' }) }
        break
      }
      if (i === 0) setAcceptedMeeting(null)
    }
  }, [messages, userId])

  function scrollToBottom(instant?: boolean) {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current
      if (el) {
        if (instant) {
          el.scrollTop = el.scrollHeight
        } else {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        }
      }
    })
  }

  // Funcao base de envio
  async function sendMessage(content: string) {
    if (!content || !userId || sending) return
    setSending(true)
    setError('')
    setRateLimited(false)

    const tempId = crypto.randomUUID()
    const tempMsg: Message = {
      id: tempId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom(true)
    if (content !== NUDGE_TOKEN) sounds.play('send')

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
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setError(json.error ?? 'Erro ao enviar mensagem. Tente novamente.')
      } else {
        const json = await res.json()
        if (json.message) {
          setMessages(prev => prev.map(m => m.id === tempId ? json.message : m))
          channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: json.message,
          })
        }
      }
    } catch {
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

    if (checkRateLimit(messages, userId)) {
      setRateLimited(true)
      setError('Aguarde uma resposta antes de enviar mais mensagens.')
      return
    }

    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    await sendMessage(texto)
  }

  async function handleNudge() {
    const nudgeKey = `nudge_last_${matchId}`
    const last = localStorage.getItem(nudgeKey)
    if (last) {
      const diff = Date.now() - parseInt(last)
      if (diff < 60 * 60 * 1000) {
        const mins = Math.ceil((60 * 60 * 1000 - diff) / 60000)
        toast.info(`Aguarde ${mins} min para chamar a atenção de novo.`)
        return
      }
    }
    localStorage.setItem(nudgeKey, Date.now().toString())
    if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 250])
    sounds.play('attention')
    await sendMessage(NUDGE_TOKEN)
  }

  async function handleSendConvite() {
    const texto = conviteText.trim()
    if (!texto && !conviteLocal.trim()) return

    if (conviteLocal.trim()) {
      const payload = JSON.stringify({
        texto: texto || null,
        local: conviteLocal.trim(),
        date: conviteDate || null,
        time: conviteTime || null,
      })
      await sendMessage(`__MEETING__:${payload}`)
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
    setConviteLocalQuery('')
    setPlaceSuggestions([])
    setShowPlaces(false)
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
    setRatingConfirmOpcao(null)
    localStorage.setItem(`rating_${matchId}`, opcao)
    try {
      await supabase.from('match_ratings').upsert({
        match_id: matchId,
        rater_id: userId,
        rated_id: otherUser?.id,
        rating: opcao,
      }, { onConflict: 'match_id,rater_id' })
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

  // Fase 8: handlers

  function handleMeetingPlaceSearch(query: string) {
    setMeetingLocal(query)
    if (meetingPlaceDebounce.current) clearTimeout(meetingPlaceDebounce.current)
    if (query.length < 3) { setMeetingPlaceSuggestions([]); setShowMeetingPlaces(false); return }
    meetingPlaceDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=br&accept-language=pt-BR`, {
          headers: { 'User-Agent': 'MeAndYou/1.0' }
        })
        const data = await res.json()
        setMeetingPlaceSuggestions(data)
        setShowMeetingPlaces(data.length > 0)
      } catch { setMeetingPlaceSuggestions([]); setShowMeetingPlaces(false) }
    }, 500)
  }

  function selectMeetingPlace(place: any) {
    const addr = place.address || {}
    setMeetingLocal(place.name || place.display_name.split(',')[0])
    setMeetingRua(addr.road || '')
    setMeetingNumero(addr.house_number || '')
    setMeetingBairro(addr.suburb || addr.neighbourhood || '')
    setMeetingCidade(addr.city || addr.town || addr.village || addr.municipality || '')
    setMeetingUf(addr.state_code?.toUpperCase() || (addr.state ? addr.state.slice(0, 2).toUpperCase() : ''))
    setMeetingCep(addr.postcode || '')
    setShowMeetingPlaces(false)
  }

  async function handleCepLookup(raw: string) {
    const cep = raw.replace(/\D/g, '').slice(0, 8)
    setMeetingCep(cep.length > 5 ? `${cep.slice(0,5)}-${cep.slice(5)}` : cep)
    setCepError('')
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado')
      } else {
        setMeetingRua(data.logradouro ?? '')
        setMeetingBairro(data.bairro ?? '')
        setMeetingCidade(data.localidade ?? '')
        setMeetingUf(data.uf ?? '')
      }
    } catch {
      setCepError('Erro ao buscar CEP')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSaveMeeting() {
    if (!meetingLocal.trim() || !meetingDateVal || !meetingTimeVal) return
    const meetingDate = `${meetingDateVal}T${meetingTimeVal}`
    const enderecoCompleto = [
      meetingRua && meetingNumero ? `${meetingRua}, ${meetingNumero}` : meetingRua,
      meetingBairro,
      meetingCidade && meetingUf ? `${meetingCidade}/${meetingUf}` : meetingCidade,
      meetingCep,
    ].filter(Boolean).join(' · ')
    const localFinal = enderecoCompleto
      ? `${meetingLocal.trim()} — ${enderecoCompleto}`
      : meetingLocal.trim()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/safety/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ matchId, matchName: otherUser?.name ?? 'Match', local: localFinal, meetingDate }),
      })
      const json = await res.json()
      if (json.id) setCheckinRecordId(json.id)
    } catch { /* silencioso */ }

    try {
      const record = { id: String(Date.now()), matchId, matchName: otherUser?.name ?? 'Match', local: localFinal, date: meetingDate, checkedIn: false }
      const existing: any[] = JSON.parse(localStorage.getItem('meandyou_meetings') ?? '[]')
      localStorage.setItem('meandyou_meetings', JSON.stringify([...existing, record]))
    } catch { /* ignore */ }

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
      setMeetingCep('')
      setMeetingRua('')
      setMeetingNumero('')
      setMeetingBairro('')
      setMeetingCidade('')
      setMeetingUf('')
      setCepError('')
    }, 1500)
  }

  async function handleCheckinBem() {
    if (!checkinMeeting) return

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
    if (!otherUser) return

    if (friendSent && friendshipId) {
      try {
        const res = await fetch('/api/amigos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendshipId, action: 'remove' }),
        })
        if (res.ok) {
          setFriendSent(false)
          setFriendshipId(null)
          toast.success('Pedido de amizade cancelado')
        }
      } catch {
        toast.error('Erro ao cancelar pedido')
      }
      return
    }

    setFriendSent(true)
    try {
      const res = await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUser.id }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.friendshipId) setFriendshipId(data.friendshipId)
        toast.success(`Pedido de amizade enviado para ${otherUser.name}`)
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          toast.info(data.error || 'Pedido já enviado')
        } else {
          toast.error('Erro ao enviar pedido')
          setFriendSent(false)
        }
      }
    } catch {
      toast.error('Erro ao enviar pedido')
      setFriendSent(false)
    }
  }

  // Renderiza uma mensagem (normal, chamar atencao ou convite)
  function renderMsg(msg: Message, isMe: boolean) {
    if (msg.content === NUDGE_TOKEN) {
      return (
        <div key={msg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={12} color="var(--accent)" />
            {isMe ? 'Você chamou a atenção!' : `${otherUser?.name} chamou sua atenção!`}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )
    }

    if (msg.content.startsWith('__MEETING__:')) {
      try {
        const data = JSON.parse(msg.content.slice('__MEETING__:'.length))
        const linhas = [
          data.local && data.local,
          (data.date && data.time) && `🗓 ${new Date(`${data.date}T${data.time}`).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
          data.texto,
        ].filter(Boolean).join('\n')
        const msgIdx = messages.findIndex(m => m.id === msg.id)
        const responded = getConviteResponse(messages, msgIdx)
        return (
          <ConviteCard key={msg.id} text={linhas} isMe={isMe} time={formatMsgTime(msg.created_at)} onReply={(r) => sendMessage(r)} respondedWith={responded} />
        )
      } catch { /* fallback abaixo */ }
    }

    if (msg.content.startsWith(CONVITE_PREFIX)) {
      const texto = msg.content.slice(CONVITE_PREFIX.length)
      const msgIdx = messages.findIndex(m => m.id === msg.id)
      const responded = getConviteResponse(messages, msgIdx)
      return (
        <ConviteCard
          key={msg.id}
          text={texto}
          isMe={isMe}
          time={formatMsgTime(msg.created_at)}
          onReply={(r) => sendMessage(r)}
          respondedWith={responded}
        />
      )
    }

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
          0%, 100%  { transform: translate3d(0, 0, 0); }
          4%        { transform: translate3d(-14px, 0, 0); }
          10%       { transform: translate3d(14px, 0, 0); }
          16%       { transform: translate3d(-12px, 0, 0); }
          22%       { transform: translate3d(12px, 0, 0); }
          28%       { transform: translate3d(-8px, 0, 0); }
          33%       { transform: translate3d(0, 0, 0); }
          38%       { transform: translate3d(-14px, 0, 0); }
          44%       { transform: translate3d(14px, 0, 0); }
          50%       { transform: translate3d(-12px, 0, 0); }
          56%       { transform: translate3d(12px, 0, 0); }
          62%       { transform: translate3d(-8px, 0, 0); }
          66%       { transform: translate3d(0, 0, 0); }
          71%       { transform: translate3d(-14px, 0, 0); }
          78%       { transform: translate3d(14px, 0, 0); }
          84%       { transform: translate3d(-12px, 0, 0); }
          90%       { transform: translate3d(12px, 0, 0); }
          95%       { transform: translate3d(-6px, 0, 0); }
        }
        .chat-shake { animation: nudge-shake 1.8s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      `}</style>

      <div style={{ position: 'fixed', top: 'var(--chat-vo, 0px)', left: 0, right: 0, height: 'var(--chat-vh, 100dvh)', overflow: 'hidden', overscrollBehavior: 'none', touchAction: 'none', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta)', zIndex: 50 }}>

        {/* Header glass */}
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
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) router.back()
              else router.push('/conversas')
            }}
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

          {otherUser && (
            <VideoCallButton
              matchId={matchId}
              otherName={otherUser.name}
              otherPhoto={otherUser.photo_best}
            />
          )}

          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showMenu ? 'rgba(225,29,72,0.12)' : 'transparent',
              color: showMenu ? 'var(--accent)' : 'rgba(248,249,250,0.50)',
              transition: 'all 0.2s',
            }}
            title="Ações"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </header>

        {/* Menu de acoes (dropdown abaixo do header) */}
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
              { icon: <Sparkles size={16} strokeWidth={1.5} />, label: 'Quebra-gelo', sub: 'Sugestões para começar', onClick: () => { setShowMenu(false); setShowConvite(false); setIcebreakerList(pickRandomIcebreakers(6)); setShowIcebreakers(v => !v) }, active: showIcebreakers },
              { icon: <CalendarPlus size={16} strokeWidth={1.5} />, label: 'Chamar para Encontro', sub: 'Proponha um encontro', onClick: () => { setShowMenu(false); setShowIcebreakers(false); setShowConvite(v => !v) }, active: showConvite },
              { icon: <MapPin size={16} strokeWidth={1.5} />, label: 'Registrar Encontro', sub: 'Salvar local e horário', onClick: () => { setShowMenu(false); setShowMeetingModal(true) } },
              { icon: <Vibrate size={16} strokeWidth={1.5} />, label: 'Chamar atenção', sub: 'Faz a tela da pessoa tremer', onClick: () => { setShowMenu(false); handleNudge() } },
              { icon: friendSent ? <Check size={16} strokeWidth={1.5} /> : <UserPlus size={16} strokeWidth={1.5} />, label: friendSent ? 'Cancelar pedido' : 'Adicionar como amigo', sub: friendSent ? 'Toque para cancelar' : 'Conectem-se fora do app', onClick: () => { setShowMenu(false); handleAddFriend() }, success: friendSent },
              ...(messages.length >= 5 ? [{ icon: <Star size={16} strokeWidth={1.5} />, label: ratingDone ? 'Alterar avaliação' : 'Avaliar conversa', sub: 'Avaliação anônima', onClick: () => { setShowMenu(false); setShowRatingModal(true) } }] : []),
              ...(boloOportunidade && !boloDone ? [{ icon: <Coffee size={16} strokeWidth={1.5} />, label: 'O encontro aconteceu?', sub: 'Conte como foi', onClick: () => { setShowMenu(false); setShowBoloModal(true) } }] : []),
              { icon: <Shield size={16} strokeWidth={1.5} />, label: 'Central de segurança', sub: 'Denunciar, bloquear, modo invisível', onClick: () => { setShowMenu(false); setShowSecuritySheet(true) } },
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

        {/* Banner encontro aceito */}
        {acceptedMeeting && (
          <div style={{
            flexShrink: 0,
            padding: '10px 16px',
            background: 'rgba(16,185,129,0.08)',
            borderBottom: '1px solid rgba(16,185,129,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarCheck size={14} color="#10b981" strokeWidth={1.5} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: '#10b981', margin: 0, fontWeight: 700, fontFamily: 'var(--font-fraunces)' }}>Encontro marcado</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {acceptedMeeting.text}{acceptedMeeting.date ? ` · ${acceptedMeeting.date}` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { setInput(`Sobre nosso encontro: `); inputRef.current?.focus() }}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.20)', color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Enviar mensagem
              </button>
              <button
                onClick={() => { sendMessage('Podemos remarcar?'); }}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', color: '#f59e0b', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Remarcar
              </button>
              <button
                onClick={() => { sendMessage('Preciso cancelar o encontro, desculpa!'); setAcceptedMeeting(null) }}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)', color: '#F43F5E', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {pendingConvite && !acceptedMeeting && (
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
              onClick={() => { sendMessage('Aceito!'); setPendingConvite(null) }}
              disabled={sending}
              style={{ padding: '4px 14px', borderRadius: 100, background: 'var(--accent)', border: 'none', fontSize: 11, fontWeight: 700, color: '#fff', cursor: sending ? 'not-allowed' : 'pointer', letterSpacing: '0.05em', opacity: sending ? 0.6 : 1 }}
            >
              Aceito!
            </button>
            <button
              onClick={() => { sendMessage('Não posso'); setPendingConvite(null) }}
              disabled={sending}
              style={{ padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 11, fontWeight: 600, color: 'var(--muted)', cursor: sending ? 'not-allowed' : 'pointer' }}
            >
              Recusar
            </button>
            <button onClick={() => setPendingConvite(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} color="var(--muted)" />
            </button>
          </div>
        )}

        {/* Aviso de privacidade */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '5px 0',
          color: 'rgba(248,249,250,0.18)', fontSize: 10,
        }}>
          <Lock size={8} strokeWidth={1.5} />
          Conversa privada
        </div>

        {/* Mensagens */}
        <div
          ref={messagesContainerRef}
          className={shake ? 'chat-shake' : ''}
          style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', padding: '4px 14px 8px' }}
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

        {/* Erro / rate limit */}
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

        {/* Painel Quebra-gelo */}
        {showIcebreakers && (
          <IcebreakerPanel
            icebreakerList={icebreakerList}
            onSelect={(q) => { setInput(q); setShowIcebreakers(false); inputRef.current?.focus() }}
            onShuffle={() => setIcebreakerList(pickRandomIcebreakers(6))}
            onClose={() => setShowIcebreakers(false)}
          />
        )}

        {/* Painel Convite Encontro */}
        {showConvite && (
          <ConvitePanel
            conviteText={conviteText}
            setConviteText={setConviteText}
            conviteLocalQuery={conviteLocalQuery}
            conviteLocal={conviteLocal}
            conviteDate={conviteDate}
            setConviteDate={setConviteDate}
            conviteTime={conviteTime}
            setConviteTime={setConviteTime}
            placeSuggestions={placeSuggestions}
            showPlaces={showPlaces}
            sending={sending}
            onClose={() => setShowConvite(false)}
            onPlaceSearch={handlePlaceSearch}
            onSelectPlace={selectPlace}
            onClearPlace={() => { setConviteLocal(''); setConviteLocalQuery(''); setPlaceSuggestions([]) }}
            onSend={handleSendConvite}
          />
        )}

        {/* Barra de entrada glass */}
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
            <div style={{ marginBottom: 8 }}>
              <EmojiPicker onPick={(e) => setInput(v => v + e)} />
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
            <button
              onClick={handleNudge}
              title="Chamar atenção"
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(248,249,250,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Vibrate size={17} strokeWidth={1.5} />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                className="chat-inline-input"
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

        {/* Modal Avaliacao Anonima */}
        {showRatingModal && (
          <RatingModal
            otherName={otherUser?.name ?? 'Usuário'}
            matchId={matchId}
            ratingConfirmOpcao={ratingConfirmOpcao}
            setRatingConfirmOpcao={setRatingConfirmOpcao}
            onClose={() => setShowRatingModal(false)}
            onConfirm={handleRating}
          />
        )}

        {/* Modal Detector de Bolo */}
        {showBoloModal && (
          <BoloModal
            otherName={otherUser?.name ?? 'Usuário'}
            onClose={() => setShowBoloModal(false)}
            onSelect={handleBolo}
          />
        )}

        {/* Modal Registro Privado */}
        {showMeetingModal && (
          <MeetingModal
            otherName={otherUser?.name ?? 'essa pessoa'}
            meetingSaved={meetingSaved}
            meetingLocal={meetingLocal}
            meetingDateVal={meetingDateVal}
            meetingTimeVal={meetingTimeVal}
            meetingCep={meetingCep}
            meetingRua={meetingRua}
            meetingNumero={meetingNumero}
            meetingBairro={meetingBairro}
            meetingCidade={meetingCidade}
            meetingUf={meetingUf}
            cepLoading={cepLoading}
            cepError={cepError}
            meetingPlaceSuggestions={meetingPlaceSuggestions}
            showMeetingPlaces={showMeetingPlaces}
            onClose={() => setShowMeetingModal(false)}
            onSave={handleSaveMeeting}
            onPlaceSearch={handleMeetingPlaceSearch}
            onSelectPlace={selectMeetingPlace}
            onCepLookup={handleCepLookup}
            setMeetingDateVal={setMeetingDateVal}
            setMeetingTimeVal={setMeetingTimeVal}
            setMeetingRua={setMeetingRua}
            setMeetingNumero={setMeetingNumero}
            setMeetingBairro={setMeetingBairro}
            setMeetingCidade={setMeetingCidade}
            setMeetingUf={setMeetingUf}
            setShowMeetingPlaces={setShowMeetingPlaces}
          />
        )}

        {/* Modal Check-in Pos-Encontro (BLOQUEANTE) */}
        {checkinMeeting && (
          <CheckinModal
            otherName={otherUser?.name ?? 'essa pessoa'}
            checkinMeeting={checkinMeeting}
            onCheckinBem={handleCheckinBem}
          />
        )}

        {/* Central de Seguranca */}
        {showSecuritySheet && (
          <SecuritySheet
            otherName={otherUser?.name ?? 'Usuário'}
            unmatchConfirm={unmatchConfirm}
            setUnmatchConfirm={setUnmatchConfirm}
            onClose={() => setShowSecuritySheet(false)}
            onReport={() => { setShowSecuritySheet(false); setShowReport(true) }}
            onUnmatch={handleUnmatch}
          />
        )}

        {/* ReportModal */}
        {showReport && otherUser && (
          <ReportModal
            reportedId={otherUser.id}
            reportedName={otherUser.name}
            onClose={() => setShowReport(false)}
          />
        )}

        {/* Modal de Emergencia */}
        {emergencyModal && (
          <EmergencyModal onClose={() => setEmergencyModal(false)} />
        )}
      </div>
    </>
  )
}

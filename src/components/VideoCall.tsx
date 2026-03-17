'use client'

import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Phone, PhoneOff, PhoneIncoming, Clock, AlertCircle, Loader2, Video } from 'lucide-react'
import Image from 'next/image'

// ─── Tela de chamada ativa (LiveKit) ─────────────────────────────────────────
function ActiveCall({ matchId, otherName, onEnd }: {
  matchId: string
  otherName: string
  onEnd: () => void
}) {
  const [token, setToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null)
  const [remainingMinutes, setRemainingMinutes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchToken()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [matchId])

  async function fetchToken() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ matchId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.limit_reached) setLimitReached(true)
        setError(data.error)
        return
      }
      setToken(data.token)
      setLivekitUrl(data.livekit_url)
      setRemainingMinutes(data.remaining_minutes)
    } catch {
      setError('Erro ao conectar. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  function handleConnected() {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() =>
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current!) / 1000)), 1000
    )
  }

  function handleDisconnected() {
    // ⚠️ NUNCA registrar minutos aqui no client-side.
    // O webhook LiveKit (room_finished) é a única fonte de verdade para debitar minutos.
    // Ver: src/app/api/webhooks/livekit/route.ts
    if (timerRef.current) clearInterval(timerRef.current)
    onEnd()
  }

  // Auto-encerra ao atingir o limite de minutos
  useEffect(() => {
    if (remainingMinutes <= 0) return
    const t = setTimeout(handleDisconnected, remainingMinutes * 60 * 1000)
    return () => clearTimeout(t)
  }, [remainingMinutes])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
      <Loader2 size={28} className="animate-spin" />
      <span className="text-sm">Conectando chamada…</span>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <AlertCircle size={32} className={limitReached ? 'text-yellow-400' : 'text-red-400'} />
      <p className={`text-sm ${limitReached ? 'text-yellow-300' : 'text-red-300'}`}>{error}</p>
      {limitReached && (
        <p className="text-white/30 text-xs">Faça upgrade para ter mais tempo de chamada.</p>
      )}
      <button onClick={onEnd} className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm">
        Voltar para o chat
      </button>
    </div>
  )

  if (!token || !livekitUrl) return null

  return (
    <div className="relative h-full">
      {/* Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur text-white text-sm">
        <Clock size={14} className="text-[#b8f542]" />
        <span>{formatSeconds(elapsedSeconds)}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/50">{remainingMinutes} min restantes</span>
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        style={{ height: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}

// ─── Tela de chamando ─────────────────────────────────────────────────────────
function CallingScreen({ otherName, otherPhoto, onCancel }: {
  otherName: string
  otherPhoto?: string | null
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#0e0b14]">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#b8f542]/30">
        {otherPhoto
          ? <Image src={otherPhoto} alt={otherName} fill className="object-cover" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl text-white/30">{otherName[0]}</div>
        }
        <div className="absolute inset-0 rounded-full border-4 border-[#b8f542]/20 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-white/40 text-sm mb-1">Chamando…</p>
        <p className="font-fraunces text-2xl text-white">{otherName}</p>
      </div>
      <button
        onClick={onCancel}
        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition active:scale-90"
      >
        <PhoneOff size={24} className="text-white" />
      </button>
    </div>
  )
}

// ─── Tela de chamada recebida ─────────────────────────────────────────────────
function IncomingCallScreen({ callerName, callerPhoto, onAccept, onReject }: {
  callerName: string
  callerPhoto?: string | null
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#0e0b14]">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#b8f542]/30">
        {callerPhoto
          ? <Image src={callerPhoto} alt={callerName} fill className="object-cover" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl text-white/30">{callerName[0]}</div>
        }
        <div className="absolute inset-0 rounded-full border-4 border-[#b8f542]/20 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-white/40 text-sm mb-1">Chamada de vídeo</p>
        <p className="font-fraunces text-2xl text-white">{callerName}</p>
      </div>
      <div className="flex gap-8">
        <button
          onClick={onReject}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition active:scale-90"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
        <button
          onClick={onAccept}
          className="w-16 h-16 rounded-full bg-[#b8f542] flex items-center justify-center hover:bg-[#a8e030] transition active:scale-90"
        >
          <Phone size={24} className="text-black" />
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal exportado ───────────────────────────────────────────
export function VideoCallButton({ matchId, otherName, otherPhoto }: {
  matchId: string
  otherName: string
  otherPhoto?: string | null
}) {
  const { user } = useAuth()

  type CallState = 'idle' | 'calling' | 'incoming' | 'active' | 'rejected' | 'missed'
  const [callState, setCallState] = useState<CallState>('idle')
  const [callId, setCallId] = useState<string | null>(null)
  const [callerName, setCallerName] = useState('')
  const [callerPhoto, setCallerPhoto] = useState<string | null>(null)
  const missedTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`videocall:${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_calls', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const call = payload.new as any
          if (!call) return

          if (payload.eventType === 'INSERT' && call.callee_id === user.id) {
            setCallId(call.id)
            setCallState('incoming')
            loadCallerProfile(call.caller_id)
            missedTimeout.current = setTimeout(() => {
              setCallState('missed')
              setTimeout(() => setCallState('idle'), 3000)
            }, 40000)
          }

          if (payload.eventType === 'UPDATE') {
            if (call.status === 'accepted' && call.caller_id === user.id) {
              if (missedTimeout.current) clearTimeout(missedTimeout.current)
              setCallState('active')
            }
            if (call.status === 'rejected' && call.caller_id === user.id) {
              if (missedTimeout.current) clearTimeout(missedTimeout.current)
              setCallState('rejected')
              setTimeout(() => setCallState('idle'), 3000)
            }
            if (call.status === 'ended') setCallState('idle')
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      if (missedTimeout.current) clearTimeout(missedTimeout.current)
    }
  }, [user, matchId])

  async function loadCallerProfile(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('name, photo_best')
      .eq('id', id)
      .single()
    if (data) { setCallerName(data.name); setCallerPhoto(data.photo_best) }
  }

  async function handleCall() {
    if (!user) return
    const { data: match } = await supabase
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()
    if (!match) return

    const calleeId = match.user1 === user.id ? match.user2 : match.user1
    const { data: call } = await supabase
      .from('video_calls')
      .insert({ match_id: matchId, caller_id: user.id, callee_id: calleeId, status: 'ringing' })
      .select()
      .single()

    if (call) {
      setCallId(call.id)
      setCallState('calling')
      missedTimeout.current = setTimeout(async () => {
        await supabase.from('video_calls').update({ status: 'missed' }).eq('id', call.id)
        setCallState('missed')
        setTimeout(() => setCallState('idle'), 3000)
      }, 40000)
    }
  }

  async function handleAccept() {
    if (!callId) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'accepted' }).eq('id', callId)
    setCallState('active')
  }

  async function handleReject() {
    if (!callId) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'rejected' }).eq('id', callId)
    setCallState('idle')
  }

  async function handleEndCall() {
    // Só atualiza status — minutos são debitados pelo webhook LiveKit (room_finished)
    if (callId) await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
    setCallId(null)
    setCallState('idle')
  }

  async function handleCancelCall() {
    if (callId) {
      if (missedTimeout.current) clearTimeout(missedTimeout.current)
      await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
    }
    setCallId(null)
    setCallState('idle')
  }

  if (callState === 'calling') return (
    <div className="fixed inset-0 z-50">
      <CallingScreen otherName={otherName} otherPhoto={otherPhoto} onCancel={handleCancelCall} />
    </div>
  )
  if (callState === 'incoming') return (
    <div className="fixed inset-0 z-50">
      <IncomingCallScreen callerName={callerName} callerPhoto={callerPhoto} onAccept={handleAccept} onReject={handleReject} />
    </div>
  )
  if (callState === 'active') return (
    <div className="fixed inset-0 z-50 bg-[#0e0b14]">
      <ActiveCall matchId={matchId} otherName={otherName} onEnd={handleEndCall} />
    </div>
  )
  if (callState === 'rejected') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0b14]/90">
      <div className="text-center">
        <PhoneOff size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white/60 text-sm">Chamada recusada</p>
      </div>
    </div>
  )
  if (callState === 'missed') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0b14]/90">
      <div className="text-center">
        <PhoneIncoming size={32} className="text-yellow-400 mx-auto mb-3" />
        <p className="text-white/60 text-sm">Chamada sem resposta</p>
      </div>
    </div>
  )

  return (
    <button
      onClick={handleCall}
      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition text-white/50 hover:text-[#b8f542]"
      title="Iniciar videochamada"
    >
      <Video size={18} />
    </button>
  )
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

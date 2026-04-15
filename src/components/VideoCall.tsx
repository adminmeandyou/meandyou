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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Conectando chamada…</span>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 32px', textAlign: 'center' }}>
      <AlertCircle size={32} color={limitReached ? '#F59E0B' : '#F43F5E'} />
      <p style={{ fontSize: 14, color: limitReached ? '#F59E0B' : '#F43F5E' }}>{error}</p>
      {limitReached && (
        <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Faça upgrade para ter mais tempo de chamada.</p>
      )}
      <button onClick={onEnd} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>
        Voltar para o chat
      </button>
    </div>
  )

  if (!token || !livekitUrl) return null

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Timer */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 100,
        background: 'rgba(8,9,14,0.80)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: 'var(--text)', fontSize: 13,
      }}>
        <Clock size={13} color="var(--accent)" />
        <span>{formatSeconds(elapsedSeconds)}</span>
        <span style={{ color: 'var(--muted-2)' }}>·</span>
        <span style={{ color: 'var(--muted)' }}>{remainingMinutes} min restantes</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(225,29,72,0.30)', position: 'relative' }}>
          {otherPhoto
            ? <Image src={otherPhoto} alt={otherName} fill style={{ objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 32, color: 'var(--muted)' }}>{otherName[0]}</div>
          }
        </div>
        <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(225,29,72,0.20)', animation: 'ping 1.5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '1px solid rgba(225,29,72,0.10)', animation: 'ping 1.5s ease-in-out infinite', animationDelay: '0.4s' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>Chamando…</p>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: 'var(--text)', margin: 0 }}>{otherName}</p>
      </div>
      <button
        onClick={onCancel}
        style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(225,29,72,0.35)' }}
      >
        <PhoneOff size={22} color="#fff" />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(225,29,72,0.30)', position: 'relative' }}>
          {callerPhoto
            ? <Image src={callerPhoto} alt={callerName} fill style={{ objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 32, color: 'var(--muted)' }}>{callerName[0]}</div>
          }
        </div>
        <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(225,29,72,0.20)', animation: 'ping 1.5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '1px solid rgba(225,29,72,0.10)', animation: 'ping 1.5s ease-in-out infinite', animationDelay: '0.4s' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-jakarta)', fontWeight: 700 }}>Chamada de vídeo</p>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: 'var(--text)', margin: 0 }}>{callerName}</p>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        <button
          onClick={onReject}
          style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <PhoneOff size={22} color="#F43F5E" />
        </button>
        <button
          onClick={onAccept}
          style={{ width: 60, height: 60, borderRadius: '50%', background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
        >
          <Phone size={22} color="#fff" />
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user) return

    // Broadcast channel — gratuito no plano free (postgres_changes filtrado exige pago)
    const channel = supabase.channel(`videocall:${matchId}`)
      .on('broadcast', { event: 'call_signal' }, ({ payload }) => {
        if (!payload) return

        // Chamada recebida: quem está sendo chamado
        if (payload.type === 'ringing' && payload.callee_id === user.id) {
          setCallId(payload.call_id)
          setCallState('incoming')
          loadCallerProfile(payload.caller_id)
          missedTimeout.current = setTimeout(() => {
            setCallState('missed')
            setTimeout(() => setCallState('idle'), 3000)
          }, 40000)
        }

        // Chamador: outro lado aceitou
        if (payload.type === 'accepted' && payload.caller_id === user.id) {
          if (missedTimeout.current) clearTimeout(missedTimeout.current)
          setCallState('active')
        }

        // Chamador: outro lado recusou
        if (payload.type === 'rejected' && payload.caller_id === user.id) {
          if (missedTimeout.current) clearTimeout(missedTimeout.current)
          setCallState('rejected')
          setTimeout(() => setCallState('idle'), 3000)
        }

        // Qualquer lado: chamada encerrada
        if (payload.type === 'ended') {
          setCallState('idle')
        }
      })
      .subscribe()

    channelRef.current = channel
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

  async function broadcastSignal(payload: Record<string, unknown>) {
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'call_signal',
      payload,
    })
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

      // Notifica o outro lado via broadcast (funciona no plano gratuito)
      await broadcastSignal({ type: 'ringing', call_id: call.id, caller_id: user.id, callee_id: calleeId })

      missedTimeout.current = setTimeout(async () => {
        await supabase.from('video_calls').update({ status: 'missed' }).eq('id', call.id)
        await broadcastSignal({ type: 'ended', call_id: call.id })
        setCallState('missed')
        setTimeout(() => setCallState('idle'), 3000)
      }, 40000)
    }
  }

  async function handleAccept() {
    if (!callId || !user) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'accepted' }).eq('id', callId)
    // Avisa o chamador que foi aceito
    const { data: call } = await supabase.from('video_calls').select('caller_id').eq('id', callId).single()
    if (call) await broadcastSignal({ type: 'accepted', call_id: callId, caller_id: call.caller_id })
    setCallState('active')
  }

  async function handleReject() {
    if (!callId || !user) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'rejected' }).eq('id', callId)
    const { data: call } = await supabase.from('video_calls').select('caller_id').eq('id', callId).single()
    if (call) await broadcastSignal({ type: 'rejected', call_id: callId, caller_id: call.caller_id })
    setCallState('idle')
  }

  async function handleEndCall() {
    if (callId) {
      await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
      await broadcastSignal({ type: 'ended', call_id: callId })
    }
    setCallId(null)
    setCallState('idle')
  }

  async function handleCancelCall() {
    if (callId) {
      if (missedTimeout.current) clearTimeout(missedTimeout.current)
      await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
      await broadcastSignal({ type: 'ended', call_id: callId })
    }
    setCallId(null)
    setCallState('idle')
  }

  if (callState === 'calling') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <CallingScreen otherName={otherName} otherPhoto={otherPhoto} onCancel={handleCancelCall} />
    </div>
  )
  if (callState === 'incoming') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <IncomingCallScreen callerName={callerName} callerPhoto={callerPhoto} onAccept={handleAccept} onReject={handleReject} />
    </div>
  )
  if (callState === 'active') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bg)' }}>
      <ActiveCall matchId={matchId} otherName={otherName} onEnd={handleEndCall} />
    </div>
  )
  if (callState === 'rejected') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)' }}>
      <div style={{ textAlign: 'center' }}>
        <PhoneOff size={32} color="#F43F5E" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chamada recusada</p>
      </div>
    </div>
  )
  if (callState === 'missed') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)' }}>
      <div style={{ textAlign: 'center' }}>
        <PhoneIncoming size={32} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chamada sem resposta</p>
      </div>
    </div>
  )

  return (
    <button
      onClick={handleCall}
      style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', transition: 'color 0.2s' }}
      title="Iniciar videochamada"
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,249,250,0.40)')}
    >
      <Video size={18} strokeWidth={1.5} />
    </button>
  )
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

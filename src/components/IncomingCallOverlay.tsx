'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
// useRouter removido — overlay renderiza ActiveCall direto, sem navegacao
import Image from 'next/image'
import { Phone, PhoneOff } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { initVideoCallBus, onVideoCallSignal, sendVideoCallSignal } from '@/lib/videocall-bus'
import { ActiveCall } from './VideoCall'
import { playSoundDirect } from '@/hooks/useSounds'

interface CallerInfo {
  matchId: string
  callId: string
  callerId: string
  callerName: string
  callerPhoto: string | null
}

/**
 * Overlay global de chamada de video recebida.
 * Montado no AppShell — aparece em qualquer tela do app.
 * Usa o videocall-bus (1 canal Realtime fixo por usuario).
 *
 * Quando o usuario aceita, renderiza ActiveCall diretamente
 * em vez de navegar para outra pagina.
 */
export function IncomingCallOverlay() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const [incoming, setIncoming] = useState<CallerInfo | null>(null)
  const [activeCall, setActiveCall] = useState<CallerInfo | null>(null)
  const userIdRef = useRef<string | null>(null)
  const missedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true
    let unsub: (() => void) | null = null

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      userIdRef.current = user.id

      initVideoCallBus(user.id)

      unsub = onVideoCallSignal((payload) => {
        if (!mounted) return

        if (payload.type === 'ringing' && payload.callee_id === user.id) {
          // Se o usuario esta na conversa deste match, o VideoCallButton
          // ja cuida — nao duplicar o overlay aqui
          if (payload.match_id && pathnameRef.current === `/conversas/${payload.match_id}`) return

          setIncoming({
            matchId: payload.match_id ?? '',
            callId: payload.call_id ?? '',
            callerId: payload.caller_id ?? '',
            callerName: payload.caller_name ?? 'Alguem',
            callerPhoto: payload.caller_photo ?? null,
          })

          // Auto-dismiss se nao atender em 40s
          if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)
          missedTimeoutRef.current = setTimeout(() => {
            setIncoming(null)
          }, 40000)
        }

        if (payload.type === 'cancelled' || payload.type === 'ended') {
          setIncoming(prev => (prev && prev.matchId === payload.match_id ? null : prev))
          setActiveCall(prev => (prev && prev.matchId === payload.match_id ? null : prev))
          if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)
        }
      })
    }

    setup()

    return () => {
      mounted = false
      if (unsub) unsub()
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)
      // NAO chamar teardownVideoCallBus aqui — o bus e compartilhado
      // com VideoCallButton e deve persistir enquanto o usuario estiver logado
    }
  }, [])

  useEffect(() => {
    if (incoming) {
      playSoundDirect('notification')
      const id = setInterval(() => playSoundDirect('notification'), 1500)
      return () => clearInterval(id)
    }
  }, [incoming])

  async function handleAccept() {
    if (!incoming) return
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)

    const info = { ...incoming }
    setIncoming(null)

    // Atualiza banco (silencioso — pode falhar se tabela for video_calls)
    try {
      if (info.callId) {
        await supabase.from('video_calls').update({ status: 'accepted' }).eq('id', info.callId)
      }
    } catch {}

    // Avisa o chamador que foi aceito
    await sendVideoCallSignal(info.callerId, {
      type: 'accepted',
      call_id: info.callId,
      match_id: info.matchId,
      callee_id: userIdRef.current ?? undefined,
    })

    // Renderiza ActiveCall diretamente
    setActiveCall(info)
  }

  async function handleReject() {
    if (!incoming) return
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)

    await sendVideoCallSignal(incoming.callerId, {
      type: 'rejected',
      match_id: incoming.matchId,
      callee_id: userIdRef.current ?? undefined,
    })

    try {
      if (incoming.callId) {
        await supabase.from('video_calls').update({ status: 'rejected' }).eq('id', incoming.callId)
      }
    } catch {}

    setIncoming(null)
  }

  async function handleEndCall() {
    if (!activeCall) return

    try {
      if (activeCall.callId) {
        await supabase.from('video_calls').update({ status: 'ended' }).eq('id', activeCall.callId)
      }
    } catch {}

    await sendVideoCallSignal(activeCall.callerId, {
      type: 'ended',
      call_id: activeCall.callId,
      match_id: activeCall.matchId,
    })

    setActiveCall(null)
  }

  // Chamada ativa — renderiza ActiveCall full-screen
  if (activeCall) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg)',
        width: '100vw', height: '100dvh',
      }}>
        <ActiveCall
          matchId={activeCall.matchId}
          otherUserId={activeCall.callerId}
          otherName={activeCall.callerName}
          isCaller={false}
          onEnd={handleEndCall}
        />
      </div>
    )
  }

  // Sem chamada recebida
  if (!incoming) return null

  // Tela de chamada recebida
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.16) 0%, rgba(8,9,14,0.96) 60%)',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-jakarta)',
        animation: 'ui-fade-in 0.25s ease',
        padding: '0 24px',
      }}
    >
      {/* Foto com auras pulsantes */}
      <div style={{ position: 'relative', width: 156, height: 156, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '1px solid rgba(225,29,72,0.08)', animation: 'overlay-pulse 2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1.5px solid rgba(225,29,72,0.20)', animation: 'overlay-pulse 2s ease-out infinite', animationDelay: '0.5s' }} />
        <div style={{
          width: 156, height: 156, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(225,29,72,0.50)',
          boxShadow: '0 0 60px rgba(225,29,72,0.30)',
          background: 'var(--bg-card2)',
          position: 'relative',
        }}>
          {incoming.callerPhoto ? (
            <Image src={incoming.callerPhoto} alt={incoming.callerName} fill style={{ objectFit: 'cover' }} sizes="156px" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 56, color: 'var(--muted)' }}>
                {incoming.callerName[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#F43F5E', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 8px' }}>
        Chamada de video
      </p>
      <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 30, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
        {incoming.callerName}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.50)', margin: '8px 0 48px' }}>
        Esta te chamando…
      </p>

      <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleReject}
            style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48, #be123c)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 32px rgba(225,29,72,0.45)' }}
          >
            <PhoneOff size={28} color="#fff" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>Recusar</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleAccept}
            style={{ width: 76, height: 76, borderRadius: '50%', background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 32px rgba(16,185,129,0.45), 0 0 0 8px rgba(16,185,129,0.08)' }}
          >
            <Phone size={28} color="#fff" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>Atender</span>
        </div>
      </div>

      <style>{`
        @keyframes overlay-pulse {
          0%   { opacity: 0.9; transform: scale(0.95); }
          100% { opacity: 0;   transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}

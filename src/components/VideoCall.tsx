'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Phone, PhoneOff, PhoneIncoming, AlertCircle, Loader2, Video, VideoOff, Mic, MicOff, ArrowLeft, RotateCcw, FlipHorizontal2, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { playSoundDirect } from '@/hooks/useSounds'
import { initVideoCallBus, onVideoCallSignal, sendVideoCallSignal } from '@/lib/videocall-bus'
import type { CallSignal } from '@/lib/videocall-bus'
import { WebRTCManager } from '@/lib/webrtc'

// ─── Tela de chamada ativa (WebRTC P2P) ─────────────────────────────────────
export function ActiveCall({ matchId, otherUserId, otherName, isCaller, onEnd }: {
  matchId: string
  otherUserId: string
  otherName: string
  isCaller: boolean
  onEnd: () => void
}) {
  const [remainingMinutes, setRemainingMinutes] = useState(0)
  const [plan, setPlan] = useState<string>('essencial')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remoteMuted, setRemoteMuted] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [remoteTrackCount, setRemoteTrackCount] = useState(0)
  const [iceState, setIceState] = useState<string>('new')

  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const managerRef = useRef<WebRTCManager | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const signalQueueRef = useRef<CallSignal[]>([])
  const managerReadyRef = useRef(false)

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [mirrored, setMirrored] = useState(true)

  const handleEnd = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    const duration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0
    notifyEnd(matchId, duration)
    managerRef.current?.destroy()
    managerRef.current = null
    onEnd()
  }, [matchId, onEnd])

  function processSignal(payload: CallSignal) {
    if (payload.match_id !== matchId) return
    if (!managerReadyRef.current || !managerRef.current) {
      signalQueueRef.current.push(payload)
      return
    }
    if (payload.type === 'sdp_offer' && payload.sdp) managerRef.current.handleOffer(payload.sdp)
    if (payload.type === 'sdp_answer' && payload.sdp) managerRef.current.handleAnswer(payload.sdp)
    if (payload.type === 'ice_candidate' && payload.candidate) managerRef.current.handleIceCandidate(payload.candidate)
    if (payload.type === 'ended') handleEnd()
  }

  function drainSignalQueue() {
    const queued = signalQueueRef.current.splice(0)
    for (const s of queued) processSignal(s)
  }

  useEffect(() => {
    managerReadyRef.current = false
    signalQueueRef.current = []
    const unsub = onVideoCallSignal(processSignal)
    start()
    return () => {
      unsub()
      if (timerRef.current) clearInterval(timerRef.current)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      managerRef.current?.destroy()
      managerRef.current = null
      managerReadyRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
    }
  }, [remoteStream, remoteTrackCount])

  useEffect(() => {
    if (!loading && localVideoRef.current && managerRef.current) {
      const local = managerRef.current.getLocalStream()
      if (local) localVideoRef.current.srcObject = local
    }
  }, [loading])

  async function start() {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/videocall/check-limits', {
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
        setLoading(false)
        return
      }
      setRemainingMinutes(data.remaining_minutes)
      const resolvedPlan = data.plan ?? 'essencial'
      setPlan(resolvedPlan)
    } catch {
      setError('Erro ao conectar. Verifique sua conexão.')
      setLoading(false)
      return
    }

    try {
      const { data: { session: sess } } = await supabase.auth.getSession()
      const { data: planData } = await supabase.from('profiles').select('plan').eq('id', sess?.user?.id).single()
      const actualPlan = planData?.plan ?? 'essencial'
      const manager = new WebRTCManager(otherUserId, matchId, sess?.access_token ?? '', actualPlan, {
        onRemoteStream: (stream) => {
          setRemoteStream(stream)
          setRemoteTrackCount(stream.getTracks().length)
        },
        onConnectionState: (state) => setIceState(state),
        onDisconnected: handleEnd,
      })
      managerRef.current = manager
      await manager.init(isCaller)
      managerReadyRef.current = true
      drainSignalQueue()

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() =>
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current!) / 1000)), 1000
      )
      sendHeartbeat()
      heartbeatRef.current = setInterval(sendHeartbeat, 60000)
    } catch (err) {
      handleMediaError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleMediaError(err: unknown) {
    const name = (err as { name?: string })?.name ?? ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      setPermissionDenied(true)
      setError('Permita o acesso à câmera e ao microfone para iniciar a chamada.')
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      setError('Câmera ou microfone não encontrados no dispositivo.')
    } else {
      setError('Erro ao acessar câmera ou microfone.')
    }
  }

  async function sendHeartbeat() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/videocall/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ matchId }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (typeof data.remaining_minutes === 'number') setRemainingMinutes(data.remaining_minutes)
      if (data.plan) setPlan(data.plan)
      if (data.limit_reached) handleEnd()
    } catch {}
  }

  async function notifyEnd(mId: string, durationSeconds: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/videocall/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ matchId: mId, durationSeconds }),
      })
    } catch {}
  }

  useEffect(() => {
    if (remainingMinutes <= 0) return
    const t = setTimeout(handleEnd, remainingMinutes * 60 * 1000)
    return () => clearTimeout(t)
  }, [remainingMinutes, handleEnd])

  function toggleMic() {
    if (!managerRef.current) return
    playSoundDirect('tap')
    const on = managerRef.current.toggleMic()
    setMicOn(on)
  }

  function toggleCam() {
    if (!managerRef.current) return
    playSoundDirect('tap')
    const on = managerRef.current.toggleCamera()
    setCamOn(on)
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = managerRef.current.getLocalStream()
    }
  }

  async function flipCam() {
    if (!managerRef.current) return
    playSoundDirect('tap')
    const next: 'user' | 'environment' = facing === 'user' ? 'environment' : 'user'
    try {
      await managerRef.current.flipCamera(next)
      setFacing(next)
      setCamOn(true)
      setMirrored(next === 'user')
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = managerRef.current.getLocalStream()
      }
    } catch (e) {
      console.warn('flip camera failed', e)
    }
  }

  function toggleMirror() {
    playSoundDirect('tap')
    setMirrored(v => !v)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Conectando chamada…</span>
    </div>
  )

  if (error && limitReached) {
    const upgradeInfo: Record<string, { next: string; price: string; hours: string; extras: string }> = {
      essencial: { next: 'Plus', price: '39,90', hours: '2h por dia', extras: 'qualidade melhor + ver quem curtiu voce + desfazer curtida' },
      plus:      { next: 'Black', price: '99,90', hours: '5h por dia', extras: 'qualidade maxima + filtros exclusivos + area Backstage' },
      black:     { next: '', price: '', hours: '', extras: '' },
    }
    const info = upgradeInfo[plan] ?? upgradeInfo.essencial
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0, padding: '0 24px', textAlign: 'center', fontFamily: 'var(--font-jakarta)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Video size={28} color="#F59E0B" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
          Voce atingiu seu tempo de Live hoje
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, maxWidth: 300, lineHeight: 1.5 }}>
          Seu plano atual permite {plan === 'essencial' ? '45 minutos' : plan === 'plus' ? '2 horas' : '5 horas'} de videochamada por dia.
        </p>

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {info.next && (
            <button
              onClick={() => { window.location.href = '/planos' }}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, #E11D48, #be123c)',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span>Continuar agora</span>
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                Por apenas R$ {info.price}/mes voce ganha {info.hours} + {info.extras}
              </span>
            </button>
          )}

          <button
            onClick={() => { window.location.href = '/loja' }}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <span>Recarregar saldo Live com fichas</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>
              A partir de 40 fichas por 1 hora extra
            </span>
          </button>
        </div>

        <button onClick={onEnd} style={{ marginTop: 16, padding: '10px 18px', borderRadius: 10, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
          Voltar para o chat
        </button>
      </div>
    )
  }

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 32px', textAlign: 'center' }}>
      <AlertCircle size={32} color="#F43F5E" />
      <p style={{ fontSize: 14, color: '#F43F5E', maxWidth: 320, lineHeight: 1.5 }}>{error}</p>
      {permissionDenied && (
        <p style={{ fontSize: 11, color: 'var(--muted-2)', maxWidth: 280, lineHeight: 1.55 }}>Abra as configuracoes do navegador e libere camera e microfone para o MeAndYou, depois tente novamente.</p>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {permissionDenied && (
          <button onClick={start} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #E11D48, #be123c)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Tentar de novo
          </button>
        )}
        <button onClick={onEnd} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
          Voltar para o chat
        </button>
      </div>
    </div>
  )

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const minutesCritical = remainingMinutes > 0 && remainingMinutes <= 3
  const minutesLow = remainingMinutes > 3 && remainingMinutes <= 10
  const minutesColor = minutesCritical ? '#F43F5E' : minutesLow ? '#F59E0B' : 'rgba(255,255,255,0.55)'
  const minutesBg = minutesCritical ? 'rgba(244,63,94,0.14)' : minutesLow ? 'rgba(245,158,11,0.14)' : 'rgba(15,17,23,0.7)'
  const minutesBorder = minutesCritical ? 'rgba(244,63,94,0.35)' : minutesLow ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.05)'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#08090E', fontFamily: 'var(--font-jakarta)', overflow: 'hidden' }}>
      {/* Remote video (full screen) */}
      <div style={{ position: 'absolute', inset: 0, background: '#0d0e13' }}>
        {remoteStream && remoteTrackCount > 0 && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Aguardando vídeo de {otherName}…
          </div>
        )}
      </div>

      {/* Remote audio */}
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

      {/* Vignettes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to bottom, rgba(8,9,14,0.7) 0%, rgba(8,9,14,0) 100%)', pointerEvents: 'none', zIndex: 10 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 240, background: 'linear-gradient(to top, rgba(8,9,14,0.92) 0%, rgba(8,9,14,0) 100%)', pointerEvents: 'none', zIndex: 10 }} />

      {/* Header */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            onClick={handleEnd}
            aria-label="Voltar"
            style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'rgba(15,17,23,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={18} color="#fff" strokeWidth={1.5} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: '#fff', margin: 0, letterSpacing: '-0.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherName}</h1>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.20em', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Em chamada</span>
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 100, background: 'rgba(15,17,23,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', boxShadow: '0 0 8px rgba(225,29,72,0.6)', animation: 'ui-pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, letterSpacing: '0.08em', color: '#fff' }}>{formatSeconds(elapsedSeconds)}</span>
        </div>
      </header>

      {/* Conexão estável card */}
      <div style={{ position: 'absolute', top: 96, left: 20, zIndex: 30, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(15,17,23,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', padding: '12px 14px', maxWidth: 200 }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 15, color: '#fff', margin: '0 0 8px', lineHeight: 1.15 }}>
            {iceState === 'connected' || iceState === 'completed' ? 'Conexao estavel' : iceState === 'checking' ? 'Conectando...' : iceState === 'failed' ? 'Falha na conexao' : 'Aguardando...'}
          </p>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
          </div>
        </div>
      </div>

      {/* Pill discreto: minutos restantes hoje no plano */}
      {remainingMinutes > 0 && (
        <div style={{ position: 'absolute', top: 96, right: 20, zIndex: 30, pointerEvents: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 100, background: minutesBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${minutesBorder}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: minutesColor, letterSpacing: '0.04em' }}>
              {remainingMinutes} min hoje · {planLabel}
            </span>
          </div>
          {minutesCritical && (
            <p style={{ fontSize: 9, color: '#F43F5E', margin: '6px 0 0', textAlign: 'right', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Últimos minutos</p>
          )}
        </div>
      )}

      {/* PIP — self */}
      <section style={{ position: 'absolute', right: 20, bottom: 148, width: 104, aspectRatio: '3/4', zIndex: 35, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.10)', background: '#13161f' }}>
        {camOn ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: mirrored ? 'scaleX(-1)' : 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VideoOff size={20} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
          </div>
        )}
      </section>

      {/* Control bar */}
      <nav style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 16, paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px', borderRadius: 100, background: 'rgba(15,17,23,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)' }}>
          <ControlButton
            icon={micOn ? <Mic size={20} strokeWidth={1.5} /> : <MicOff size={20} strokeWidth={1.5} />}
            label="Mudo"
            onClick={toggleMic}
            active={!micOn}
          />
          <ControlButton
            icon={camOn ? <Video size={20} strokeWidth={1.5} /> : <VideoOff size={20} strokeWidth={1.5} />}
            label="Vídeo"
            onClick={toggleCam}
            active={!camOn}
          />
          <button
            onClick={handleEnd}
            aria-label="Encerrar chamada"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48, #be123c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(225,29,72,0.45), 0 0 0 6px rgba(225,29,72,0.08)' }}>
              <PhoneOff size={26} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F43F5E' }}>Encerrar</span>
          </button>
          <ControlButton
            icon={<RotateCcw size={20} strokeWidth={1.5} />}
            label="Girar"
            onClick={flipCam}
          />
          <ControlButton
            icon={<FlipHorizontal2 size={20} strokeWidth={1.5} />}
            label="Espelho"
            onClick={toggleMirror}
            active={!mirrored}
          />
          <ControlButton
            icon={remoteMuted ? <VolumeX size={20} strokeWidth={1.5} /> : <Volume2 size={20} strokeWidth={1.5} />}
            label="Som"
            onClick={() => {
              setRemoteMuted(v => {
                const next = !v
                if (remoteAudioRef.current) remoteAudioRef.current.muted = next
                if (remoteVideoRef.current) remoteVideoRef.current.muted = next
                return next
              })
            }}
            active={remoteMuted}
          />
        </div>
      </nav>
    </div>
  )
}

function ControlButton({ icon, label, onClick, active = false }: {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: active ? '#F43F5E' : 'rgba(255,255,255,0.88)' }}
    >
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: active ? 'rgba(225,29,72,0.18)' : 'rgba(52,52,58,0.6)', border: active ? '1px solid rgba(225,29,72,0.35)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms cubic-bezier(0.19,1,0.22,1)' }}>
        {icon}
      </div>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: active ? '#F43F5E' : 'rgba(255,255,255,0.55)' }}>{label}</span>
    </button>
  )
}

// ─── Tela de chamando (editorial) ────────────────────────────────────────────
function CallingScreen({ otherName, otherPhoto, onCancel }: {
  otherName: string
  otherPhoto?: string | null
  onCancel: () => void
}) {
  useEffect(() => {
    playSoundDirect('notification')
    const id = setInterval(() => playSoundDirect('notification'), 2000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.10) 0%, #08090E 60%)', fontFamily: 'var(--font-jakarta)', padding: '0 24px' }}>
      {/* Status "CONEXÃO ESTÁVEL" top-right */}
      <div style={{ position: 'absolute', top: 'max(20px, env(safe-area-inset-top, 20px))', right: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 100, background: 'rgba(15,17,23,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
        <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text)', fontWeight: 600 }}>Conexão estável</span>
      </div>

      {/* Foto com auras pulsantes */}
      <div style={{ position: 'relative', width: 156, height: 156, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '1px solid rgba(225,29,72,0.08)', animation: 'calling-pulse 2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1.5px solid rgba(225,29,72,0.18)', animation: 'calling-pulse 2s ease-out infinite', animationDelay: '0.5s' }} />
        <div style={{ width: 156, height: 156, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(225,29,72,0.45)', boxShadow: '0 0 60px rgba(225,29,72,0.25)', position: 'relative', background: 'var(--bg-card2)' }}>
          {otherPhoto
            ? <Image src={otherPhoto} alt={otherName} fill style={{ objectFit: 'cover' }} sizes="156px" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 56, color: 'var(--muted)' }}>{otherName[0]}</div>
          }
        </div>
      </div>

      {/* "Chamando Nome…" editorial */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 30, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Chamando <span style={{ color: '#F43F5E' }}>{otherName}</span>…
        </p>
      </div>
      <p style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 48px' }}>Iniciando vídeo seguro</p>

      {/* Botão cancelar grande */}
      <button
        onClick={onCancel}
        style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48, #be123c)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 32px rgba(225,29,72,0.45), 0 0 0 8px rgba(225,29,72,0.08)', transition: 'transform 0.2s' }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <PhoneOff size={28} color="#fff" strokeWidth={1.8} />
      </button>
      <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, marginTop: 14 }}>Cancelar</span>

      <style>{`
        @keyframes calling-pulse {
          0%   { opacity: 0.9; transform: scale(0.95); }
          100% { opacity: 0;   transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}

// ─── Tela de chamada recebida (editorial) ────────────────────────────────────
function IncomingCallScreen({ callerName, callerPhoto, onAccept, onReject }: {
  callerName: string
  callerPhoto?: string | null
  onAccept: () => void
  onReject: () => void
}) {
  useEffect(() => {
    playSoundDirect('notification')
    const id = setInterval(() => playSoundDirect('notification'), 1500)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.12) 0%, #08090E 60%)', fontFamily: 'var(--font-jakarta)', padding: '0 24px' }}>
      <div style={{ position: 'relative', width: 156, height: 156, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '1px solid rgba(225,29,72,0.08)', animation: 'calling-pulse 2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1.5px solid rgba(225,29,72,0.20)', animation: 'calling-pulse 2s ease-out infinite', animationDelay: '0.5s' }} />
        <div style={{ width: 156, height: 156, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(225,29,72,0.50)', boxShadow: '0 0 60px rgba(225,29,72,0.30)', position: 'relative', background: 'var(--bg-card2)' }}>
          {callerPhoto
            ? <Image src={callerPhoto} alt={callerName} fill style={{ objectFit: 'cover' }} sizes="156px" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 56, color: 'var(--muted)' }}>{callerName[0]}</div>
          }
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#F43F5E', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 8px' }}>Chamada de vídeo</p>
      <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 30, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{callerName}</p>
      <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.50)', margin: '8px 0 48px' }}>Está te chamando…</p>

      <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onReject}
            style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48, #be123c)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 32px rgba(225,29,72,0.45)' }}
          >
            <PhoneOff size={28} color="#fff" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>Recusar</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onAccept}
            style={{ width: 76, height: 76, borderRadius: '50%', background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 32px rgba(16,185,129,0.45), 0 0 0 8px rgba(16,185,129,0.08)' }}
          >
            <Phone size={28} color="#fff" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.50)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>Atender</span>
        </div>
      </div>

      <style>{`
        @keyframes calling-pulse {
          0%   { opacity: 0.9; transform: scale(0.95); }
          100% { opacity: 0;   transform: scale(1.25); }
        }
      `}</style>
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
  const [callerIdState, setCallerIdState] = useState<string | null>(null)
  const [isCaller, setIsCaller] = useState(false)
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const missedTimeout = useRef<NodeJS.Timeout | null>(null)
  const calleeIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    let unsub: (() => void) | null = null
    const userIdRef2 = { current: user?.id ?? '' }

    async function setup() {
      if (!userIdRef2.current) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted || !session?.user) return
        userIdRef2.current = session.user.id
      }
      initVideoCallBus(userIdRef2.current)

      unsub = onVideoCallSignal((payload) => {
        if (!payload || !mounted) return

        if (payload.type === 'ringing' && payload.callee_id === userIdRef2.current && payload.match_id === matchId) {
          setCallId(payload.call_id ?? null)
          setCallerIdState(payload.caller_id ?? null)
          setCallState('incoming')
          if (payload.caller_id) loadCallerProfile(payload.caller_id)
          missedTimeout.current = setTimeout(() => {
            setCallState('missed')
            setTimeout(() => setCallState('idle'), 3000)
          }, 40000)
        }

        if (payload.type === 'accepted' && payload.match_id === matchId) {
          if (missedTimeout.current) clearTimeout(missedTimeout.current)
          setCallState('active')
        }

        if (payload.type === 'rejected' && payload.match_id === matchId) {
          if (missedTimeout.current) clearTimeout(missedTimeout.current)
          setCallState('rejected')
          setTimeout(() => setCallState('idle'), 3000)
        }

        if ((payload.type === 'ended' || payload.type === 'cancelled') && payload.match_id === matchId) {
          setCallState('idle')
        }
      })
    }

    setup()

    return () => {
      mounted = false
      if (unsub) unsub()
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
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user ?? user
    if (!currentUser) return

    initVideoCallBus(currentUser.id)

    const { data: match } = await supabase
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()
    if (!match) return

    const calleeId = match.user1 === currentUser.id ? match.user2 : match.user1
    calleeIdRef.current = calleeId
    setOtherUserId(calleeId)
    setIsCaller(true)
    const { data: call } = await supabase
      .from('video_calls')
      .insert({ match_id: matchId, caller_id: currentUser.id, callee_id: calleeId, status: 'ringing' })
      .select()
      .single()

    if (call) {
      setCallId(call.id)
      setCallState('calling')

      await sendVideoCallSignal(calleeId, {
        type: 'ringing',
        call_id: call.id,
        match_id: matchId,
        caller_id: currentUser.id,
        callee_id: calleeId,
        caller_name: otherName,
        caller_photo: otherPhoto ?? null,
      })

      missedTimeout.current = setTimeout(async () => {
        await supabase.from('video_calls').update({ status: 'missed' }).eq('id', call.id)
        await sendVideoCallSignal(calleeId, { type: 'ended', match_id: matchId, call_id: call.id })
        setCallState('missed')
        setTimeout(() => setCallState('idle'), 3000)
      }, 40000)
    }
  }

  async function handleAccept() {
    if (!callId) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'accepted' }).eq('id', callId)
    const { data: call } = await supabase.from('video_calls').select('caller_id').eq('id', callId).single()
    if (call) {
      setOtherUserId(call.caller_id)
      setIsCaller(false)
      await sendVideoCallSignal(call.caller_id, {
        type: 'accepted', call_id: callId, match_id: matchId,
      })
    }
    setCallState('active')
  }

  async function handleReject() {
    if (!callId) return
    if (missedTimeout.current) clearTimeout(missedTimeout.current)
    await supabase.from('video_calls').update({ status: 'rejected' }).eq('id', callId)
    const { data: call } = await supabase.from('video_calls').select('caller_id').eq('id', callId).single()
    if (call) {
      await sendVideoCallSignal(call.caller_id, {
        type: 'rejected', call_id: callId, match_id: matchId,
      })
    }
    setCallState('idle')
  }

  async function handleEndCall() {
    if (callId) {
      await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
      const { data: call } = await supabase.from('video_calls').select('caller_id, callee_id').eq('id', callId).single()
      const { data: { session: endSess } } = await supabase.auth.getSession()
      const myId = endSess?.user?.id
      const otherId = call ? (call.caller_id === myId ? call.callee_id : call.caller_id) : calleeIdRef.current
      if (otherId) {
        await sendVideoCallSignal(otherId, { type: 'ended', call_id: callId, match_id: matchId })
      }
    }
    setCallId(null)
    setCallState('idle')
  }

  async function handleCancelCall() {
    if (callId) {
      if (missedTimeout.current) clearTimeout(missedTimeout.current)
      await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
      if (calleeIdRef.current) {
        await sendVideoCallSignal(calleeIdRef.current, { type: 'cancelled', call_id: callId, match_id: matchId })
      }
    }
    setCallId(null)
    setCallState('idle')
  }

  const overlayBase: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'var(--bg)',
    width: '100vw', height: '100dvh',
  }

  const overlay = (() => {
    if (callState === 'calling') return (
      <div style={overlayBase}>
        <CallingScreen otherName={otherName} otherPhoto={otherPhoto} onCancel={handleCancelCall} />
      </div>
    )
    if (callState === 'incoming') return (
      <div style={overlayBase}>
        <IncomingCallScreen callerName={callerName} callerPhoto={callerPhoto} onAccept={handleAccept} onReject={handleReject} />
      </div>
    )
    if (callState === 'active' && otherUserId) return (
      <div style={overlayBase}>
        <ActiveCall matchId={matchId} otherUserId={otherUserId} otherName={otherName} isCaller={isCaller} onEnd={handleEndCall} />
      </div>
    )
    if (callState === 'rejected') return (
      <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ textAlign: 'center' }}>
          <PhoneOff size={32} color="#F43F5E" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chamada recusada</p>
        </div>
      </div>
    )
    if (callState === 'missed') return (
      <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ textAlign: 'center' }}>
          <PhoneIncoming size={32} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chamada sem resposta</p>
        </div>
      </div>
    )
    return null
  })()

  return (
    <>
      <button
        onClick={handleCall}
        style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', transition: 'color 0.2s' }}
        title="Iniciar videochamada"
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,249,250,0.40)')}
      >
        <Video size={18} strokeWidth={1.5} />
      </button>
      {overlay && typeof document !== 'undefined' && createPortal(overlay, document.body)}
    </>
  )
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

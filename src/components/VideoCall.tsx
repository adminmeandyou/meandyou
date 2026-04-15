'use client'

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Phone, PhoneOff, PhoneIncoming, AlertCircle, Loader2, Video, VideoOff, Mic, MicOff, ArrowLeft, RotateCcw } from 'lucide-react'
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
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    start()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  async function start() {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)

    // Preflight: pedir permissao de camera/microfone antes de conectar.
    // Se o browser recusar, exibimos erro claro em vez de conectar sem tracks
    // (o que deixa o LiveKit derrubar a sala por timeout de idle).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Libera o device pro LiveKit capturar em seguida.
      stream.getTracks().forEach(t => t.stop())
    } catch (e) {
      console.error('getUserMedia denied', e)
      setPermissionDenied(true)
      setError('Permita o acesso à câmera e ao microfone para iniciar a chamada.')
      setLoading(false)
      return
    }

    await fetchToken()
  }

  async function fetchToken() {
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
      <p style={{ fontSize: 14, color: limitReached ? '#F59E0B' : '#F43F5E', maxWidth: 320, lineHeight: 1.5 }}>{error}</p>
      {limitReached && (
        <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Faça upgrade para ter mais tempo de chamada.</p>
      )}
      {permissionDenied && (
        <p style={{ fontSize: 11, color: 'var(--muted-2)', maxWidth: 280, lineHeight: 1.55 }}>Abra as configurações do navegador e libere câmera e microfone para o MeAndYou, depois tente novamente.</p>
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

  if (!token || !livekitUrl) return null

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={true}
      audio={true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      onError={(err) => console.error('LiveKit error:', err)}
      style={{ height: '100%', background: '#08090E' }}
    >
      <CallView
        otherName={otherName}
        elapsedSeconds={elapsedSeconds}
        remainingMinutes={remainingMinutes}
        onEnd={handleDisconnected}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}

// ─── Tela "em chamada" editorial (LiveKit custom) ───────────────────────────
function CallView({ otherName, elapsedSeconds, remainingMinutes, onEnd }: {
  otherName: string
  elapsedSeconds: number
  remainingMinutes: number
  onEnd: () => void
}) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
  const remoteCam = tracks.find(t => !t.participant.isLocal)
  const localCam = tracks.find(t => t.participant.isLocal)

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')

  // Fallback: garante que camera e microfone sao ativados apos conectar,
  // mesmo se o `video audio` do LiveKitRoom nao disparar sozinho.
  useEffect(() => {
    if (!localParticipant) return
    let cancelled = false
    ;(async () => {
      try {
        if (!localParticipant.isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(true)
        }
        if (!localParticipant.isCameraEnabled) {
          await localParticipant.setCameraEnabled(true)
        }
      } catch (e) {
        console.error('enable mic/cam failed', e)
      }
      if (!cancelled) {
        setMicOn(localParticipant.isMicrophoneEnabled)
        setCamOn(localParticipant.isCameraEnabled)
      }
    })()
    return () => { cancelled = true }
  }, [localParticipant])

  async function toggleMic() {
    if (!localParticipant) return
    const next = !micOn
    await localParticipant.setMicrophoneEnabled(next)
    setMicOn(next)
  }

  async function toggleCam() {
    if (!localParticipant) return
    const next = !camOn
    await localParticipant.setCameraEnabled(next)
    setCamOn(next)
  }

  async function flipCam() {
    if (!localParticipant) return
    const next: 'user' | 'environment' = facing === 'user' ? 'environment' : 'user'
    try {
      await localParticipant.setCameraEnabled(true, { facingMode: next })
      setFacing(next)
      setCamOn(true)
    } catch (e) {
      console.warn('flip camera failed', e)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#08090E', fontFamily: 'var(--font-jakarta)', overflow: 'hidden' }}>
      {/* Remote video (full screen) */}
      <div style={{ position: 'absolute', inset: 0, background: '#0d0e13' }}>
        {remoteCam?.publication?.track ? (
          <VideoTrack trackRef={remoteCam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Aguardando vídeo de {otherName}…
          </div>
        )}
      </div>

      {/* Vignettes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to bottom, rgba(8,9,14,0.7) 0%, rgba(8,9,14,0) 100%)', pointerEvents: 'none', zIndex: 10 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 240, background: 'linear-gradient(to top, rgba(8,9,14,0.92) 0%, rgba(8,9,14,0) 100%)', pointerEvents: 'none', zIndex: 10 }} />

      {/* Header */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            onClick={onEnd}
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
          <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 15, color: '#fff', margin: '0 0 8px', lineHeight: 1.15 }}>Conexão estável</p>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: '#E11D48' }} />
            <div style={{ height: 3, width: 24, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
          </div>
          {remainingMinutes > 0 && (
            <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '8px 0 0', fontWeight: 600 }}>{remainingMinutes} min restantes</p>
          )}
        </div>
      </div>

      {/* PIP — self */}
      <section style={{ position: 'absolute', right: 20, bottom: 148, width: 104, aspectRatio: '3/4', zIndex: 35, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.10)', background: '#13161f' }}>
        {localCam?.publication?.track && camOn ? (
          <VideoTrack trackRef={localCam} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
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
            onClick={onEnd}
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
    if (callState === 'active') return (
      <div style={overlayBase}>
        <ActiveCall matchId={matchId} otherName={otherName} onEnd={handleEndCall} />
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

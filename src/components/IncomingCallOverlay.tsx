'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Phone, PhoneOff } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

interface CallerInfo {
  matchId: string
  callerId: string
  callerName: string
  callerPhoto: string | null
}

/**
 * Overlay global de chamada de vídeo recebida.
 * Montado no AppShell — aparece em qualquer tela do app.
 * Escuta Broadcast em todos os matches ativos do usuário logado.
 */
export function IncomingCallOverlay() {
  const router = useRouter()
  const [incoming, setIncoming] = useState<CallerInfo | null>(null)
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([])
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      userIdRef.current = user.id

      // Busca todos os matches ativos do usuário
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1.eq.${user.id},user2.eq.${user.id}`)
        .eq('status', 'active')

      if (!matches || !mounted) return

      // Para cada match, cria um canal Broadcast escutando chamadas
      for (const match of matches) {
        const channel = supabase
          .channel(`videocall:${match.id}`)
          .on('broadcast', { event: 'call_signal' }, ({ payload }) => {
            if (
              payload?.type === 'ringing' &&
              payload?.callee_id === userIdRef.current &&
              mounted
            ) {
              setIncoming({
                matchId: match.id,
                callerId: payload.caller_id,
                callerName: payload.caller_name ?? 'Alguém',
                callerPhoto: payload.caller_photo ?? null,
              })
            }
            // Se a chamada foi cancelada pelo chamador
            if (payload?.type === 'cancelled' && payload?.match_id === match.id) {
              setIncoming(prev => prev?.matchId === match.id ? null : prev)
            }
          })
          .subscribe()

        channelsRef.current.push(channel)
      }
    }

    setup()

    return () => {
      mounted = false
      channelsRef.current.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [])

  async function handleAccept() {
    if (!incoming) return
    const matchId = incoming.matchId
    setIncoming(null)
    router.push(`/videochamada/${matchId}`)
  }

  async function handleReject() {
    if (!incoming) return
    // Broadcast de rejeição
    await supabase.channel(`videocall:${incoming.matchId}`).send({
      type: 'broadcast',
      event: 'call_signal',
      payload: {
        type: 'rejected',
        match_id: incoming.matchId,
        callee_id: userIdRef.current,
      },
    })
    // Atualiza banco
    await supabase
      .from('videocalls')
      .update({ status: 'rejected' })
      .eq('match_id', incoming.matchId)
      .eq('status', 'ringing')
    setIncoming(null)
  }

  if (!incoming) return null

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
        Chamada de vídeo
      </p>
      <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontSize: 30, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
        {incoming.callerName}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.50)', margin: '8px 0 48px' }}>
        Está te chamando…
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

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
        background: 'rgba(0,0,0,0.80)',
        backdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28,
        fontFamily: 'var(--font-jakarta)',
        animation: 'ui-fade-in 0.25s ease',
      }}
    >
      {/* Foto do chamador */}
      <div style={{
        position: 'relative',
        width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid rgba(225,29,72,0.5)',
        boxShadow: '0 0 0 8px rgba(225,29,72,0.12), 0 0 0 16px rgba(225,29,72,0.06)',
        background: 'var(--bg-card2)',
        animation: 'incoming-pulse 1.5s ease-in-out infinite',
      }}>
        {incoming.callerPhoto ? (
          <Image src={incoming.callerPhoto} alt={incoming.callerName} fill style={{ objectFit: 'cover' }} sizes="120px" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 48, color: 'var(--muted)' }}>
              {incoming.callerName[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', gap: 6, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          Chamada de vídeo
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-fraunces)', letterSpacing: '-0.02em' }}>
          {incoming.callerName}
        </p>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
          Está te chamando...
        </p>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        {/* Recusar */}
        <button
          onClick={handleReject}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(244,63,94,0.15)',
            border: '1.5px solid rgba(244,63,94,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexDirection: 'column', gap: 4,
          }}
        >
          <PhoneOff size={26} color="#F43F5E" strokeWidth={1.5} />
        </button>

        {/* Atender */}
        <button
          onClick={handleAccept}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            background: '#10b981',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(16,185,129,0.4)',
          }}
        >
          <Phone size={26} color="#fff" strokeWidth={1.5} />
        </button>
      </div>

      {/* Labels abaixo dos botões */}
      <div style={{ display: 'flex', gap: 40 }}>
        <span style={{ width: 68, textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Recusar</span>
        <span style={{ width: 68, textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Atender</span>
      </div>

      <style>{`
        @keyframes incoming-pulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(225,29,72,0.12), 0 0 0 16px rgba(225,29,72,0.06); }
          50%       { box-shadow: 0 0 0 12px rgba(225,29,72,0.16), 0 0 0 24px rgba(225,29,72,0.08); }
        }
      `}</style>
    </div>
  )
}

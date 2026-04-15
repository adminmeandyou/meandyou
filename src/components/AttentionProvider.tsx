'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { playSoundDirect } from '@/hooks/useSounds'
import { Zap } from 'lucide-react'

const NUDGE_TOKEN = '__NUDGE__'

type AttentionEvent = {
  id: string
  name: string
  photo?: string | null
  matchId: string
}

/**
 * Provider global que escuta mensagens NUDGE em todos os matches do usuário
 * e dispara: tremida de tela + 3 bips + banner no topo "Fulano chamou sua atenção".
 * Funciona em qualquer página com AppShell (não precisa estar na conversa).
 */
export function AttentionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [event, setEvent] = useState<AttentionEvent | null>(null)
  const [shaking, setShaking] = useState(false)
  const dismissTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      // Busca match_ids do usuário (ele pode ser user1 ou user2)
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1.eq.${user.id},user2.eq.${user.id}`)

      if (cancelled || !matches?.length) return
      const matchIds = matches.map(m => m.id as string)

      // Subscreve novas mensagens de qualquer match seu
      channel = supabase
        .channel(`global-attention:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=in.(${matchIds.join(',')})`,
          },
          async (payload) => {
            const msg = payload.new as {
              content?: string
              sender_id?: string
              match_id?: string
            }
            if (!msg?.content || msg.content !== NUDGE_TOKEN) return
            if (msg.sender_id === user.id) return

            // Só dispara banner global se o usuário NÃO estiver dentro
            // da conversa que recebeu o nudge (a própria página de chat
            // já trata o efeito local).
            if (typeof window !== 'undefined' && window.location.pathname === `/conversas/${msg.match_id}`) {
              return
            }

            // Busca nome/foto de quem enviou
            const { data: sender } = await supabase
              .from('profiles')
              .select('name, photo_best')
              .eq('id', msg.sender_id!)
              .single()

            triggerAttention({
              id: `${msg.match_id}-${Date.now()}`,
              name: sender?.name ?? 'Alguém',
              photo: sender?.photo_best ?? null,
              matchId: msg.match_id!,
            })
          }
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) channel.unsubscribe()
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  function triggerAttention(e: AttentionEvent) {
    setEvent(e)
    setShaking(true)

    // 3 bips sonoros
    playSoundDirect('attention')

    // 3 tremidas de tela via vibração
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 120, 250, 120, 250])
    }

    // Para o shake depois que a animação termina (1.8s — 3 ciclos de 0.6s)
    setTimeout(() => setShaking(false), 1850)

    // Auto-dismiss do banner após 5s
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setEvent(null), 5000)
  }

  return (
    <>
      <style>{`
        @keyframes global-attention-shake {
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
        .meandyou-shake { animation: global-attention-shake 1.8s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      `}</style>

      <div className={shaking ? 'meandyou-shake' : ''} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>

      {event && (
        <button
          onClick={() => {
            const target = `/conversas/${event.matchId}`
            setEvent(null)
            if (typeof window !== 'undefined') window.location.href = target
          }}
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 16px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 18px 12px 12px',
            borderRadius: 100,
            background: 'rgba(15,17,23,0.95)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
            border: '1px solid rgba(225,29,72,0.35)',
            boxShadow: '0 12px 32px rgba(225,29,72,0.35), 0 0 0 4px rgba(225,29,72,0.06)',
            cursor: 'pointer',
            fontFamily: 'var(--font-jakarta)',
            animation: 'ui-toast-in 0.3s cubic-bezier(0.16,1,0.3,1)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div style={{
            position: 'relative',
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D48, #be123c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {event.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.photo} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Zap size={20} color="#fff" strokeWidth={2} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#F43F5E' }}>
              Chamou sua atenção
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {event.name}
            </span>
          </div>
        </button>
      )}
    </>
  )
}

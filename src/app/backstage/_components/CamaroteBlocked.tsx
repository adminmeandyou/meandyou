'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  ArrowLeft, Crown, Lock, Star, MessageCircle,
} from 'lucide-react'
import {
  CATEGORIAS, G, G_SOFT, G_BORDER, G_BORDER2, BG_DARK, BG_CARD,
  isRated,
} from './helpers'
import CamaroteAccessModal from './CamaroteAccessModal'
import RatingSheet from './RatingSheet'

interface Props {
  plan: 'plus' | 'essencial'
  onBack: () => void
}

export default function CamaroteBlocked({ plan, onBack }: Props) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [rescuedChats, setRescuedChats] = useState<{ id: string; category: string; rescuer_name: string; rescued_by: string }[]>([])
  const [ratingFor, setRatingFor] = useState<{ id: string; otherId: string } | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    supabase
      .from('access_requests')
      .select('id, category, rescued_by')
      .eq('requester_id', user.id)
      .eq('status', 'rescued')
      .gt('expires_at', new Date().toISOString())
      .then(async ({ data }) => {
        if (!data?.length) return
        const ids = data.map(r => r.rescued_by)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ids)
        const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))
        const chats = data.map(r => ({ id: r.id, category: r.category, rescuer_name: nameMap[r.rescued_by] ?? 'Alguem', rescued_by: r.rescued_by }))
        setRescuedChats(chats)
        const done = new Set<string>(chats.filter(c => isRated(c.id)).map(c => c.id))
        setRatedIds(done)
      })
  }, [user?.id])

  function handleRated(requestId: string) {
    setRatedIds(prev => new Set([...prev, requestId]))
  }

  return (
    <div style={{ minHeight: '100vh', background: BG_DARK, fontFamily: 'var(--font-jakarta)', overflow: 'hidden', position: 'relative' }}>

      {/* Foto de fundo */}
      <img
        src="/images/camarote-bg.jpg"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.25, filter: 'blur(2px)', pointerEvents: 'none' }}
      />

      {/* Overlay escuro */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,6,8,0.4) 0%, rgba(5,6,8,0.88) 60%, rgba(5,6,8,0.98) 100%)' }} />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={18} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff' }}>Camarote Black</span>
      </header>

      {/* Conteudo principal */}
      <div style={{ position: 'relative', zIndex: 5, padding: '40px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Icone */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: G_SOFT, border: `1.5px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Lock size={28} color={G} strokeWidth={1.5} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, color: '#fff', margin: '0 0 10px', textAlign: 'center', lineHeight: 1.2 }}>
          Camarote Black
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 300 }}>
          Um ambiente exclusivo para experiências que vão além do comum. Apenas assinantes Black têm acesso.
        </p>

        {/* Categorias travadas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {CATEGORIAS.map(cat => (
            <div
              key={cat.key}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: `1px solid rgba(255,255,255,0.07)`, background: 'rgba(255,255,255,0.04)' }}
            >
              <Lock size={10} color="rgba(255,255,255,0.25)" strokeWidth={2} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Chats ativos (foi resgatado) */}
        {rescuedChats.length > 0 && (
          <div style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center' }}>
              Você foi resgatado
            </p>
            {rescuedChats.map(chat => (
              <div
                key={chat.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: G_SOFT, border: `1px solid ${G_BORDER}`, marginBottom: 8 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Crown size={15} color={G} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{chat.rescuer_name}</p>
                  <p style={{ fontSize: 11, color: G, margin: 0 }}>{CATEGORIAS.find(c => c.key === chat.category)?.label ?? chat.category}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!ratedIds.has(chat.id) && (
                    <button
                      onClick={() => setRatingFor({ id: chat.id, otherId: chat.rescued_by })}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${G_BORDER}`, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Star size={13} color={G} strokeWidth={1.5} />
                    </button>
                  )}
                  <a
                    href={`/backstage/chat/${chat.id}`}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <MessageCircle size={14} color={G} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botoes */}
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="/planos"
            style={{ display: 'block', width: '100%', padding: '15px', borderRadius: 16, textAlign: 'center', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-jakarta)', textDecoration: 'none', background: `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)`, color: '#fff', boxSizing: 'border-box' }}
          >
            Assinar Black por R$ 99,97/mes
          </a>
          <button
            onClick={() => setShowModal(true)}
            style={{ width: '100%', padding: '14px', borderRadius: 16, border: `1px solid rgba(245,158,11,0.35)`, background: 'rgba(245,158,11,0.10)', color: '#F59E0B', fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            Pedir acesso ao Camarote
          </button>
        </div>
      </div>

      {showModal && (
        <CamaroteAccessModal user={user} plan={plan} onClose={() => setShowModal(false)} />
      )}

      {ratingFor && (
        <RatingSheet
          ratingFor={ratingFor}
          onClose={() => setRatingFor(null)}
          onRated={handleRated}
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, MessageCircle, User, X } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useHaptics } from '@/hooks/useHaptics'
import { ConvMatch, isOnline, formatAgo } from './helpers'

export function AbaTodos({ matches, onEmpty, onOpen, searchTerm }: {
  matches: ConvMatch[]
  onEmpty: () => void
  onOpen: (matchId: string) => void
  searchTerm: string
}) {
  const router = useRouter()
  const haptics = useHaptics()
  const [selected, setSelected] = useState<ConvMatch | null>(null)

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => { document.body.style.overflow = ''; document.body.style.touchAction = '' }
  }, [selected])

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={28} />}
        title={searchTerm ? 'Nenhum match encontrado' : 'Nenhum match ainda'}
        description={searchTerm ? undefined : 'Continue curtindo! Quando alguém curtir de volta, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar perfis', onClick: onEmpty } : undefined}
      />
    )
  }

  return (
    <>
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {matches.map((m) => (
          <button
            key={m.match_id}
            onClick={() => { haptics.tap(); setSelected(m) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}
          >
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
                background: 'var(--bg-card2)',
                border: isOnline(m.last_active_at) && m.show_last_active !== false
                  ? '2px solid #2ec4a0'
                  : '1.5px solid rgba(255,255,255,0.06)',
              }}>
                {m.photo_best ? (
                  <Image src={m.photo_best} alt={m.name} width={120} height={120} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 28 }}>{m.name[0]}</span>
                  </div>
                )}
              </div>
              {isOnline(m.last_active_at) && m.show_last_active !== false && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, borderRadius: '50%', background: '#2ec4a0', border: '2px solid var(--bg)' }} />
              )}
              {(m.unread_count || 0) > 0 && (
                <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 100, background: 'var(--accent)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{(m.unread_count || 0) > 9 ? '9+' : m.unread_count}</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>{formatAgo(m.matched_at)}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none', padding: '20px 20px 32px', boxShadow: '0 -4px 32px rgba(0,0,0,0.4)' }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid var(--accent-border)', flexShrink: 0 }}>
                {selected.photo_best ? (
                  <Image src={selected.photo_best} alt={selected.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{selected.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                  Match {formatAgo(selected.matched_at)}
                  {isOnline(selected.last_active_at) && selected.show_last_active !== false && (
                    <span style={{ color: '#2ec4a0', marginLeft: 6 }}>· Online agora</span>
                  )}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} color="var(--muted)" strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { haptics.medium(); router.push(`/conversas/${selected.match_id}`) }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', boxShadow: '0 4px 20px rgba(225,29,72,0.25)' }}
              >
                <MessageCircle size={18} strokeWidth={1.5} />
                Enviar mensagem
              </button>
              <button
                onClick={() => { haptics.tap(); router.push(`/perfil/${selected.other_user_id}`) }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)' }}
              >
                <User size={18} strokeWidth={1.5} />
                Ver perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

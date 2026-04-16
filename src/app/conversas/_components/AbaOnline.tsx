'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Zap, MessageCircle, User, X } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useHaptics } from '@/hooks/useHaptics'
import { Friend } from './helpers'

export function AbaOnline({ friends, myShowOnline, onEmpty, searchTerm }: {
  friends: Friend[]
  myShowOnline: boolean
  onEmpty: () => void
  searchTerm: string
}) {
  const router = useRouter()
  const haptics = useHaptics()
  const [selected, setSelected] = useState<Friend | null>(null)

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

  if (!myShowOnline) {
    return (
      <EmptyState
        icon={<Zap size={28} />}
        title="Status online ocultado"
        description="Você ocultou seu status online. Ative nas configurações para ver amigos online."
        action={{ label: 'Ir para configurações', onClick: () => router.push('/configuracoes') }}
      />
    )
  }

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<Zap size={28} />}
        title={searchTerm ? 'Nenhum amigo encontrado' : 'Nenhum amigo online agora'}
        description={searchTerm ? undefined : 'Quando um amigo estiver ativo nos últimos 5 minutos, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar perfis', onClick: onEmpty } : undefined}
      />
    )
  }

  return (
    <>
      <div>
        <p style={{ padding: '12px 20px 4px', fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          {friends.length} {friends.length === 1 ? 'amigo online' : 'amigos online'} agora
        </p>
        {friends.map((f) => (
          <button
            key={f.userId}
            onClick={() => { haptics.tap(); setSelected(f) }}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', borderBottom: '1px solid var(--border-soft)',
              textAlign: 'left',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid #2ec4a0' }}>
                {f.photo ? (
                  <Image src={f.photo} alt={f.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{f.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#2ec4a0', border: '2px solid var(--bg)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </p>
              <p style={{ fontSize: 13, margin: 0, color: '#2ec4a0', fontWeight: 500 }}>
                Ativo agora
              </p>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 100, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Mensagem
            </div>
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
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid #2ec4a0', flexShrink: 0 }}>
                {selected.photo ? (
                  <Image src={selected.photo} alt={selected.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{selected.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: '#2ec4a0', margin: '2px 0 0', fontWeight: 500 }}>Online agora</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} color="var(--muted)" strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.matchId ? (
                <button
                  onClick={() => { haptics.medium(); router.push(`/conversas/${selected.matchId}`) }}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', boxShadow: '0 4px 20px rgba(225,29,72,0.25)' }}
                >
                  <MessageCircle size={18} strokeWidth={1.5} />
                  Enviar mensagem
                </button>
              ) : null}
              <button
                onClick={() => { haptics.tap(); router.push(`/perfil/${selected.userId}`) }}
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

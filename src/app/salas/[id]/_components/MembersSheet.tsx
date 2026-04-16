'use client'

import { useState } from 'react'
import { ArrowLeft, UserPlus, UserCircle, MessageCircle, VolumeX, Ban } from 'lucide-react'
import { RoomMember } from './helpers'

export function MembersSheet({
  members, myUserId, myNickname, onClose, onAction, blocked,
}: {
  members: RoomMember[]
  myUserId: string
  myNickname: string
  onClose: () => void
  onAction: (member: RoomMember, action: 'profile' | 'chat' | 'block' | 'mute' | 'friend') => void
  blocked: Set<string>
}) {
  const [selected, setSelected] = useState<RoomMember | null>(null)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 60,
        backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', padding: '20px 16px 40px',
        maxHeight: '70vh', overflowY: 'auto',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, margin: '0 0 16px' }}>
          Membros na sala ({members.length})
        </p>

        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {members.map(m => (
              <button
                key={m.user_id}
                onClick={() => m.user_id !== myUserId && setSelected(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 12, backgroundColor: 'transparent', border: 'none',
                  cursor: m.user_id === myUserId ? 'default' : 'pointer', textAlign: 'left',
                  opacity: blocked.has(m.user_id) ? 0.4 : 1,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {m.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                    {m.nickname}
                    {m.user_id === myUserId && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>(você)</span>}
                  </p>
                </div>
                {blocked.has(m.user_id) && <VolumeX size={12} color="var(--muted)" style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <ArrowLeft size={18} />
              </button>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{selected.nickname}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { action: 'friend' as const,  icon: <UserPlus size={18} />, label: 'Adicionar como amigo' },
                { action: 'profile' as const, icon: <UserCircle size={18} />, label: 'Solicitar ver perfil' },
                { action: 'chat' as const,    icon: <MessageCircle size={18} />, label: 'Solicitar chat privado' },
                { action: 'mute' as const,    icon: <VolumeX size={18} />, label: blocked.has(selected.user_id) ? 'Desbloquear mensagens' : 'Silenciar na sala' },
                { action: 'block' as const,   icon: <Ban size={18} />, label: 'Bloquear permanentemente', danger: true },
              ].map(opt => (
                <button
                  key={opt.action}
                  onClick={() => { onAction(selected, opt.action); setSelected(null); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                    borderRadius: 12, border: '1px solid var(--border)',
                    backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                    color: (opt as { danger?: boolean }).danger ? '#f87171' : 'var(--text)',
                    fontFamily: 'var(--font-jakarta)', fontSize: 14,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { UserCircle } from 'lucide-react'
import Link from 'next/link'
import { PublicProfile } from './helpers'

export function ProfileModal({ profile, onClose }: { profile: PublicProfile; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 70,
        backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', padding: '20px 20px 40px',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          {profile.photo_best ? (
            <img src={profile.photo_best} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--border)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCircle size={36} color="var(--muted)" />
            </div>
          )}
          <div>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>{profile.name}</p>
            {profile.city && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>{profile.city}</p>}
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio}</p>
        )}
        <Link
          href={`/perfil/${profile.id}`}
          style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Ver perfil completo
        </Link>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
          Fechar
        </button>
      </div>
    </>
  )
}

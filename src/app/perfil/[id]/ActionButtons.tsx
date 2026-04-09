'use client'

import { Pencil, X, Star, Heart } from 'lucide-react'

interface ActionButtonsProps {
  isOwnProfile: boolean
  onEditProfile: () => void
  onSwipe: (action: 'like' | 'dislike' | 'superlike') => void
}

export function DesktopActions({ isOwnProfile, onEditProfile, onSwipe }: ActionButtonsProps) {
  return (
    <div className="perfil-desktop-actions" style={{ gap: '12px', marginBottom: '24px' }}>
      {isOwnProfile ? (
        <button
          onClick={onEditProfile}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '100px',
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: '14px',
            boxShadow: '0 6px 20px rgba(225,29,72,0.30)',
          }}
        >
          <Pencil size={16} strokeWidth={1.5} />
          Editar perfil
        </button>
      ) : (
        <>
          <button onClick={() => onSwipe('dislike')} style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#292a2f', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            <X size={22} color="rgba(248,249,250,0.75)" strokeWidth={1.5} />
          </button>
          <button onClick={() => onSwipe('superlike')} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
            <Star size={18} color="#fff" strokeWidth={2} />
          </button>
          <button onClick={() => onSwipe('like')} style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(225,29,72,0.35)' }}>
            <Heart size={22} color="#fff" strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}

export function MobileActionBar({ isOwnProfile, onEditProfile, onSwipe }: ActionButtonsProps) {
  return (
    <div className="perfil-action-bar-fixed" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,17,23,0.72)', backdropFilter: 'blur(20px) saturate(1.4)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px 28px 20px', alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 30 }}>
      {isOwnProfile ? (
        <button
          onClick={onEditProfile}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 36px', borderRadius: '100px',
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: '15px',
            boxShadow: '0 8px 28px rgba(225,29,72,0.35)',
          }}
        >
          <Pencil size={18} strokeWidth={1.5} />
          Editar perfil
        </button>
      ) : (
        <>
          <button onClick={() => onSwipe('dislike')} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#292a2f', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <X size={26} color="rgba(248,249,250,0.75)" strokeWidth={1.5} />
          </button>
          <button onClick={() => onSwipe('superlike')} style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 4px 20px rgba(245,158,11,0.30)' }}>
            <Star size={22} color="#fff" strokeWidth={2} />
          </button>
          <button onClick={() => onSwipe('like')} style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 6px 28px rgba(225,29,72,0.42)' }}>
            <Heart size={28} color="#fff" strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}

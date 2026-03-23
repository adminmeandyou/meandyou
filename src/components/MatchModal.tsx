'use client'

import Image from 'next/image'
import { MessageCircle, Heart, X, UserPlus, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MatchModalProps {
  matchId: string
  myPhoto: string | null
  otherPhoto: string | null
  otherName: string
  onClose: () => void
  onStartChat: () => void
  onAddFriend?: () => Promise<void>
}

export function MatchModal({ myPhoto, otherPhoto, otherName, onClose, onStartChat, onAddFriend }: MatchModalProps) {
  const [friendSent, setFriendSent] = useState(false)
  const [friendLoading, setFriendLoading] = useState(false)

  async function handleAddFriend() {
    if (!onAddFriend || friendSent || friendLoading) return
    setFriendLoading(true)
    try { await onAddFriend(); setFriendSent(true) } catch {}
    setFriendLoading(false)
  }
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    if (navigator.vibrate) navigator.vibrate([80, 40, 160])
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      <style>{`
        @keyframes match-slide-left {
          from { transform: translateX(-80px) scale(0.8); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes match-slide-right {
          from { transform: translateX(80px) scale(0.8); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes match-pop {
          0%  { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100%{ transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes match-rise {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes match-particle {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--px), var(--py)) scale(0); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
          background: 'radial-gradient(ellipse at center top, rgba(225,29,72,0.22) 0%, #08090E 60%)',
        }}
      >
        {/* Partículas decorativas */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * 360
            const dist = 80 + Math.random() * 140
            const px = Math.cos((angle * Math.PI) / 180) * dist
            const py = Math.sin((angle * Math.PI) / 180) * dist - 80
            const size = 4 + Math.random() * 6
            const colors = ['#E11D48', '#F43F5E', '#fff', '#F59E0B', '#fff']
            const color = colors[i % colors.length]
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: size, height: size,
                  borderRadius: '50%',
                  backgroundColor: color,
                  ['--px' as string]: `${px}px`,
                  ['--py' as string]: `${py}px`,
                  animation: `match-particle ${0.8 + Math.random() * 0.6}s ease-out ${0.3 + i * 0.04}s both`,
                }}
              />
            )
          })}
        </div>

        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} color="rgba(248,249,250,0.5)" />
        </button>

        {/* Fotos */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {/* Minha foto */}
          <div
            style={{
              width: 112, height: 112, borderRadius: '50%',
              overflow: 'hidden', border: '3px solid #08090E',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              position: 'relative', zIndex: 1,
              transform: 'translateX(20px)',
              animation: 'match-slide-left 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}
          >
            {myPhoto ? (
              <Image src={myPhoto} alt="Você" fill className="object-cover" sizes="112px" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 36, fontFamily: 'var(--font-fraunces)' }}>?</span>
              </div>
            )}
          </div>

          {/* Coração */}
          <div
            style={{
              position: 'relative', zIndex: 3,
              width: 44, height: 44, borderRadius: '50%',
              background: '#E11D48',
              boxShadow: '0 4px 20px rgba(225,29,72,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'match-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both',
            }}
          >
            <Heart size={20} fill="#fff" color="#fff" />
          </div>

          {/* Foto do outro */}
          <div
            style={{
              width: 112, height: 112, borderRadius: '50%',
              overflow: 'hidden', border: '3px solid #08090E',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              position: 'relative', zIndex: 1,
              transform: 'translateX(-20px)',
              animation: 'match-slide-right 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}
          >
            {otherPhoto ? (
              <Image src={otherPhoto} alt={otherName} fill className="object-cover" sizes="112px" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 36, fontFamily: 'var(--font-fraunces)' }}>{otherName[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Texto */}
        <div style={{ textAlign: 'center', animation: 'match-rise 0.5s ease 0.65s both' }}>
          <h2 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 38, fontWeight: 700,
            color: '#fff', margin: '0 0 8px',
            letterSpacing: '-0.5px',
          }}>
            Deu Match!
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 4px', fontFamily: 'var(--font-jakarta)' }}>
            Você e <strong style={{ color: '#fff' }}>{otherName}</strong> se curtiram
          </p>
          <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: 13, fontFamily: 'var(--font-jakarta)' }}>
            Inicie a conversa antes que o match expire
          </p>
        </div>

        {/* CTAs */}
        <div style={{
          width: '100%', maxWidth: 320,
          display: 'flex', flexDirection: 'column', gap: 12,
          marginTop: 36,
          animation: 'match-rise 0.5s ease 0.8s both',
        }}>
          <button
            onClick={onStartChat}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 24px', borderRadius: 14,
              background: '#E11D48',
              border: 'none', cursor: 'pointer',
              color: '#fff', fontFamily: 'var(--font-jakarta)',
              fontSize: 16, fontWeight: 700,
              boxShadow: '0 8px 32px rgba(225,29,72,0.45)',
            }}
          >
            <MessageCircle size={18} />
            Enviar mensagem
          </button>
          {onAddFriend && (
            <button
              onClick={handleAddFriend}
              disabled={friendSent || friendLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '13px 24px', borderRadius: 14,
                background: friendSent ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${friendSent ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.10)'}`,
                cursor: friendSent ? 'default' : 'pointer',
                color: friendSent ? '#10b981' : 'rgba(248,249,250,0.70)',
                fontFamily: 'var(--font-jakarta)', fontSize: 15,
              }}
            >
              {friendSent ? <Check size={16} /> : <UserPlus size={16} />}
              {friendSent ? 'Pedido enviado' : 'Adicionar como amigo'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '14px 24px', borderRadius: 14,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.10)',
              cursor: 'pointer',
              color: 'rgba(248,249,250,0.50)',
              fontFamily: 'var(--font-jakarta)',
              fontSize: 15,
            }}
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </>
  )
}

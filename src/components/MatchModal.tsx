'use client'

import Image from 'next/image'
import { MessageCircle, Heart, X, UserPlus, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { playSoundDirect } from '@/hooks/useSounds'

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
    playSoundDirect('match')
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      <style>{`
        @keyframes match-slide-left {
          from { transform: translateX(-60px) rotate(-4deg) scale(0.72); opacity: 0; }
          to   { transform: translateX(20px) rotate(-4deg) scale(1); opacity: 1; }
        }
        @keyframes match-slide-right {
          from { transform: translateX(60px) rotate(4deg) scale(0.72); opacity: 0; }
          to   { transform: translateX(-20px) rotate(4deg) scale(1); opacity: 1; }
        }
        @keyframes match-pop {
          0%  { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.18) rotate(5deg); opacity: 1; }
          100%{ transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes match-rise {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes match-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
          background: 'rgba(8,9,14,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
      >
        {/* Atmosfera de fundo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #0d0e13 0%, #08090E 60%, #08090E 100%)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'rgba(225,29,72,0.05)',
          filter: 'blur(120px)',
          zIndex: 0,
        }} />

        {/* Texto decorativo ME&YOU */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.04, pointerEvents: 'none', userSelect: 'none',
          whiteSpace: 'nowrap', zIndex: 1,
        }}>
          <span style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 110, fontWeight: 900,
            fontStyle: 'italic',
            color: '#F8F9FA',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}>
            ME&amp;YOU
          </span>
        </div>

        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <X size={16} color="rgba(248,249,250,0.4)" strokeWidth={1.5} />
        </button>

        {/* Título */}
        <div style={{
          textAlign: 'center', marginBottom: 48, zIndex: 2,
          animation: 'match-rise 0.5s ease 0.1s both',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 44, fontWeight: 900,
            fontStyle: 'italic',
            color: '#F8F9FA',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
            textShadow: '0 0 20px rgba(225,29,72,0.4)',
          }}>
            É um match!
          </h2>
          <p style={{
            color: 'rgba(248,249,250,0.5)',
            fontSize: 15, margin: 0,
            fontFamily: 'var(--font-jakarta)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            Vocês dois curtiram um ao outro. Que tal começar com um oi?
          </p>
        </div>

        {/* Composição de fotos */}
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 52, zIndex: 2,
        }}>
          {/* Minha foto */}
          <div
            style={{
              width: 140, height: 140, borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid rgba(8,9,14,0.9)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
              position: 'relative', zIndex: 1,
              animation: 'match-slide-left 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
            }}
          >
            {myPhoto ? (
              <Image src={myPhoto} alt="Você" fill className="object-cover" sizes="160px" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1e1f25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(248,249,250,0.4)', fontSize: 48, fontFamily: 'var(--font-fraunces)' }}>?</span>
              </div>
            )}
          </div>

          {/* Coração central */}
          <div
            style={{
              position: 'relative', zIndex: 3,
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
              boxShadow: '0 0 0 4px rgba(8,9,14,0.95), 0 0 30px 8px rgba(225,29,72,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'match-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.65s both',
            }}
          >
            <Heart size={24} fill="#fff" color="#fff" />
          </div>

          {/* Foto do outro */}
          <div
            style={{
              width: 140, height: 140, borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid rgba(8,9,14,0.9)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
              position: 'relative', zIndex: 1,
              animation: 'match-slide-right 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
            }}
          >
            {otherPhoto ? (
              <Image src={otherPhoto} alt={otherName} fill className="object-cover" sizes="160px" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1e1f25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(248,249,250,0.4)', fontSize: 48, fontFamily: 'var(--font-fraunces)' }}>{otherName[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          width: '100%', maxWidth: 320,
          display: 'flex', flexDirection: 'column', gap: 12,
          zIndex: 2,
          animation: 'match-rise 0.5s ease 0.75s both',
        }}>
          <button
            onClick={onStartChat}
            style={{
              width: '100%',
              padding: '16px 24px', borderRadius: 9999,
              background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
              border: 'none', cursor: 'pointer',
              color: '#fff', fontFamily: 'var(--font-jakarta)',
              fontSize: 16, fontWeight: 700,
              letterSpacing: '0.02em',
              boxShadow: '0 4px 25px rgba(225,29,72,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <MessageCircle size={18} strokeWidth={1.5} />
            Enviar mensagem
          </button>

          {onAddFriend && (
            <button
              onClick={handleAddFriend}
              disabled={friendSent || friendLoading}
              style={{
                width: '100%',
                padding: '14px 24px', borderRadius: 9999,
                background: friendSent ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${friendSent ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                cursor: friendSent ? 'default' : 'pointer',
                color: friendSent ? '#10b981' : 'rgba(248,249,250,0.65)',
                fontFamily: 'var(--font-jakarta)', fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {friendSent ? <Check size={16} strokeWidth={1.5} /> : <UserPlus size={16} strokeWidth={1.5} />}
              {friendSent ? 'Pedido enviado' : 'Adicionar como amigo'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 24px', borderRadius: 9999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
              color: 'rgba(248,249,250,0.55)',
              fontFamily: 'var(--font-jakarta)',
              fontSize: 15, fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </>
  )
}

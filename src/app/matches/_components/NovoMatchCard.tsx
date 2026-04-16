'use client'

import { useState } from 'react'
import Image from 'next/image'
import { UserPlus, Check } from 'lucide-react'
import { Match, getExpiryInfo } from './helpers'

export function NovoMatchCard({
  match,
  userId,
  onIniciarConversa,
  formatTempo,
}: {
  match: Match
  userId: string | null
  onIniciarConversa: () => void
  formatTempo: (d: string | null) => string
}) {
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at, match.is_friend)
  const [friendSent, setFriendSent] = useState(false)

  async function handleAddFriend(e: React.MouseEvent) {
    e.stopPropagation()
    if (friendSent || !userId) return
    setFriendSent(true)
    try {
      await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: match.other_user_id }),
      })
    } catch {
      setFriendSent(false)
    }
  }

  return (
    <div
      onClick={onIniciarConversa}
      style={{
        scrollSnapAlign: 'start', flexShrink: 0, width: 80,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          border: '2px solid #E11D48',
          boxShadow: '0 0 0 3px rgba(225,29,72,0.12), 0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="72px" draggable={false} style={{ pointerEvents: 'none' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1a0a14 0%, #3d1530 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(248,249,250,0.7)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>
                {match.name[0]}
              </span>
            </div>
          )}
        </div>

        {!match.is_friend && (
        <button
          onClick={handleAddFriend}
          style={{
            position: 'absolute', bottom: 0, right: -2,
            width: 22, height: 22, borderRadius: '50%',
            background: friendSent ? '#10b981' : 'rgba(15,17,23,0.95)',
            border: `2px solid #08090E`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: friendSent ? 'default' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {friendSent
            ? <Check size={11} color="#fff" strokeWidth={2.5} />
            : <UserPlus size={11} color="rgba(248,249,250,0.7)" strokeWidth={2} />
          }
        </button>
        )}

        {match.is_friend && (
          <span style={{
            position: 'absolute', top: -3, left: -3,
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 100,
            background: '#10b981',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(16,185,129,0.30)',
          }}>
            Amigo
          </span>
        )}

        {!match.is_friend && expiry && (
          <span style={{
            position: 'absolute', top: -3, left: -3,
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 100,
            background: expiry.urgent ? '#E11D48' : 'rgba(225,29,72,0.80)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(225,29,72,0.30)',
          }}>
            {expiry.label}
          </span>
        )}
      </div>

      <p style={{
        fontSize: 12, fontWeight: 600,
        color: 'rgba(248,249,250,0.85)',
        margin: 0,
        maxWidth: 76,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
        fontFamily: 'var(--font-fraunces)',
      }}>
        {match.name}
      </p>
    </div>
  )
}

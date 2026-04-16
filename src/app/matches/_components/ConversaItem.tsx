'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { playSoundDirect } from '@/hooks/useSounds'
import { Match, getExpiryInfo } from './helpers'

export function ConversaItem({ match, formatTempo, onLongPress }: { match: Match; formatTempo: (d: string | null) => string; onLongPress: (m: Match) => void }) {
  const router = useRouter()
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at, match.is_friend)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  function startPress() {
    triggered.current = false
    pressTimer.current = setTimeout(() => {
      triggered.current = true
      onLongPress(match)
    }, 500)
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }
  function handleClick() {
    if (triggered.current) return
    playSoundDirect('tap')
    router.push(`/conversas/${match.match_id}`)
  }

  return (
    <div
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); triggered.current = true; onLongPress(match) }}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(15,17,23,0.60)',
        border: '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
        transition: 'background 0.15s ease',
        cursor: 'pointer', userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #13161F 0%, #0F1117 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="56px" draggable={false} style={{ pointerEvents: 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>
                {match.name[0]}
              </span>
            </div>
          )}
        </div>
        {match.unread_count === 0 && (
          <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
            <OnlineIndicator
              lastActiveAt={match.last_active_at}
              showLastActive={match.show_last_active ?? false}
              mode="dot"
              size={12}
            />
          </div>
        )}
        {match.unread_count > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 100,
            background: '#E11D48', border: '2px solid #08090E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            boxShadow: '0 2px 8px rgba(225,29,72,0.40)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {match.unread_count > 9 ? '9+' : match.unread_count}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 15,
              fontWeight: match.unread_count > 0 ? 700 : 600,
              color: match.unread_count > 0 ? '#F8F9FA' : 'rgba(248,249,250,0.80)',
              margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {match.name}
            </p>
            {match.is_friend && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                Amigo
              </span>
            )}
            {!match.is_friend && expiry && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: expiry.urgent ? 'rgba(225,29,72,0.15)' : 'rgba(225,29,72,0.08)',
                color: expiry.urgent ? '#F43F5E' : '#E11D48',
                border: `1px solid ${expiry.urgent ? 'rgba(225,29,72,0.30)' : 'rgba(225,29,72,0.15)'}`,
              }}>
                {expiry.label}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11,
            color: 'rgba(248,249,250,0.25)',
            flexShrink: 0, marginLeft: 8,
          }}>
            {formatTempo(match.last_message_at || match.matched_at)}
          </span>
        </div>
        <p style={{
          fontSize: 13, margin: 0,
          color: match.unread_count > 0 ? 'rgba(248,249,250,0.60)' : 'rgba(248,249,250,0.30)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {(() => {
            const msg = match.last_message
            if (!msg) return 'Iniciar conversa...'
            if (msg === '__NUDGE__') return 'Chamou sua atenção'
            if (msg.startsWith('__CONVITE__:')) return 'Convite de encontro'
            if (msg.startsWith('__MEETING__:')) return 'Convite de encontro'
            return msg
          })()}
        </p>
      </div>
    </div>
  )
}

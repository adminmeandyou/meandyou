'use client'

import { useState } from 'react'
import { SkeletonLoader } from './SkeletonLoader'

interface MatchCardProps {
  name: string
  photo?: string
  online?: boolean
  unreadCount?: number
  loading?: boolean
  onClick?: () => void
  active?: boolean
}

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(160deg,#1a0a14 0%,#3d1530 100%)',
  'linear-gradient(160deg,#0a1020 0%,#1a2a4a 100%)',
  'linear-gradient(160deg,#0d1810 0%,#1a3a20 100%)',
]

export function MatchCard({
  name,
  photo,
  online = false,
  unreadCount = 0,
  loading = false,
  onClick,
  active = false,
}: MatchCardProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const placeholderGrad = PLACEHOLDER_GRADIENTS[name.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length]

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <SkeletonLoader variant="avatar" width={62} />
        <SkeletonLoader variant="text" width={50} height={11} />
      </div>
    )
  }

  const bg = pressed ? 'rgba(255,255,255,0.06)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        padding: '8px 6px',
        background: bg,
        border: 'none',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all 0.15s',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        outline: 'none',
        minWidth: 68,
      }}
    >
      {/* Avatar container */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            overflow: 'hidden',
            background: photo ? undefined : placeholderGrad,
            border: active
              ? '2.5px solid var(--accent)'
              : unreadCount > 0
              ? '2.5px solid var(--accent)'
              : '2.5px solid var(--border)',
            transition: 'border-color 0.15s',
            flexShrink: 0,
          }}
        >
          {photo && (
            <img
              src={photo}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
            />
          )}
        </div>

        {/* Online indicator */}
        {online && (
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid var(--bg)',
            }}
          />
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 18,
              height: 18,
              borderRadius: 100,
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-jakarta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        style={{
          fontSize: 12,
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--accent)' : 'var(--text)',
          fontFamily: 'var(--font-jakarta)',
          maxWidth: 68,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.15s',
        }}
      >
        {name}
      </span>
    </button>
  )
}

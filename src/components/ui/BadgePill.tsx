'use client'

import { useState } from 'react'

type Rarity = 'comum' | 'incomum' | 'raro' | 'lendario'

interface BadgePillProps {
  rarity: Rarity
  label?: string
  disabled?: boolean
  onClick?: () => void
}

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  comum: {
    label: 'Comum',
    color: 'rgba(248,249,250,0.55)',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.10)',
  },
  incomum: {
    label: 'Incomum',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.22)',
  },
  raro: {
    label: 'Raro',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.22)',
  },
  lendario: {
    label: 'Lendário',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
  },
}

export function BadgePill({ rarity, label, disabled = false, onClick }: BadgePillProps) {
  const [hovered, setHovered] = useState(false)
  const { label: defaultLabel, color, bg, border } = RARITY_CONFIG[rarity]
  const isClickable = !!onClick && !disabled

  return (
    <span
      role={isClickable ? 'button' : undefined}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-jakarta)',
        letterSpacing: '0.02em',
        color,
        backgroundColor: hovered ? border : bg,
        border: `1px solid ${border}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {rarity === 'lendario' && (
        <span style={{ fontSize: 10 }}>&#9733;</span>
      )}
      {label ?? defaultLabel}
    </span>
  )
}

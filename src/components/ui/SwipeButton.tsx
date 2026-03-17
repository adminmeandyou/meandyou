'use client'

import { ReactNode, useState } from 'react'

interface SwipeButtonProps {
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'danger' | 'primary' | 'gold' | 'info'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const VARIANT_STYLES = {
  default: {
    bg: 'var(--bg-card)',
    bgHover: 'var(--bg-card2)',
    bgActive: 'rgba(255,255,255,0.12)',
    color: 'var(--text)',
    border: '1.5px solid var(--border)',
    shadow: '0 4px 20px rgba(0,0,0,0.35)',
    shadowHover: '0 8px 28px rgba(0,0,0,0.5)',
  },
  danger: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(225,29,72,0.12)',
    bgActive: 'rgba(225,29,72,0.20)',
    color: '#E11D48',
    border: '1.5px solid rgba(225,29,72,0.25)',
    shadow: '0 4px 20px rgba(225,29,72,0.15)',
    shadowHover: '0 8px 28px rgba(225,29,72,0.35)',
  },
  primary: {
    bg: 'var(--accent)',
    bgHover: 'var(--accent-dark)',
    bgActive: '#9f1239',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 20px rgba(225,29,72,0.35)',
    shadowHover: '0 8px 28px rgba(225,29,72,0.55)',
  },
  gold: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(245,158,11,0.12)',
    bgActive: 'rgba(245,158,11,0.20)',
    color: '#F59E0B',
    border: '1.5px solid rgba(245,158,11,0.25)',
    shadow: '0 4px 20px rgba(245,158,11,0.15)',
    shadowHover: '0 8px 28px rgba(245,158,11,0.35)',
  },
  info: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(96,165,250,0.10)',
    bgActive: 'rgba(96,165,250,0.18)',
    color: '#60a5fa',
    border: '1.5px solid rgba(96,165,250,0.20)',
    shadow: '0 4px 20px rgba(0,0,0,0.25)',
    shadowHover: '0 8px 28px rgba(96,165,250,0.25)',
  },
}

export function SwipeButton({
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'md',
  label,
}: SwipeButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isInteractive = !disabled && !loading
  const dim = size === 'sm' ? 44 : size === 'lg' ? 68 : 56
  const vs = VARIANT_STYLES[variant]

  const bg = pressed && isInteractive ? vs.bgActive : hovered && isInteractive ? vs.bgHover : vs.bg
  const shadow = hovered && isInteractive ? vs.shadowHover : vs.shadow

  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={disabled || loading}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => isInteractive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: vs.border,
        backgroundColor: bg,
        color: disabled ? 'rgba(248,249,250,0.3)' : vs.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : shadow,
        transition: 'all 0.18s',
        transform: pressed && isInteractive ? 'scale(0.9)' : 'scale(1)',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {loading ? (
        <span
          className="ui-spinner"
          style={{ width: dim * 0.36, height: dim * 0.36, color: vs.color }}
        />
      ) : (
        icon
      )}
    </button>
  )
}

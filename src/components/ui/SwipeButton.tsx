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
    border: '1.5px solid rgba(255,255,255,0.08)',
    shadow: '0 2px 8px rgba(0,0,0,0.25), 0 4px 20px rgba(0,0,0,0.3)',
    shadowHover: '0 4px 12px rgba(0,0,0,0.3), 0 8px 28px rgba(0,0,0,0.4)',
  },
  danger: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(225,29,72,0.12)',
    bgActive: 'rgba(225,29,72,0.20)',
    color: '#E11D48',
    border: '1.5px solid rgba(225,29,72,0.20)',
    shadow: '0 2px 8px rgba(225,29,72,0.1), 0 4px 20px rgba(225,29,72,0.12)',
    shadowHover: '0 4px 12px rgba(225,29,72,0.2), 0 8px 28px rgba(225,29,72,0.3), 0 0 40px rgba(225,29,72,0.08)',
  },
  primary: {
    bg: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
    bgHover: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
    bgActive: '#9f1239',
    color: '#fff',
    border: 'none',
    shadow: '0 2px 8px rgba(225,29,72,0.2), 0 4px 20px rgba(225,29,72,0.3)',
    shadowHover: '0 4px 12px rgba(225,29,72,0.35), 0 8px 28px rgba(225,29,72,0.45), 0 0 50px rgba(225,29,72,0.12)',
  },
  gold: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(245,158,11,0.12)',
    bgActive: 'rgba(245,158,11,0.20)',
    color: '#F59E0B',
    border: '1.5px solid rgba(245,158,11,0.20)',
    shadow: '0 2px 8px rgba(245,158,11,0.1), 0 4px 20px rgba(245,158,11,0.12)',
    shadowHover: '0 4px 12px rgba(245,158,11,0.2), 0 8px 28px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.08)',
  },
  info: {
    bg: 'var(--bg-card)',
    bgHover: 'rgba(96,165,250,0.10)',
    bgActive: 'rgba(96,165,250,0.18)',
    color: '#60a5fa',
    border: '1.5px solid rgba(96,165,250,0.18)',
    shadow: '0 2px 8px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.25)',
    shadowHover: '0 4px 12px rgba(96,165,250,0.15), 0 8px 28px rgba(96,165,250,0.22), 0 0 40px rgba(96,165,250,0.06)',
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
  const isGradientBg = bg.startsWith('linear-gradient')

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
        ...(isGradientBg ? { background: bg } : { backgroundColor: bg }),
        color: disabled ? 'rgba(248,249,250,0.3)' : vs.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : shadow,
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
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

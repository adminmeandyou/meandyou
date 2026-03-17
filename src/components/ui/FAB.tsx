'use client'

import { ReactNode, useState } from 'react'

interface FABProps {
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'surface'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function FAB({
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  label,
}: FABProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isInteractive = !disabled && !loading

  const dim = size === 'sm' ? 40 : size === 'lg' ? 64 : 52

  const bg =
    variant === 'primary'
      ? pressed && isInteractive
        ? '#be123c'
        : hovered && isInteractive
        ? '#be123c'
        : 'var(--accent)'
      : pressed && isInteractive
      ? 'rgba(255,255,255,0.10)'
      : hovered && isInteractive
      ? 'rgba(255,255,255,0.08)'
      : 'var(--bg-card)'

  const shadow =
    variant === 'primary' && !disabled
      ? hovered
        ? '0 8px 28px rgba(225,29,72,0.55)'
        : '0 4px 20px rgba(225,29,72,0.35)'
      : '0 4px 20px rgba(0,0,0,0.35)'

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
        border: variant === 'surface' ? '1px solid var(--border)' : 'none',
        backgroundColor: bg,
        color: variant === 'primary' ? '#fff' : 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : shadow,
        transition: 'all 0.18s',
        transform: pressed && isInteractive ? 'scale(0.93)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {loading ? (
        <span
          className="ui-spinner"
          style={{
            width: dim * 0.38,
            height: dim * 0.38,
            color: variant === 'primary' ? '#fff' : 'var(--muted)',
          }}
        />
      ) : (
        icon
      )}
    </button>
  )
}

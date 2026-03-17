'use client'

import { ReactNode, useState } from 'react'

interface PillProps {
  children: ReactNode
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export function Pill({
  children,
  selected = false,
  disabled = false,
  loading = false,
  onClick,
  icon,
  size = 'md',
}: PillProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isInteractive = !disabled && !loading

  const bg = selected
    ? 'rgba(225,29,72,0.12)'
    : pressed && isInteractive
    ? 'rgba(225,29,72,0.10)'
    : hovered && isInteractive
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(255,255,255,0.04)'

  const borderColor = selected
    ? 'rgba(225,29,72,0.35)'
    : hovered && isInteractive
    ? 'rgba(255,255,255,0.14)'
    : 'rgba(255,255,255,0.07)'

  const color = selected
    ? '#E11D48'
    : disabled
    ? 'rgba(248,249,250,0.25)'
    : 'rgba(248,249,250,0.65)'

  const padding = size === 'sm' ? '5px 12px' : '7px 16px'
  const fontSize = size === 'sm' ? 13 : 14

  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => isInteractive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        borderRadius: 100,
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bg,
        color,
        fontSize,
        fontWeight: 500,
        fontFamily: 'var(--font-jakarta)',
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        transition: 'all 0.15s',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
        outline: 'none',
      }}
    >
      {loading ? (
        <span
          className="ui-spinner"
          style={{ width: 12, height: 12, borderWidth: 1.5 }}
        />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

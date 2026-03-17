'use client'

import { useState } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md'
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  loading = false,
  label,
  description,
  size = 'md',
}: ToggleSwitchProps) {
  const [hovered, setHovered] = useState(false)

  const isInteractive = !disabled && !loading
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 20 : 24
  const thumbSize = size === 'sm' ? 14 : 18
  const thumbOffset = (h - thumbSize) / 2

  const trackBg = checked
    ? disabled
      ? 'rgba(225,29,72,0.35)'
      : 'var(--accent)'
    : hovered && isInteractive
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.08)'

  const thumbX = checked ? w - thumbSize - thumbOffset : thumbOffset

  const handleClick = () => {
    if (isInteractive) onChange(!checked)
  }

  const switchEl = (
    <button
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || loading}
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: 100,
        backgroundColor: trackBg,
        border: 'none',
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <span
          className="ui-spinner"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: thumbSize,
            height: thumbSize,
            borderWidth: 1.5,
            color: 'rgba(248,249,250,0.6)',
          }}
        />
      ) : (
        <span
          style={{
            position: 'absolute',
            top: thumbOffset,
            left: thumbX,
            width: thumbSize,
            height: thumbSize,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }}
        />
      )}
    </button>
  )

  if (!label) return switchEl

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        cursor: isInteractive ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-jakarta)' }}>
            {description}
          </div>
        )}
      </div>
      {switchEl}
    </div>
  )
}

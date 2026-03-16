'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  visible: boolean
  onDismiss?: () => void
  duration?: number
  position?: 'top' | 'bottom'
}

const CONFIG = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', Icon: CheckCircle },
  error: { color: '#E11D48', bg: 'rgba(225,29,72,0.12)', border: 'rgba(225,29,72,0.25)', Icon: AlertCircle },
  info: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', Icon: Info },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', Icon: AlertTriangle },
}

export function Toast({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3500,
  position = 'top',
}: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      if (duration > 0 && onDismiss) {
        const t = setTimeout(() => {
          setShow(false)
          setTimeout(onDismiss, 300)
        }, duration)
        return () => clearTimeout(t)
      }
    } else {
      setShow(false)
    }
  }, [visible, duration, onDismiss])

  const { color, bg, border, Icon } = CONFIG[type]

  return (
    <div
      style={{
        position: 'fixed',
        ...(position === 'top' ? { top: 16 } : { bottom: 100 }),
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? 0 : position === 'top' ? -16 : 16}px)`,
        zIndex: 2000,
        opacity: show ? 1 : 0,
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: show ? 'all' : 'none',
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 12,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          color,
          fontFamily: 'var(--font-jakarta)',
        }}
      >
        <Icon size={18} strokeWidth={1.5} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
          {message}
        </span>
        {onDismiss && (
          <button
            onClick={() => { setShow(false); setTimeout(onDismiss, 300) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 0 0 4px',
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: isOpen ? 'all' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s',
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          minHeight: '40%',
          maxHeight: '85vh',
          overflowY: 'auto',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px 8px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: 'var(--font-jakarta)',
              }}
            >
              {title}
            </span>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '16px 20px 32px' }}>{children}</div>
      </div>
    </div>,
    document.body
  )
}

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  maxWidth?: number
}

export function Modal({ isOpen, onClose, children, title, maxWidth = 480 }: ModalProps) {
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        pointerEvents: isOpen ? 'all' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          transition: 'opacity 0.2s',
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
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
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>,
    document.body
  )
}

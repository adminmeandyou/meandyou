'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  const success = useCallback((msg: string) => show(msg, 'success'), [show])
  const error   = useCallback((msg: string) => show(msg, 'error'),   [show])
  const info    = useCallback((msg: string) => show(msg, 'info'),    [show])

  const bg: Record<ToastType, string> = {
    success: 'rgba(34,197,94,0.95)',
    error:   'rgba(225,29,72,0.95)',
    info:    'rgba(30,30,40,0.95)',
  }
  const icon: Record<ToastType, string> = {
    success: '✓', error: '✕', info: 'ℹ',
  }

  return (
    <ToastCtx.Provider value={{ show, success, error, info }}>
      {children}
      <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', pointerEvents: 'none', width: '100%', maxWidth: '360px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            backgroundColor: bg[t.type], color: '#fff', padding: '12px 18px',
            borderRadius: '100px', fontSize: '14px', fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
            gap: '8px', fontFamily: 'var(--font-jakarta)', backdropFilter: 'blur(8px)',
            animation: 'toast-in 0.25s ease-out',
          }}>
            <span style={{ fontWeight: 700 }}>{icon[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

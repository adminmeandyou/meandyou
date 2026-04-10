'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, Settings, ArrowLeft } from 'lucide-react'

interface AppHeaderProps {
  modeSelector?: React.ReactNode
  rightActions?: React.ReactNode
  leftAction?: React.ReactNode
  backHref?: string | null
  pageTitle?: string | null
}

export function AppHeader({ modeSelector, rightActions, leftAction, backHref, pageTitle }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifHovered, setNotifHovered] = useState(false)
  const [shieldHovered, setShieldHovered] = useState(false)

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8,9,14,0.85)',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Esquerda: leftAction, back button ou logo */}
      {leftAction ? (
        <div style={{ flexShrink: 0 }}>{leftAction}</div>
      ) : backHref ? (
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          aria-label="Voltar"
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
      ) : (
        <Link
          href="/modos"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </Link>
      )}

      {/* Centro: modeSelector, pageTitle ou vazio */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
        {modeSelector ?? (backHref && pageTitle ? (
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {pageTitle}
          </span>
        ) : null)}
      </div>

      {/* Ícones à direita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {rightActions}
        <Link
          href="/notificacoes"
          onMouseEnter={() => setNotifHovered(true)}
          onMouseLeave={() => setNotifHovered(false)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: notifHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: pathname === '/notificacoes' ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
            textDecoration: 'none', position: 'relative',
          }}
          aria-label="Notificações"
        >
          <Bell size={20} strokeWidth={1.5} />
        </Link>

        <Link
          href="/configuracoes"
          onMouseEnter={() => setShieldHovered(true)}
          onMouseLeave={() => setShieldHovered(false)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: shieldHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: pathname.startsWith('/configuracoes') ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}
          aria-label="Configurações e Segurança"
        >
          <Settings size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  )
}

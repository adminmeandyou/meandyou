'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, Shield, ArrowLeft } from 'lucide-react'

interface AppHeaderProps {
  modeSelector?: React.ReactNode
  backHref?: string | null
  pageTitle?: string | null
}

export function AppHeader({ modeSelector, backHref, pageTitle }: AppHeaderProps) {
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
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Esquerda: back button ou logo */}
      {backHref ? (
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Voltar"
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
      ) : (
        <Link
          href="/dashboard"
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
          aria-label="Notificacoes"
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
          aria-label="Configuracoes e Seguranca"
        >
          <Shield size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  )
}

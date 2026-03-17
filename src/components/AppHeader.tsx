'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Bell, Shield } from 'lucide-react'

interface AppHeaderProps {
  /** Slot reservado para o seletor de modos — será preenchido na Fase 4 */
  modeSelector?: React.ReactNode
}

export function AppHeader({ modeSelector }: AppHeaderProps) {
  const pathname = usePathname()
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
      {/* Logo */}
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

      {/* Seletor de modos — reservado para Fase 4 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
        {modeSelector ?? null}
      </div>

      {/* Ícones à direita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Notificações */}
        <Link
          href="/notificacoes"
          onMouseEnter={() => setNotifHovered(true)}
          onMouseLeave={() => setNotifHovered(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: notifHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: pathname === '/notificacoes' ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
            textDecoration: 'none',
            position: 'relative',
          }}
          aria-label="Notificações"
        >
          <Bell size={20} strokeWidth={1.5} />
        </Link>

        {/* Segurança / Configurações */}
        <Link
          href="/configuracoes"
          onMouseEnter={() => setShieldHovered(true)}
          onMouseLeave={() => setShieldHovered(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: shieldHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: pathname.startsWith('/configuracoes') ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}
          aria-label="Configurações e Segurança"
        >
          <Shield size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  )
}

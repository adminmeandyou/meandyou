'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from './AppHeader'
import { AppBottomNav } from './AppBottomNav'
import { AppSidebar } from './AppSidebar'
import { AppHeaderProvider, useAppHeader } from '@/contexts/AppHeaderContext'

/**
 * Rotas que recebem o shell do app (header + bottom nav + sidebar).
 * Rotas públicas, de auth, onboarding e admin ficam sem o shell.
 */
const SHELL_PREFIXES = [
  '/dashboard',
  '/busca',
  '/match',
  '/matches',
  '/chat',
  '/conversas',
  '/perfil',
  '/configuracoes',
  '/planos',
  '/minha-assinatura',
  '/loja',
  '/destaque',
  '/roleta',
  '/streak',
  '/indicar',
  '/notificacoes',
  '/backstage',
]

function usesShell(pathname: string): boolean {
  return SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

/** Lê o modeSelector do contexto e passa para o AppHeader */
function AppHeaderConnected() {
  const { modeSelector } = useAppHeader()
  return <AppHeader modeSelector={modeSelector} />
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shell = usesShell(pathname)

  // Rotas sem shell: renderiza children diretamente
  if (!shell) return <>{children}</>

  return (
    <AppHeaderProvider>
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(ellipse 140% 70% at 20% -5%, rgba(225,29,72,0.09) 0%, #08090E 55%)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar — visível apenas em md+ */}
        <AppSidebar />

        {/* Coluna central: frame do app */}
        <div
          style={{
            flex: '1 1 0',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 430,
              height: '100vh',
              position: 'relative',
              backgroundColor: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header — visível apenas em mobile (< md) */}
            <div className="block md:hidden">
              <AppHeaderConnected />
            </div>

            {/* Área de conteúdo — scroll interno */}
            <main
              id="app-main-content"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              {children}
            </main>

            {/* Bottom Nav — visível apenas em mobile (< md) */}
            <div className="block md:hidden">
              <AppBottomNav />
            </div>
          </div>
        </div>

        {/* Painel direito — reservado para Chat/Matches em lg+ */}
        <div
          className="hidden lg:flex"
          style={{
            flex: '1 1 0',
            minWidth: 280,
            maxWidth: 400,
            borderLeft: '1px solid var(--border)',
            backgroundColor: 'var(--bg-card)',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Placeholder — será preenchido na Fase 4+ */}
          <span
            style={{
              fontSize: 13,
              color: 'var(--muted-2)',
              fontFamily: 'var(--font-jakarta)',
            }}
          />
        </div>
      </div>
    </AppHeaderProvider>
  )
}

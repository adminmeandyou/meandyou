'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from './AppHeader'
import { AppBottomNav } from './AppBottomNav'
import { AppSidebar } from './AppSidebar'
import { AppHeaderProvider, useAppHeader } from '@/contexts/AppHeaderContext'
import { ToastProvider } from './Toast'

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
  '/emblemas',
]

function usesShell(pathname: string): boolean {
  return SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

/** Lê o modeSelector, backHref e pageTitle do contexto e passa para o AppHeader */
function AppHeaderConnected() {
  const { modeSelector, backHref, pageTitle } = useAppHeader()
  return <AppHeader modeSelector={modeSelector} backHref={backHref} pageTitle={pageTitle} />
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shell = usesShell(pathname)

  // Rotas sem shell: renderiza children diretamente (sem ToastProvider — pages auth têm o próprio)
  if (!shell) return <ToastProvider>{children}</ToastProvider>

  return (
    <ToastProvider>
    <AppHeaderProvider>
      <div className="app-shell-outer">
        {/* Sidebar — visível apenas em md+ */}
        <AppSidebar />

        {/* Coluna central: frame do app + painel direito */}
        <div
          style={{
            flex: '1 1 0',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <div className="app-frame">
            {/* Header — visível apenas em mobile (< md) */}
            <div className="block md:hidden">
              <AppHeaderConnected />
            </div>

            {/* Área de conteúdo — scroll interno no mobile, scroll da janela no desktop */}
            <main
              id="app-main-content"
              className="app-main-content"
            >
              {children}
            </main>

            {/* Bottom Nav — visível apenas em mobile (< md) */}
            <div className="block md:hidden">
              <AppBottomNav />
            </div>
          </div>
        </div>

        {/* Painel direito — visível apenas em 2xl+ para evitar conflito de espaço */}
        <div
          className="hidden 2xl:flex"
          style={{
            width: 280,
            flexShrink: 0,
            flexDirection: 'column',
            padding: '32px 24px',
            gap: 32,
            borderLeft: '1px solid var(--border)',
          }}
        >
          {/* Logo */}
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </Link>

          {/* Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              Conexoes reais com pessoas verificadas. Encontre alguem especial perto de voce.
            </p>
          </div>

          {/* Links rapidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Acesso rapido</p>
            {[
              { href: '/busca',          label: 'Descobrir perfis' },
              { href: '/matches',        label: 'Meus matches' },
              { href: '/streak',         label: 'Prêmios diários' },
              { href: '/loja',           label: 'Loja' },
              { href: '/planos',         label: 'Planos' },
              { href: '/configuracoes',  label: 'Configuracoes' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: 13, color: 'rgba(248,249,250,0.55)',
                  textDecoration: 'none', padding: '7px 10px',
                  borderRadius: 10, transition: 'all 0.15s',
                  display: 'block',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(248,249,250,0.55)' }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Rodape */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { href: '/privacidade', label: 'Privacidade' },
              { href: '/termos',      label: 'Termos de uso' },
              { href: '/ajuda',       label: 'Central de ajuda' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontSize: 11, color: 'var(--muted-2)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppHeaderProvider>
    </ToastProvider>
  )
}

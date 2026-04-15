'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from './AppHeader'
import { AppBottomNav } from './AppBottomNav'
import { AppSidebar } from './AppSidebar'
import { AppHeaderProvider, useAppHeader } from '@/contexts/AppHeaderContext'
import { ToastProvider } from './Toast'
import { PlanGuard } from './PlanGuard'
import { BadgeWatcher } from './BadgeWatcher'
import { LevelUpToast } from './LevelUpToast'
import { AttentionProvider } from './AttentionProvider'

/**
 * Rotas que recebem o shell do app (header + bottom nav + sidebar).
 * Rotas públicas, de auth, onboarding e admin ficam sem o shell.
 */
const SHELL_PREFIXES = [
  '/dashboard', // redirect para /modos
  '/modos',
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
  '/recompensas',
  '/indicar',
  '/notificacoes',
  '/backstage',
  '/emblemas',
  '/curtidas',
  '/amigos',
  '/casal',
]

// Rotas que recebem shell apenas em match exato (sem incluir sub-rotas)
const SHELL_EXACT = ['/salas']

function usesShell(pathname: string): boolean {
  if (SHELL_EXACT.includes(pathname)) return true
  return SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

/** Lê o modeSelector, leftAction, rightActions, backHref e pageTitle do contexto e passa para o AppHeader */
function AppHeaderConnected() {
  const { modeSelector, leftAction, rightActions, backHref, pageTitle } = useAppHeader()
  return <AppHeader modeSelector={modeSelector} leftAction={leftAction} rightActions={rightActions} backHref={backHref} pageTitle={pageTitle} />
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shell = usesShell(pathname)

  // Rotas de chat individual: sem header/nav do shell (a página tem seu próprio chrome full-screen)
  const isFullscreenChat = /^\/conversas\/.+/.test(pathname)

  // Rotas sem shell: renderiza children diretamente (sem ToastProvider — pages auth têm o próprio)
  if (!shell) return <ToastProvider><AttentionProvider>{children}</AttentionProvider></ToastProvider>

  return (
    <ToastProvider>
    <AttentionProvider>
    <BadgeWatcher />
    <LevelUpToast />
    <AppHeaderProvider>
      {/* Grain overlay — textura cinematográfica (pointer-events none, não interfere em nada) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', zIndex: 9998, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
      <div className="app-shell-outer">
        {/* Sidebar — visível apenas em md+ */}
        <AppSidebar />

        {/* Coluna central: frame do app + painel direito */}
        <div
          style={{
            flex: '1 1 0',
            display: 'flex',
            minWidth: 0,
          }}
        >
          <div className="app-frame">
            {/* Header — visível apenas em mobile (< md), escondido no chat individual */}
            {!isFullscreenChat && (
              <div className="block md:hidden">
                <AppHeaderConnected />
              </div>
            )}

            {/* Área de conteúdo — scroll interno no mobile, scroll da janela no desktop */}
            <main
              id="app-main-content"
              className="app-main-content"
            >
              <PlanGuard>{children}</PlanGuard>
            </main>

            {/* Bottom Nav — visível apenas em mobile (< md), escondido no chat individual */}
            {!isFullscreenChat && (
              <div className="block md:hidden">
                <AppBottomNav />
              </div>
            )}
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
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(15,17,23,0.4)',
          }}
        >
          {/* Logo */}
          <Link href="/modos" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </Link>

          {/* Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              Conexões reais com pessoas verificadas. Encontre alguém especial perto de você.
            </p>
          </div>

          {/* Links rapidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Acesso rápido</p>
            {[
              { href: '/modos',          label: 'Descobrir perfis' },
              { href: '/conversas',      label: 'Matches' },
              { href: '/streak',         label: 'Prêmios diários' },
              { href: '/loja',           label: 'Loja' },
              { href: '/planos',         label: 'Planos' },
              { href: '/configuracoes',  label: 'Configurações' },
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
    </AttentionProvider>
    </ToastProvider>
  )
}

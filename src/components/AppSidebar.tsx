'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  MessageCircle, Compass, Zap, ShoppingBag, User,
  Bell, Shield, Settings,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

interface SidebarItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: SidebarItem[] = [
  { href: '/conversas', label: 'Chat',      icon: MessageCircle },
  { href: '/busca',     label: 'Descobrir', icon: Compass },
  { href: '/roleta',    label: 'Salas',     icon: Zap },
  { href: '/loja',      label: 'Loja',      icon: ShoppingBag },
  { href: '/perfil',    label: 'Perfil',    icon: User },
]

const BOTTOM_ITEMS: SidebarItem[] = [
  { href: '/notificacoes',  label: 'Notificações', icon: Bell },
  { href: '/configuracoes', label: 'Segurança',    icon: Shield },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/perfil') return pathname === '/perfil' || pathname.startsWith('/perfil/')
  return pathname === href || pathname.startsWith(href + '/')
}

function SidebarLink({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const [hovered, setHovered] = useState(false)
  const active = isActive(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        backgroundColor: active
          ? 'rgba(225,29,72,0.12)'
          : hovered
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
        color: active ? 'var(--accent)' : hovered ? 'var(--text)' : 'var(--muted)',
        border: active ? '1px solid rgba(225,29,72,0.25)' : '1px solid transparent',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      <Icon size={22} strokeWidth={active ? 2 : 1.5} />
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; Max-Age=0; path=/'
    document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  return (
    <aside
      className="hidden md:flex"
      style={{
        width: 72,
        height: '100vh',
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        title="MeAndYou"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          marginBottom: 28,
          lineHeight: 1,
        }}
      >
        M<span style={{ color: 'var(--accent)' }}>A</span>Y
      </Link>

      {/* Navegação principal */}
      <nav
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Itens inferiores */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}

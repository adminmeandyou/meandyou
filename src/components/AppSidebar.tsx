'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  MessageCircle, Compass, ShoppingBag, User,
  Bell, Shield, Gift,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

interface SidebarItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: SidebarItem[] = [
  { href: '/conversas', label: 'Chat',      icon: MessageCircle },
  { href: '/modos',     label: 'Descobrir', icon: Compass },
  { href: '/recompensas', label: 'Prêmios',   icon: Gift },
  { href: '/loja',        label: 'Loja',     icon: ShoppingBag },
  { href: '/perfil',    label: 'Perfil',    icon: User },
]

const BOTTOM_ITEMS: SidebarItem[] = [
  { href: '/notificacoes',  label: 'Notificações', icon: Bell },
  { href: '/configuracoes', label: 'Configurações', icon: Shield },
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
      className="sidebar-link"
      style={{
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        padding: '10px 12px',
        backgroundColor: active
          ? 'rgba(225,29,72,0.12)'
          : hovered
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
        color: active ? 'var(--accent)' : hovered ? 'var(--text)' : 'var(--muted)',
        border: active ? '1px solid rgba(225,29,72,0.25)' : '1px solid transparent',
        transition: 'all 0.15s',
        flexShrink: 0,
        width: '100%',
      }}
    >
      <Icon size={20} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
      <span className="sidebar-label" style={{
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-jakarta)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        {item.label}
      </span>
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
      className="app-sidebar hidden md:flex"
    >
      {/* Logo */}
      <Link
        href="/modos"
        title="MeAndYou"
        className="sidebar-logo"
      >
        <span style={{ color: 'var(--text)' }}>MeAnd</span>
        <span style={{ color: 'var(--accent)' }}>You</span>
      </Link>

      {/* Navegacao principal */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Itens inferiores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}

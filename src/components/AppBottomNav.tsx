'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Compass, Zap, ShoppingBag, User } from 'lucide-react'
import { useHaptics } from '@/hooks/useHaptics'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  center?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/conversas', label: 'Chat',       icon: MessageCircle },
  { href: '/busca',     label: 'Descobrir',  icon: Compass },
  { href: '/roleta',    label: 'Roleta',     icon: Zap, center: true },
  { href: '/loja',      label: 'Loja',       icon: ShoppingBag },
  { href: '/perfil',    label: 'Perfil',     icon: User },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/perfil') return pathname === '/perfil' || pathname.startsWith('/perfil/')
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppBottomNav() {
  const pathname = usePathname()
  const haptics = useHaptics()

  return (
    <nav
      style={{
        height: 60,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, center }) => {
        const active = isActive(pathname, href)

        if (center) {
          return (
            <Link
              key={href}
              href={href}
              onClick={() => haptics.tap()}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              aria-label={label}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: active ? 'var(--accent)' : 'rgba(225,29,72,0.12)',
                  border: active ? 'none' : '1.5px solid rgba(225,29,72,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: active ? '#fff' : 'var(--accent)',
                  boxShadow: active ? '0 4px 18px rgba(225,29,72,0.40)' : 'none',
                  transition: 'all 0.18s',
                  marginBottom: 2,
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              </div>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={() => haptics.tap()}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'color 0.15s',
              height: '100%',
            }}
            aria-label={label}
          >
            <div
              style={{
                width: 40,
                height: 24,
                borderRadius: 12,
                backgroundColor: active ? 'var(--accent-light)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.18s',
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                fontFamily: 'var(--font-jakarta)',
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

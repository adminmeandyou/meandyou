'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Compass, Zap, Gift, User } from 'lucide-react'
import { useHaptics } from '@/hooks/useHaptics'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  center?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/matches',   label: 'Matches',    icon: Users },
  { href: '/modos',     label: 'Modos',      icon: Compass },
  { href: '/roleta',    label: 'Roleta',     icon: Zap, center: true },
  { href: '/recompensas', label: 'Premios',   icon: Gift },
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
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8,9,14,0.88)',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
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
                  background: active
                    ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)'
                    : 'rgba(225,29,72,0.08)',
                  border: active ? 'none' : '1.5px solid rgba(225,29,72,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: active ? '#fff' : 'var(--accent)',
                  boxShadow: active
                    ? '0 4px 20px rgba(225,29,72,0.45), 0 0 40px rgba(225,29,72,0.15)'
                    : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
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
                height: 26,
                borderRadius: 13,
                backgroundColor: active ? 'rgba(225,29,72,0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
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

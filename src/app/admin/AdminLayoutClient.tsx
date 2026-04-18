'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Users, DollarSign, Flag, ShieldAlert, TrendingUp, LogOut, XCircle, UserCog, Award, BarChart2, Bug, Gift, Menu, X, Globe } from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType }

const ALL_NAV: NavItem[] = [
  { href: '/admin',                label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/usuarios',       label: 'Usuarios',       icon: Users           },
  { href: '/admin/financeiro',     label: 'Financeiro',     icon: DollarSign      },
  { href: '/admin/denuncias',      label: 'Denuncias',      icon: Flag            },
  { href: '/admin/seguranca',      label: 'Seguranca',      icon: ShieldAlert     },
  { href: '/admin/marketing',      label: 'Marketing',      icon: TrendingUp      },
  { href: '/admin/cancelamentos',  label: 'Cancelamentos',  icon: XCircle         },
  { href: '/admin/insights',       label: 'Perfil Clientes', icon: BarChart2       },
  { href: '/admin/equipe',         label: 'Equipe',          icon: UserCog         },
  { href: '/admin/emblemas',       label: 'Emblemas',        icon: Award           },
  { href: '/admin/recompensas',    label: 'Recompensas',     icon: Gift            },
  { href: '/admin/site',           label: 'Site e Landing',  icon: Globe           },
  { href: '/admin/bugs',           label: 'Bugs',            icon: Bug             },
]

const STAFF_PERMISSIONS: Record<string, string[]> = {
  gerente:            ['/admin', '/admin/financeiro', '/admin/usuarios', '/admin/denuncias', '/admin/cancelamentos'],
  suporte_financeiro: ['/admin', '/admin/financeiro', '/admin/cancelamentos'],
  suporte_tecnico:    ['/admin', '/admin/usuarios', '/admin/seguranca'],
  suporte_chat:       ['/admin', '/admin/denuncias', '/admin/cancelamentos'],
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  suporte_financeiro: 'Suporte Financeiro',
  suporte_tecnico: 'Suporte Tecnico',
  suporte_chat: 'Suporte Chat',
}

interface AdminLayoutClientProps {
  children: React.ReactNode
  role: string
}

export function AdminLayoutClient({ children, role }: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = role === 'admin'
    ? ALL_NAV
    : ALL_NAV.filter(item => (STAFF_PERMISSIONS[role] ?? []).includes(item.href))

  const roleLabel = ROLE_LABELS[role] ?? role

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const sidebarContent = (
    <>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: '#fff', margin: 0 }}>
            MeAnd<span style={{ color: '#e11d48' }}>You</span>
          </p>
          <button
            onClick={() => setMenuOpen(false)}
            className="admin-menu-close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', padding: '4px', display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.40)', marginTop: '2px' }}>{roleLabel}</p>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
              fontSize: '14px', fontWeight: active ? '600' : '400',
              color: active ? '#fff' : '#666',
              backgroundColor: active ? '#13161F' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={16} color={active ? '#e11d48' : '#555'} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: 'rgba(248,249,250,0.40)',
        }}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
      {/* Botao hamburger mobile */}
      <button
        onClick={() => setMenuOpen(true)}
        className="admin-menu-toggle"
        style={{
          position: 'fixed', top: '12px', left: '12px', zIndex: 1001,
          width: '40px', height: '40px', borderRadius: '10px',
          backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}
      >
        <Menu size={18} />
      </button>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="admin-overlay"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1001, display: 'none' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}
        style={{
          width: '220px', backgroundColor: '#0F1117',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
        }}
      >
        {sidebarContent}
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-menu-toggle { display: flex !important; }
          .admin-menu-close { display: flex !important; }
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: -240px !important;
            height: 100vh !important;
            z-index: 1002 !important;
            transition: left 0.25s ease !important;
          }
          .admin-sidebar-open {
            left: 0 !important;
          }
          .admin-overlay {
            display: block !important;
          }
          main { padding-top: 56px !important; }
        }
      `}</style>
    </div>
  )
}

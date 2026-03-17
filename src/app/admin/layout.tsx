'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, DollarSign, Flag, ShieldAlert, TrendingUp, LogOut, XCircle, UserCog, Award } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

type NavItem = { href: string; label: string; icon: React.ElementType }

const ALL_NAV: NavItem[] = [
  { href: '/admin',                label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/usuarios',       label: 'Usuários',       icon: Users           },
  { href: '/admin/financeiro',     label: 'Financeiro',     icon: DollarSign      },
  { href: '/admin/denuncias',      label: 'Denúncias',      icon: Flag            },
  { href: '/admin/seguranca',      label: 'Segurança',      icon: ShieldAlert     },
  { href: '/admin/marketing',      label: 'Marketing',      icon: TrendingUp      },
  { href: '/admin/cancelamentos',  label: 'Cancelamentos',  icon: XCircle         },
  { href: '/admin/equipe',         label: 'Equipe',         icon: UserCog         },
  { href: '/admin/emblemas',       label: 'Emblemas',       icon: Award           },
]

const STAFF_PERMISSIONS: Record<string, string[]> = {
  gerente:            ['/admin', '/admin/financeiro', '/admin/usuarios', '/admin/denuncias', '/admin/cancelamentos'],
  suporte_financeiro: ['/admin', '/admin/financeiro', '/admin/cancelamentos'],
  suporte_tecnico:    ['/admin', '/admin/usuarios', '/admin/seguranca'],
  suporte_chat:       ['/admin', '/admin/denuncias', '/admin/cancelamentos'],
}

const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente',
  suporte_financeiro: 'Suporte Financeiro',
  suporte_tecnico: 'Suporte Técnico',
  suporte_chat: 'Suporte Chat',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [nav, setNav] = useState<NavItem[]>(ALL_NAV)
  const [roleLabel, setRoleLabel] = useState('Admin')

  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        setRoleLabel('Admin')
        setNav(ALL_NAV)
        return
      }

      const { data: staff } = await supabase
        .from('staff_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (staff?.role) {
        const allowed = STAFF_PERMISSIONS[staff.role] ?? []
        setNav(ALL_NAV.filter(item => allowed.includes(item.href)))
        setRoleLabel(ROLE_LABELS[staff.role] ?? staff.role)
      }
    }
    loadRole()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
      <aside style={{ width: '220px', backgroundColor: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222' }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: '#fff' }}>
            MeAnd<span style={{ color: '#e11d48' }}>You</span>
          </p>
          <p style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{roleLabel}</p>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                fontSize: '14px', fontWeight: active ? '600' : '400',
                color: active ? '#fff' : '#666',
                backgroundColor: active ? '#1a1a1a' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Icon size={16} color={active ? '#e11d48' : '#555'} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #222' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', color: '#555',
          }}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

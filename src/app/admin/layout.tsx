'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, DollarSign, Flag, ShieldAlert, TrendingUp, LogOut } from 'lucide-react'

const NAV = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/usuarios',   label: 'Usuários',   icon: Users           },
  { href: '/admin/financeiro', label: 'Financeiro', icon: DollarSign      },
  { href: '/admin/denuncias',  label: 'Denúncias',  icon: Flag            },
  { href: '/admin/seguranca',  label: 'Segurança',  icon: ShieldAlert     },
  { href: '/admin/marketing',  label: 'Marketing',  icon: TrendingUp      },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    // Limpa cookies manualmente — padrão do projeto
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
      <aside style={{ width: '220px', backgroundColor: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222' }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: '#fff' }}>
            Me<span style={{ color: '#e11d48' }}>And</span>You
          </p>
          <p style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Painel Admin</p>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
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

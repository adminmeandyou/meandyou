// src/app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Users, UserCheck, Ban, TrendingUp, Flag, Heart, Gift } from 'lucide-react'

interface Metrics {
  total_users: number
  new_today: number
  total_banned: number
  total_deleted: number
  total_verified: number
  pending_verification: number
  online_now: number
  active_today: number
  plan_essencial: number
  plan_plus: number
  plan_black: number
  new_subscribers_today: number
  reports_pending: number
  reports_resolved: number
  referrals_total: number
  referrals_converted: number
}

function Card({ label, value, sub, icon: Icon, color = '#e11d48' }: any) {
  return (
    <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>{label}</p>
        <div style={{ backgroundColor: color + '18', borderRadius: '8px', padding: '6px' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-fraunces)' }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadMetrics() {
    const { data } = await supabase.from('admin_metrics').select('*').single()
    setMetrics(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const m = metrics!

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)' }}>Dashboard</h1>
        <p style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>Atualiza automaticamente a cada 30 segundos</p>
      </div>

      <Section title="⚡ Agora">
        <div style={grid}>
          <Card label="Online agora"          value={m.online_now}             icon={Users}     color="#22c55e" sub="últimos 5 minutos" />
          <Card label="Ativos hoje"           value={m.active_today}           icon={UserCheck} color="#3b82f6" />
          <Card label="Cadastros hoje"        value={m.new_today}              icon={TrendingUp} color="#a855f7" />
          <Card label="Assinantes hoje"       value={m.new_subscribers_today}  icon={Heart}     color="#e11d48" />
        </div>
      </Section>

      <Section title="👥 Usuários">
        <div style={grid}>
          <Card label="Total de usuários"       value={m.total_users}           icon={Users}     />
          <Card label="Verificados"             value={m.total_verified}        icon={UserCheck} color="#22c55e" />
          <Card label="Aguardando verificação"  value={m.pending_verification}  icon={UserCheck} color="#f59e0b" />
          <Card label="Banidos"                 value={m.total_banned}          icon={Ban}       color="#ef4444" />
          <Card label="Excluíram a conta"       value={m.total_deleted}         icon={Ban}       color="#6b7280" />
        </div>
      </Section>

      <Section title="💳 Assinaturas ativas">
        <div style={grid}>
          <Card label="Essencial — R$10/mês"  value={m.plan_essencial} icon={Heart} color="#6b7280" sub={`≈ R$${(m.plan_essencial * 10).toLocaleString('pt-BR')}/mês`} />
          <Card label="Plus — R$39/mês"       value={m.plan_plus}      icon={Heart} color="#3b82f6" sub={`≈ R$${(m.plan_plus * 39).toLocaleString('pt-BR')}/mês`} />
          <Card label="Black — R$100/mês"     value={m.plan_black}     icon={Heart} color="#f59e0b" sub={`≈ R$${(m.plan_black * 100).toLocaleString('pt-BR')}/mês`} />
          <Card label="Receita estimada/mês"  value={`R$${((m.plan_essencial*10)+(m.plan_plus*39)+(m.plan_black*100)).toLocaleString('pt-BR')}`} icon={TrendingUp} color="#22c55e" />
        </div>
      </Section>

      <Section title="🚨 Moderação">
        <div style={grid}>
          <Card label="Denúncias pendentes"    value={m.reports_pending}    icon={Flag} color="#ef4444" />
          <Card label="Denúncias resolvidas"   value={m.reports_resolved}   icon={Flag} color="#22c55e" />
          <Card label="Indicações totais"      value={m.referrals_total}    icon={Gift} color="#a855f7" />
          <Card label="Indicações convertidas" value={m.referrals_converted} icon={Gift} color="#22c55e"
            sub={m.referrals_total > 0 ? `${Math.round((m.referrals_converted/m.referrals_total)*100)}% de conversão` : undefined} />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '12px',
}

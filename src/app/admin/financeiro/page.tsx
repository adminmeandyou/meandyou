// src/app/admin/financeiro/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function AdminFinanceiro() {
  const [revenue, setRevenue] = useState<any[]>([])
  const [signups, setSignups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: rev }, { data: sig }] = await Promise.all([
      supabase.from('admin_revenue').select('*'),
      supabase.from('admin_signups_daily').select('*').limit(30),
    ])
    setRevenue(rev || [])
    setSignups(sig || [])
    setLoading(false)
  }

  const totalRevenue = revenue.reduce((acc, r) => acc + (r.estimated_revenue ?? 0), 0)
  const totalSubs    = revenue.reduce((acc, r) => acc + (r.subscribers ?? 0), 0)

  const planColor: Record<string, string> = { essencial: '#6b7280', plus: '#3b82f6', black: '#f59e0b' }
  const maxSignups = Math.max(...signups.map(s => s.signups), 1)

  if (loading) return <div style={{ padding: '32px', color: 'rgba(248,249,250,0.40)' }}>Carregando...</div>

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Financeiro</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <div style={card}>
          <p style={cardLabel}>Receita estimada/mês</p>
          <p style={cardValue}>R${totalRevenue.toLocaleString('pt-BR')}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Assinantes ativos</p>
          <p style={cardValue}>{totalSubs}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Ticket médio</p>
          <p style={cardValue}>R${totalSubs > 0 ? (totalRevenue / totalSubs).toFixed(2) : '0'}</p>
        </div>
      </div>

      <Section title="Assinaturas por plano">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {revenue.map(r => (
            <div key={r.plan} style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: planColor[r.plan] ?? '#fff' }} />
                <div>
                  <p style={{ fontWeight: '600', textTransform: 'capitalize' }}>{r.plan}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '2px' }}>
                    {r.plan === 'essencial' ? 'R$10/mês' : r.plan === 'plus' ? 'R$39/mês' : 'R$100/mês'}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '700', fontFamily: 'var(--font-fraunces)', fontSize: '20px' }}>{r.subscribers}</p>
                <p style={{ fontSize: '13px', color: '#22c55e', marginTop: '2px' }}>R${(r.estimated_revenue ?? 0).toLocaleString('pt-BR')}/mês</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Cadastros por dia (últimos 30 dias)">
        <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
            {[...signups].reverse().map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  title={`${s.day}: ${s.signups} cadastros`}
                  style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    backgroundColor: '#e11d48',
                    height: `${Math.max((s.signups / maxSignups) * 100, 4)}%`,
                    opacity: 0.7,
                    cursor: 'default',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.40)' }}>{signups[signups.length - 1]?.day ?? ''}</p>
            <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.40)' }}>{signups[0]?.day ?? ''}</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(248,249,250,0.40)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}

const card: React.CSSProperties = { backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }
const cardLabel: React.CSSProperties = { fontSize: '13px', color: 'rgba(248,249,250,0.40)', marginBottom: '8px' }
const cardValue: React.CSSProperties = { fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-fraunces)' }

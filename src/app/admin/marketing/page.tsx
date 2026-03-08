// src/app/admin/marketing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function AdminMarketing() {
  
    
    
  )
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [
      { data: metrics },
      { data: signups },
      { data: referrals },
      { data: deleted },
    ] = await Promise.all([
      supabase.from('admin_metrics').select('*').single(),
      supabase.from('admin_signups_daily').select('*').limit(30),
      supabase.from('referrals').select('id, status, created_at, referred:referred_id(name), referrer:referrer_id(name)').order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(20),
    ])
    setData({ metrics, signups: signups || [], referrals: referrals || [], deleted: deleted || [] })
    setLoading(false)
  }

  if (loading || !data) return <div style={{ padding: '32px', color: '#555' }}>Carregando...</div>

  const { metrics, signups, referrals, deleted } = data

  const total      = metrics?.total_users ?? 0
  const verified   = metrics?.total_verified ?? 0
  const subscribed = (metrics?.plan_essencial ?? 0) + (metrics?.plan_plus ?? 0) + (metrics?.plan_black ?? 0)
  const convRate   = total > 0 ? ((subscribed / total) * 100).toFixed(1) : '0'

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Marketing</h1>

      <Section title="Funil de conversão">
        <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Cadastraram', value: total,      color: '#3b82f6' },
            { label: 'Verificaram', value: verified,   color: '#a855f7' },
            { label: 'Assinaram',   value: subscribed, color: '#22c55e' },
          ].map((step, i) => {
            const pct = total > 0 ? Math.round((step.value / total) * 100) : 0
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>{step.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{step.value} <span style={{ color: '#555', fontWeight: '400' }}>({pct}%)</span></span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#1e1e1e', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: step.color, borderRadius: '100px' }} />
                </div>
              </div>
            )
          })}
          <p style={{ fontSize: '12px', color: '#444', marginTop: '8px' }}>Taxa cadastro → assinatura: <strong style={{ color: '#22c55e' }}>{convRate}%</strong></p>
        </div>
      </Section>

      <Section title={`Indicações (${referrals.length})`}>
        <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
          {referrals.length === 0 ? (
            <p style={{ padding: '20px', color: '#444', textAlign: 'center' }}>Nenhuma indicação ainda</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                  {['Indicou', 'Indicado', 'Status', 'Data'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #161616' }}>
                    <td style={{ padding: '12px 16px' }}>{r.referrer?.name ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#888' }}>{r.referred?.name ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: r.status === 'rewarded' ? '#22c55e22' : '#f59e0b22',
                        color: r.status === 'rewarded' ? '#22c55e' : '#f59e0b',
                      }}>
                        {r.status === 'rewarded' ? 'Convertida' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#444', fontSize: '13px' }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section title={`Excluíram a conta (${deleted.length})`}>
        <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
          {deleted.length === 0 ? (
            <p style={{ padding: '20px', color: '#444', textAlign: 'center' }}>Nenhuma conta excluída</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                  {['Nome', 'Data de exclusão'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deleted.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #161616' }}>
                    <td style={{ padding: '12px 16px', color: '#666' }}>{u.name ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#444', fontSize: '13px' }}>
                      {new Date(u.deleted_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}

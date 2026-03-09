// src/app/admin/seguranca/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminSeguranca() {
  const [pending, setPending] = useState<any[]>([])
  const [banned, setBanned] = useState<any[]>([])
  const [tab, setTab] = useState<'verificacoes' | 'banidos'>('verificacoes')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    if (tab === 'verificacoes') {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, selfie_url')
        .eq('verified', false)
        .eq('banned', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)
      setPending(data || [])
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, banned_reason, created_at')
        .eq('banned', true)
        .order('created_at', { ascending: false })
        .limit(100)
      setBanned(data || [])
    }
    setLoading(false)
  }

  async function approveVerification(userId: string) {
    await supabase.from('profiles').update({ verified: true }).eq('id', userId)
    loadData()
  }

  async function rejectAndBan(userId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.rpc('admin_ban_user', {
      p_user_id: userId,
      p_reason: 'Verificação rejeitada',
      p_admin_id: user?.id,
    })
    loadData()
  }

  async function unban(userId: string) {
    await supabase.rpc('admin_unban_user', { p_user_id: userId })
    loadData()
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Segurança</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['verificacoes', 'banidos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
            backgroundColor: tab === t ? '#e11d48' : '#1a1a1a',
            color: tab === t ? '#fff' : '#666',
          }}>
            {{ verificacoes: `Verificações pendentes (${pending.length})`, banidos: 'Banidos' }[t]}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#555' }}>Carregando...</p> : (
        tab === 'verificacoes' ? (
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>✓</p>
              <p>Nenhuma verificação pendente</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {pending.map(u => (
                <div key={u.id} style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
                  {u.selfie_url && (
                    <img src={u.selfie_url} alt="Selfie" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontWeight: '600', marginBottom: '2px' }}>{u.name ?? '—'}</p>
                    <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>{u.email}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => approveVerification(u.id)} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e22', border: 'none', borderRadius: '8px', color: '#22c55e', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={14} /> Aprovar
                      </button>
                      <button onClick={() => rejectAndBan(u.id)} style={{ flex: 1, padding: '8px', backgroundColor: '#ef444422', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <XCircle size={14} /> Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          banned.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
              <p>Nenhum usuário banido</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                    {['Nome', 'Email', 'Motivo', 'Data', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {banned.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #161616' }}>
                      <td style={{ padding: '12px 16px' }}>{u.name ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>{u.email ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>{u.banned_reason ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#444', fontSize: '13px' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => unban(u.id)} style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#22c55e', cursor: 'pointer', fontSize: '13px' }}>
                          Desbanir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )
      )}
    </div>
  )
}

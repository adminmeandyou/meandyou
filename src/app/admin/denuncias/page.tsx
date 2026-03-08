// src/app/admin/denuncias/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

export default function AdminDenuncias() {
  
    
    
  )
  const [reports, setReports] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'ignored'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReports() }, [filter])

  async function loadReports() {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select(`
        id, reason, description, status, created_at,
        reporter:reporter_id ( id, name ),
        reported:reported_id ( id, name )
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(50)
    setReports(data || [])
    setLoading(false)
  }

  async function resolve(id: string, action: 'resolved' | 'ignored') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.rpc('admin_resolve_report', {
      p_report_id: id,
      p_action: action,
      p_admin_id: user?.id,
    })
    loadReports()
  }

  async function banFromReport(reportedId: string, reportId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.rpc('admin_ban_user', {
      p_user_id: reportedId,
      p_reason: 'Banido via denúncia',
      p_admin_id: user?.id,
    })
    await resolve(reportId, 'resolved')
  }

  const REASON_LABEL: Record<string, string> = {
    fake_profile: 'Perfil falso',
    scam: 'Golpe',
    harassment: 'Assédio',
    minor: 'Menor de idade',
    inappropriate: 'Conteúdo impróprio',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Denúncias</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['pending', 'resolved', 'ignored'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
            backgroundColor: filter === f ? '#e11d48' : '#1a1a1a',
            color: filter === f ? '#fff' : '#666',
          }}>
            {{ pending: 'Pendentes', resolved: 'Resolvidas', ignored: 'Ignoradas' }[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#555' }}>Carregando...</p>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>✓</p>
          <p>Nenhuma denúncia {filter === 'pending' ? 'pendente' : filter === 'resolved' ? 'resolvida' : 'ignorada'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.map(r => (
            <div key={r.id} style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: '#ef444422', color: '#ef4444', fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '100px' }}>
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                    <span style={{ fontSize: '12px', color: '#444' }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '6px' }}>
                    <span style={{ color: '#fff' }}>{r.reporter?.name ?? '?'}</span>
                    {' denunciou '}
                    <span style={{ color: '#fff' }}>{r.reported?.name ?? '?'}</span>
                  </p>
                  {r.description && (
                    <p style={{ fontSize: '13px', color: '#555', fontStyle: 'italic' }}>"{r.description}"</p>
                  )}
                </div>

                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a href={`/perfil/${r.reported?.id}`} target="_blank" title="Ver perfil" style={{ padding: '8px', backgroundColor: '#1a1a1a', borderRadius: '8px', color: '#666', display: 'flex', textDecoration: 'none' }}>
                      <Eye size={15} />
                    </a>
                    <button onClick={() => resolve(r.id, 'ignored')} title="Ignorar" style={{ padding: '8px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#666', cursor: 'pointer', display: 'flex' }}>
                      <XCircle size={15} />
                    </button>
                    <button onClick={() => resolve(r.id, 'resolved')} title="Resolver" style={{ padding: '8px', backgroundColor: '#22c55e22', border: 'none', borderRadius: '8px', color: '#22c55e', cursor: 'pointer', display: 'flex' }}>
                      <CheckCircle size={15} />
                    </button>
                    <button onClick={() => banFromReport(r.reported?.id, r.id)} title="Banir usuário" style={{ padding: '8px', backgroundColor: '#ef444422', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      Banir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

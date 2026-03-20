'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

const STATUS_FILTERS = ['pendente', 'verificado', 'recusado', 'todos']
const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendentes', verificado: 'Verificados', recusado: 'Recusados', todos: 'Todos',
}
const STATUS_COLOR: Record<string, string> = {
  pendente: '#f59e0b', verificado: '#22c55e', recusado: '#ef4444',
}

export default function AdminBugs() {
  const [bugs, setBugs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pendente')
  const [selectedBug, setSelectedBug] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadBugs() }, [statusFilter])

  async function loadBugs() {
    setLoading(true)
    const res = await fetch(`/api/admin/bugs?status=${statusFilter}`)
    const json = await res.json()
    setBugs(json.data ?? [])
    setLoading(false)
  }

  async function verificar(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/bugs/${id}/verificar`, { method: 'POST' })
    setSelectedBug(null)
    setActionLoading(false)
    loadBugs()
  }

  async function recusar(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/bugs/${id}/recusar`, { method: 'POST' })
    setSelectedBug(null)
    setActionLoading(false)
    loadBugs()
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Reporte de Bugs</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
            backgroundColor: statusFilter === s ? '#e11d48' : '#13161F',
            color: statusFilter === s ? '#fff' : '#666',
          }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Data', 'Usuario', 'Descricao', 'Print', 'Status', 'Acoes'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(248,249,250,0.40)' }}>Carregando...</td></tr>
            ) : bugs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(248,249,250,0.40)' }}>Nenhum report</td></tr>
            ) : bugs.map((b: any) => (
              <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={() => setSelectedBug(b)}>
                <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{new Date(b.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <p style={{ color: '#fff', margin: 0, fontSize: '14px' }}>{b.user?.name ?? '—'}</p>
                  <p style={{ color: 'rgba(248,249,250,0.40)', margin: 0, fontSize: '12px' }}>{b.user?.plan ?? '—'}</p>
                </td>
                <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.50)', maxWidth: '300px' }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.descricao}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {b.screenshot_url ? <ImageIcon size={16} color="#3b82f6" /> : <span style={{ color: 'rgba(248,249,250,0.20)' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: (STATUS_COLOR[b.status] ?? '#888') + '22',
                    color: STATUS_COLOR[b.status] ?? '#888',
                  }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {b.status === 'pendente' && (
                    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => verificar(b.id)} disabled={actionLoading} style={{
                        padding: '6px 12px', backgroundColor: '#22c55e22', color: '#22c55e',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                      }}>
                        Verificar
                      </button>
                      <button onClick={() => recusar(b.id)} disabled={actionLoading} style={{
                        padding: '6px 12px', backgroundColor: '#ef444422', color: '#ef4444',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                      }}>
                        Recusar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalhe */}
      {selectedBug && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', margin: 0 }}>{selectedBug.user?.name ?? 'Usuario'}</h3>
                <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '13px', margin: '4px 0 0' }}>{selectedBug.user?.email} · {selectedBug.user?.plan ?? 'sem plano'}</p>
              </div>
              <button onClick={() => setSelectedBug(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', fontSize: '24px', lineHeight: 1 }}>x</button>
            </div>

            <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Descricao</p>
            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{selectedBug.descricao}</p>

            {selectedBug.screenshot_url && (
              <>
                <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Screenshot</p>
                <img src={selectedBug.screenshot_url} alt="Screenshot do bug" style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.07)' }} />
              </>
            )}

            {selectedBug.status === 'pendente' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => verificar(selectedBug.id)} disabled={actionLoading} style={{
                  flex: 1, padding: '12px', backgroundColor: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}>
                  Verificar e dar 5 fichas
                </button>
                <button onClick={() => recusar(selectedBug.id)} disabled={actionLoading} style={{
                  flex: 1, padding: '12px', backgroundColor: '#13161F', color: '#ef4444',
                  border: '1px solid #ef444433', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}>
                  Recusar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

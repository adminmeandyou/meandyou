// src/app/admin/seguranca/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { CheckCircle, XCircle } from 'lucide-react'
import { adminAcao } from '@/lib/adminView'

export default function AdminSeguranca() {
  const [pending, setPending] = useState<any[]>([])
  const [banned, setBanned] = useState<any[]>([])
  const [tab, setTab] = useState<'verificacoes' | 'banidos'>('verificacoes')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verificacoes?tab=${tab}`)
      const json = await res.json()
      if (tab === 'verificacoes') setPending(json.items ?? [])
      else setBanned(json.items ?? [])
    } catch {
      if (tab === 'verificacoes') setPending([])
      else setBanned([])
    }
    setLoading(false)
  }

  async function approveVerification(userId: string) {
    await fetch('/api/admin/verificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadData()
  }

  async function rejectAndBan(userId: string) {
    await adminAcao('banir', { userId: userId, motivo: 'Verificação rejeitada' })
    loadData()
  }

  async function unban(userId: string) {
    await adminAcao('desbanir', { userId: userId })
    loadData()
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Segurança</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['verificacoes', 'banidos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
            backgroundColor: tab === t ? '#e11d48' : '#13161F',
            color: tab === t ? '#fff' : '#666',
          }}>
            {{ verificacoes: `Verificações pendentes (${pending.length})`, banidos: 'Banidos' }[t]}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: 'rgba(248,249,250,0.40)' }}>Carregando...</p> : (
        tab === 'verificacoes' ? (
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(248,249,250,0.40)' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>✓</p>
              <p>Nenhuma verificação pendente</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {pending.map(u => (
                <div key={u.id} style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
                    {[['Selfie', u.selfie_url], ['Frente', u.doc_frente_url], ['Verso', u.doc_verso_url]].map(([rotulo, url]) => (
                      url ? (
                        <a key={rotulo} href={url} target="_blank" rel="noopener noreferrer" title={`Abrir ${rotulo}`}>
                          <img src={url} alt={rotulo} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                        </a>
                      ) : (
                        <div key={rotulo} style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.30)', backgroundColor: '#13161F' }}>
                          {rotulo}: sem arquivo
                        </div>
                      )
                    ))}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontWeight: '600', marginBottom: '2px' }}>{u.name ?? '-'}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.40)', marginBottom: '12px' }}>{u.email}</p>
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
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(248,249,250,0.40)' }}>
              <p>Nenhum usuário banido</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Nome', 'Email', 'Motivo', 'Data', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {banned.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <td style={{ padding: '12px 16px' }}>{u.name ?? '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)' }}>{u.email ?? '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{u.banned_reason ?? '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => unban(u.id)} style={{ padding: '6px 12px', backgroundColor: '#13161F', border: 'none', borderRadius: '8px', color: '#22c55e', cursor: 'pointer', fontSize: '13px' }}>
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

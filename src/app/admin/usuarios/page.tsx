// src/app/admin/usuarios/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, Ban, CheckCircle, Eye } from 'lucide-react'

const FILTERS = ['todos', 'ativos', 'banidos', 'nao_verificados', 'excluidos', 'essencial', 'plus', 'black']
const FILTER_LABELS: Record<string, string> = {
  todos: 'Todos', ativos: 'Ativos', banidos: 'Banidos',
  nao_verificados: 'Não verificados', excluidos: 'Excluídos',
  essencial: 'Essencial', plus: 'Plus', black: 'Black',
}

export default function AdminUsuarios() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [banModal, setBanModal] = useState<{ id: string; name: string } | null>(null)
  const [banReason, setBanReason] = useState('')

  useEffect(() => { loadUsers() }, [filter, search])

  async function loadUsers() {
    setLoading(true)
    let query = supabase.from('admin_users').select('*').order('created_at', { ascending: false }).limit(100)

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    if (filter === 'banidos')         query = query.eq('banned', true)
    if (filter === 'nao_verificados') query = query.eq('verified', false).eq('banned', false)
    if (filter === 'excluidos')       query = query.not('deleted_at', 'is', null)
    if (filter === 'ativos')          query = query.eq('banned', false).is('deleted_at', null)
    if (['essencial','plus','black'].includes(filter)) query = query.eq('plan', filter)

    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  async function banUser() {
    if (!banModal) return
    await supabase.rpc('admin_ban_user', {
      p_user_id: banModal.id,
      p_reason: banReason,
      p_admin_id: (await supabase.auth.getUser()).data.user?.id,
    })
    setBanModal(null)
    setBanReason('')
    loadUsers()
  }

  async function unbanUser(id: string) {
    await supabase.rpc('admin_unban_user', { p_user_id: id })
    loadUsers()
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Usuários</h1>

      {/* Search + filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', padding: '10px 12px 10px 36px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
              backgroundColor: filter === f ? '#e11d48' : '#1a1a1a',
              color: filter === f ? '#fff' : '#666',
            }}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              {['Nome', 'Email', 'Plano', 'Status', 'Denúncias', 'Cadastro', 'Ações'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Nenhum usuário encontrado</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #161616' }}>
                <td style={{ padding: '12px 16px', color: '#fff' }}>{u.name ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#888' }}>{u.email ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {u.plan ? (
                    <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: u.plan === 'black' ? '#f59e0b22' : u.plan === 'plus' ? '#3b82f622' : '#6b728022',
                      color:           u.plan === 'black' ? '#f59e0b'   : u.plan === 'plus' ? '#3b82f6'   : '#9ca3af',
                    }}>{u.plan}</span>
                  ) : <span style={{ color: '#333' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.banned ? (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>● Banido</span>
                  ) : u.deleted_at ? (
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>● Excluído</span>
                  ) : u.verified ? (
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>● Verificado</span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>● Pendente</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: u.reports_received > 0 ? '#ef4444' : '#444' }}>
                  {u.reports_received}
                </td>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: '13px' }}>
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`/perfil/${u.id}`} target="_blank" style={{ color: '#555', display: 'flex' }}>
                      <Eye size={16} />
                    </a>
                    {u.banned ? (
                      <button onClick={() => unbanUser(u.id)} title="Desbanir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', display: 'flex' }}>
                        <CheckCircle size={16} />
                      </button>
                    ) : (
                      <button onClick={() => setBanModal({ id: u.id, name: u.name })} title="Banir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de ban */}
      {banModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', marginBottom: '8px' }}>Banir {banModal.name}?</h3>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '16px' }}>Esta ação impede o usuário de acessar o app. Pode ser desfeita.</p>
            <textarea
              placeholder="Motivo do banimento..."
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              rows={3}
              style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setBanModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: '10px', color: '#666', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              <button onClick={banUser} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Banir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
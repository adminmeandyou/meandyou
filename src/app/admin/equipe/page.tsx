'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

type StaffMember = {
  id: string
  user_id: string
  role: string
  active: boolean
  created_at: string
  profiles: { name: string } | null
  users: { email: string } | null
}

type Role = 'gerente' | 'suporte_financeiro' | 'suporte_tecnico' | 'suporte_chat'

const ROLE_CONFIG: Record<Role, { label: string; description: string }> = {
  gerente:            { label: 'Gerente',            description: 'Acesso a finanças, usuários e denúncias' },
  suporte_financeiro: { label: 'Suporte Financeiro', description: 'Gerencia cancelamentos e pagamentos' },
  suporte_tecnico:    { label: 'Suporte Técnico',    description: 'Acessa usuários, verificações e segurança' },
  suporte_chat:       { label: 'Suporte Chat',       description: 'Gerencia denúncias e suporte' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function EquipePage() {
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('suporte_chat')
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select(`
          id,
          user_id,
          role,
          active,
          created_at,
          profiles ( name ),
          users ( email )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers((data as unknown as StaffMember[]) ?? [])
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  async function handleAddMember() {
    if (!newEmail.trim()) return
    setAdding(true)
    setAddMsg(null)
    try {
      // Busca user por email
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail.toLowerCase().trim())
        .single()

      if (userErr || !userRow) {
        setAddMsg({ text: 'Usuário não encontrado com esse e-mail.', type: 'error' })
        return
      }

      const { error: insertErr } = await supabase
        .from('staff_members')
        .insert({ user_id: userRow.id, role: newRole, active: true })

      if (insertErr) {
        setAddMsg({ text: insertErr.message, type: 'error' })
        return
      }

      setAddMsg({ text: 'Membro adicionado com sucesso!', type: 'success' })
      setNewEmail('')
      await loadMembers()
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
      setAddMsg({ text: 'Erro ao adicionar membro.', type: 'error' })
    } finally {
      setAdding(false)
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ active: !currentActive })
        .eq('id', id)

      if (error) throw error

      setMembers(prev =>
        prev.map(m => m.id === id ? { ...m, active: !currentActive } : m)
      )
    } catch (err) {
      console.error('Erro ao atualizar membro:', err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>Equipe</h1>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '14px', margin: 0 }}>
          Gerencie os membros da equipe e suas permissões de acesso
        </p>
      </div>

      {/* Formulário adicionar membro */}
      <div style={{
        backgroundColor: '#0F1117',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '28px',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px', color: '#fff' }}>
          Adicionar novo membro
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(248,249,250,0.50)', marginBottom: '6px' }}>
              E-mail
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@exemplo.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundColor: '#0a0a0a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(248,249,250,0.50)', marginBottom: '6px' }}>
              Função
            </label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as Role)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundColor: '#0a0a0a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddMember}
            disabled={adding || !newEmail.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#e11d48',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: adding || !newEmail.trim() ? 'not-allowed' : 'pointer',
              opacity: adding || !newEmail.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {adding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>

        {/* Descrições dos roles */}
        <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
            <div key={r} style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: newRole === r ? '#1a0a0f' : '#141414',
              border: `1px solid ${newRole === r ? '#e11d4830' : '#1e1e1e'}`,
              color: newRole === r ? '#e11d48' : '#666',
            }}>
              <strong>{ROLE_CONFIG[r].label}:</strong> {ROLE_CONFIG[r].description}
            </div>
          ))}
        </div>

        {addMsg && (
          <p style={{
            marginTop: '12px',
            fontSize: '13px',
            color: addMsg.type === 'success' ? '#22c55e' : '#ef4444',
          }}>
            {addMsg.text}
          </p>
        )}
      </div>

      {/* Lista de membros */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(248,249,250,0.40)', padding: '60px 0' }}>Carregando...</div>
      ) : members.length === 0 ? (
        <div style={{
          backgroundColor: '#0F1117',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: 'rgba(248,249,250,0.40)',
        }}>
          Nenhum membro na equipe ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          {members.map(m => (
            <div
              key={m.id}
              style={{
                backgroundColor: '#0F1117',
                border: `1px solid ${m.active ? '#1e1e1e' : '#1a0a0a'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '12px',
                alignItems: 'center',
                opacity: m.active ? 1 : 0.6,
              }}
            >
              {/* Info */}
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#fff' }}>
                  {m.profiles?.name ?? 'Sem nome'}
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: 'rgba(248,249,250,0.50)' }}>
                  {m.users?.email ?? m.user_id}
                </p>
              </div>

              {/* Role + data + status */}
              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#13161F',
                  color: '#aaa',
                  border: '1px solid rgba(255,255,255,0.07)',
                  marginBottom: '6px',
                }}>
                  {ROLE_CONFIG[m.role as Role]?.label ?? m.role}
                </span>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(248,249,250,0.40)' }}>
                  {ROLE_CONFIG[m.role as Role]?.description ?? ''}
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: 'rgba(248,249,250,0.40)' }}>
                  Adicionado em {formatDate(m.created_at)} ·{' '}
                  <span style={{ color: m.active ? '#22c55e' : '#ef4444' }}>
                    {m.active ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
              </div>

              {/* Ação */}
              <div>
                <button
                  onClick={() => toggleActive(m.id, m.active)}
                  disabled={updating === m.id}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${m.active ? '#ef4444' : '#22c55e'}`,
                    backgroundColor: 'transparent',
                    color: m.active ? '#ef4444' : '#22c55e',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: updating === m.id ? 'not-allowed' : 'pointer',
                    opacity: updating === m.id ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {updating === m.id ? '...' : m.active ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

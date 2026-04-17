'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

type CancellationRequest = {
  id: string
  user_id: string
  subscription_id: string
  plan: string
  status: 'pending' | 'processing' | 'done' | 'rejected'
  requested_at: string
  processed_at: string | null
  profiles: { name: string } | null
  users: { email: string } | null
}

type FilterType = 'pending' | 'processing' | 'done' | 'all'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Em andamento',
  done: 'Concluído',
  rejected: 'Rejeitado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  done: '#22c55e',
  rejected: '#ef4444',
}

const PLAN_LABELS: Record<string, string> = {
  essencial: 'Essencial',
  plus: 'Plus',
  black: 'Black',
  desconhecido: 'Desconhecido',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CancelamentosPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadRequests() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cancellation_requests')
        .select(`
          id,
          user_id,
          subscription_id,
          plan,
          status,
          requested_at,
          processed_at,
          profiles ( name ),
          users ( email )
        `)
        .order('requested_at', { ascending: false })

      if (error) throw error
      setRequests((data as unknown as CancellationRequest[]) ?? [])
    } catch (err) {
      console.error('Erro ao carregar cancelamentos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function updateStatus(id: string, newStatus: 'processing' | 'done') {
    setUpdating(id)
    try {
      const updates: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'done') updates.processed_at = new Date().toISOString()

      const { error } = await supabase
        .from('cancellation_requests')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setRequests(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, status: newStatus, processed_at: newStatus === 'done' ? new Date().toISOString() : r.processed_at }
            : r
        )
      )
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = requests.filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'processing') return r.status === 'processing'
    if (filter === 'done') return r.status === 'done' || r.status === 'rejected'
    return true
  })

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'pending', label: 'Pendentes' },
    { key: 'processing', label: 'Em andamento' },
    { key: 'done', label: 'Concluídos' },
    { key: 'all', label: 'Todos' },
  ]

  return (
    <div style={{ padding: '32px', color: '#fff' }}>

      {/* Aviso fixo */}
      <div style={{
        backgroundColor: '#1a1000',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <p style={{ color: '#f59e0b', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
          ⚠️ Gateway de pagamentos pendente de configuração. Cancelar manualmente no painel do novo gateway antes de marcar como processado.
        </p>
        {/* TODO: adicionar link para o painel do novo gateway de pagamentos */}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>Cancelamentos</h1>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '14px', margin: 0 }}>
          Solicitações de cancelamento aguardando processamento manual no gateway de pagamentos
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === f.key ? '600' : '400',
              backgroundColor: filter === f.key ? '#e11d48' : '#13161F',
              color: filter === f.key ? '#fff' : '#888',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{
                marginLeft: '6px',
                backgroundColor: filter === f.key ? 'rgba(255,255,255,0.2)' : '#222',
                color: filter === f.key ? '#fff' : '#666',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '11px',
              }}>
                {requests.filter(r => {
                  if (f.key === 'pending') return r.status === 'pending'
                  if (f.key === 'processing') return r.status === 'processing'
                  if (f.key === 'done') return r.status === 'done' || r.status === 'rejected'
                  return false
                }).length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={loadRequests}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            fontSize: '13px',
            backgroundColor: 'transparent',
            color: 'rgba(248,249,250,0.50)',
          }}
        >
          Atualizar
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(248,249,250,0.40)', padding: '60px 0' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: '#0F1117',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: 'rgba(248,249,250,0.40)',
        }}>
          Nenhuma solicitação encontrada para este filtro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(req => (
            <div
              key={req.id}
              style={{
                backgroundColor: '#0F1117',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              {/* Info usuário + plano */}
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#fff' }}>
                  {req.profiles?.name ?? 'Usuário sem nome'}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(248,249,250,0.50)' }}>
                  {req.users?.email ?? req.user_id}
                </p>
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#13161F',
                  color: '#aaa',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  Plano {PLAN_LABELS[req.plan] ?? req.plan}
                </span>
              </div>

              {/* Datas + status */}
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(248,249,250,0.40)' }}>
                  Solicitado em: <span style={{ color: '#aaa' }}>{req.requested_at ? formatDate(req.requested_at) : '-'}</span>
                </p>
                {req.processed_at && (
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(248,249,250,0.40)' }}>
                    Processado em: <span style={{ color: '#aaa' }}>{formatDate(req.processed_at)}</span>
                  </p>
                )}
                <span style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  backgroundColor: `${STATUS_COLORS[req.status]}18`,
                  color: STATUS_COLORS[req.status] ?? '#aaa',
                  border: `1px solid ${STATUS_COLORS[req.status] ?? '#333'}33`,
                }}>
                  {STATUS_LABELS[req.status] ?? req.status}
                </span>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
                {req.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(req.id, 'processing')}
                    disabled={updating === req.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #3b82f6',
                      backgroundColor: 'transparent',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: updating === req.id ? 0.5 : 1,
                    }}
                  >
                    Em andamento
                  </button>
                )}
                {(req.status === 'pending' || req.status === 'processing') && (
                  <button
                    onClick={() => updateStatus(req.id, 'done')}
                    disabled={updating === req.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#22c55e',
                      color: '#000',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: updating === req.id ? 0.5 : 1,
                    }}
                  >
                    {updating === req.id ? 'Salvando...' : 'Marcar como processado'}
                  </button>
                )}
                {(req.status === 'done' || req.status === 'rejected') && (
                  <span style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Finalizado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

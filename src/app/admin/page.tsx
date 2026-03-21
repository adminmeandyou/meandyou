// src/app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Users, UserCheck, Ban, TrendingUp, Flag, Heart, Gift, X, Video, MessageSquare, DollarSign, XCircle, BarChart2 } from 'lucide-react'
import Link from 'next/link'

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

interface ExtraMetrics {
  cancel_pending: number
  cancel_done: number
  support_pending: number
  support_total: number
  video_sessions: number
  video_minutes: number
}

interface UserItem {
  id: string
  name: string
  email: string
  plan: string
  verified: boolean
  banned: boolean
  deleted_at: string | null
  created_at: string
  last_seen: string | null
  banned_reason?: string
  reports_count?: number
  city?: string
  age?: number
  gender?: string
  photo_best?: string
}

type FilterKey =
  | 'online_now' | 'active_today' | 'new_today' | 'new_subscribers_today'
  | 'total_users' | 'verified' | 'pending_verification' | 'banned' | 'deleted'
  | 'plan_essencial' | 'plan_plus' | 'plan_black'

const PLAN_COLORS: Record<string, string> = {
  black: '#f59e0b',
  plus: '#3b82f6',
  essencial: '#6b7280',
  free: '#333',
}

// ── Drawer de usuários ───────────────────────────────────────────────────

function UserDrawer({ filterKey, title, onClose }: { filterKey: FilterKey; title: string; onClose: () => void }) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      let q = supabase.from('admin_users').select('*').limit(200)

      switch (filterKey) {
        case 'online_now':          q = q.gte('last_seen', fiveMinAgo); break
        case 'active_today':        q = q.gte('last_seen', todayStart); break
        case 'new_today':           q = q.gte('created_at', todayStart); break
        case 'new_subscribers_today': q = q.not('plan', 'in', '("free")').gte('created_at', todayStart); break
        case 'total_users':         q = q.is('deleted_at', null).neq('banned', true); break
        case 'verified':            q = q.eq('verified', true); break
        case 'pending_verification': q = q.eq('verified', false).neq('banned', true).is('deleted_at', null); break
        case 'banned':              q = q.eq('banned', true); break
        case 'deleted':             q = q.not('deleted_at', 'is', null); break
        case 'plan_essencial':      q = q.eq('plan', 'essencial'); break
        case 'plan_plus':           q = q.eq('plan', 'plus'); break
        case 'plan_black':          q = q.eq('plan', 'black'); break
      }

      const { data } = await q.order('created_at', { ascending: false })
      setUsers((data as UserItem[]) ?? [])
      setLoading(false)
    }
    load()
  }, [filterKey])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
      <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={onClose} />
      <div style={{ width: '660px', maxWidth: '96vw', backgroundColor: '#0F1117', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{title}</p>
            {!loading && <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '2px' }}>{users.length} usuário{users.length !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', padding: '4px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(248,249,250,0.40)' }}>Carregando...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(248,249,250,0.40)' }}>Nenhum usuário encontrado</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.map(u => <DrawerUserRow key={u.id} user={u} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DrawerUserRow({ user: u }: { user: UserItem }) {
  const status = u.banned ? 'banido' : u.deleted_at ? 'excluído' : u.verified ? 'verificado' : 'pendente'
  const statusColor = ({ banido: '#ef4444', 'excluído': '#6b7280', verificado: '#22c55e', pendente: '#f59e0b' } as Record<string, string>)[status]

  return (
    <div style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: '#13161F',
        backgroundImage: u.photo_best ? `url(${u.photo_best})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', color: 'rgba(248,249,250,0.40)',
      }}>
        {!u.photo_best && '?'}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{u.name || 'Sem nome'}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '6px', backgroundColor: (PLAN_COLORS[u.plan] || '#333') + '22', color: PLAN_COLORS[u.plan] || '#555', border: `1px solid ${(PLAN_COLORS[u.plan] || '#333')}33` }}>
            {u.plan || 'free'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '6px', color: statusColor, backgroundColor: statusColor + '18' }}>
            {status}
          </span>
          {(u.reports_count ?? 0) > 0 && (
            <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '6px', color: '#ef4444', backgroundColor: '#ef444418' }}>
              {u.reports_count} denúncia{(u.reports_count ?? 0) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {u.email}{u.age ? ` · ${u.age} anos` : ''}{u.city ? ` · ${u.city}` : ''}{u.gender ? ` · ${u.gender}` : ''}
        </p>
        <p style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '1px' }}>
          Cadastro: {new Date(u.created_at).toLocaleDateString('pt-BR')}
          {u.last_seen ? ` · Ativo: ${new Date(u.last_seen).toLocaleDateString('pt-BR')}` : ''}
          {u.banned_reason ? ` · Motivo: ${u.banned_reason}` : ''}
        </p>
      </div>

      <a href={`/perfil/${u.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.50)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Ver perfil
      </a>
    </div>
  )
}

// ── Card clicável ────────────────────────────────────────────────────────

function Card({ label, value, sub, icon: Icon, color = '#e11d48', onClick, linkTo }: {
  label: string; value: number | string | undefined; sub?: string
  icon: React.ElementType; color?: string
  onClick?: () => void; linkTo?: string
}) {
  const isClickable = !!(onClick || linkTo)
  const inner = (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#0F1117', border: `1px solid ${isClickable ? '#2a2a2a' : '#1e1e1e'}`, borderRadius: '16px', padding: '20px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={e => { if (isClickable) { (e.currentTarget as HTMLDivElement).style.borderColor = color + '55'; (e.currentTarget as HTMLDivElement).style.backgroundColor = '#161616' } }}
      onMouseLeave={e => { if (isClickable) { (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLDivElement).style.backgroundColor = '#0F1117' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.40)', fontWeight: '500' }}>{label}</p>
        <div style={{ backgroundColor: color + '18', borderRadius: '8px', padding: '6px' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-fraunces)' }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '4px' }}>{sub}</p>}
      {isClickable && <p style={{ fontSize: '11px', color: color + '88', marginTop: '6px' }}>Clique para ver usuários</p>}
    </div>
  )

  if (linkTo) return <Link href={linkTo} style={{ textDecoration: 'none' }}>{inner}</Link>
  return inner
}

// ── Dashboard principal ──────────────────────────────────────────────────

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [extra, setExtra] = useState<ExtraMetrics>({ cancel_pending: 0, cancel_done: 0, support_pending: 0, support_total: 0, video_sessions: 0, video_minutes: 0 })
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState<{ filterKey: FilterKey; title: string } | null>(null)

  useEffect(() => {
    loadMetrics()
    loadExtra()
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadMetrics() {
    const { data } = await supabase.from('admin_metrics').select('*').single()
    if (data) setMetrics(data)
    setLoading(false)
  }

  async function loadExtra() {
    const results = await Promise.allSettled([
      supabase.from('cancellation_requests').select('status').eq('status', 'pending'),
      supabase.from('cancellation_requests').select('status').eq('status', 'done'),
      supabase.from('support_tickets').select('status').eq('status', 'open'),
      supabase.from('support_tickets').select('id'),
      supabase.from('video_calls').select('id').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('video_calls').select('duration_minutes').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ])

    const getCount = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value.data?.length ?? 0) : 0
    const getSum = (r: PromiseSettledResult<any>, field: string) =>
      r.status === 'fulfilled' ? (r.value.data ?? []).reduce((acc: number, row: any) => acc + (row[field] ?? 0), 0) : 0

    setExtra({
      cancel_pending: getCount(results[0]),
      cancel_done: getCount(results[1]),
      support_pending: getCount(results[2]),
      support_total: getCount(results[3]),
      video_sessions: getCount(results[4]),
      video_minutes: getSum(results[5], 'duration_minutes'),
    })
  }

  function openDrawer(filterKey: FilterKey, title: string) {
    setDrawer({ filterKey, title })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const m = metrics!
  const receita = (m.plan_essencial * 10) + (m.plan_plus * 39) + (m.plan_black * 100)
  const totalAssinantes = m.plan_essencial + m.plan_plus + m.plan_black
  const ticketMedio = totalAssinantes > 0 ? (receita / totalAssinantes).toFixed(2) : '0'
  const valorPorUsuario = m.total_users > 0 ? (receita / m.total_users).toFixed(2) : '0'

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)' }}>Dashboard</h1>
          <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '14px', marginTop: '4px' }}>Atualiza automaticamente a cada 30 segundos · Clique nos cards para ver os usuários</p>
        </div>
        <Link href="/admin/insights" style={{ fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={14} />
          Perfil de Clientes
        </Link>
      </div>

      <Section title="⚡ Agora">
        <div style={grid}>
          <Card label="Online agora"     value={m.online_now}            icon={Users}      color="#22c55e" sub="últimos 5 minutos"  onClick={() => openDrawer('online_now', 'Online agora')} />
          <Card label="Ativos hoje"      value={m.active_today}          icon={UserCheck}  color="#3b82f6"                          onClick={() => openDrawer('active_today', 'Ativos hoje')} />
          <Card label="Cadastros hoje"   value={m.new_today}             icon={TrendingUp} color="#a855f7"                          onClick={() => openDrawer('new_today', 'Cadastros hoje')} />
          <Card label="Assinantes hoje"  value={m.new_subscribers_today} icon={Heart}      color="#e11d48"                          onClick={() => openDrawer('new_subscribers_today', 'Novos assinantes hoje')} />
        </div>
      </Section>

      <Section title="👥 Usuários">
        <div style={grid}>
          <Card label="Total de usuários"      value={m.total_users}          icon={Users}     color="#e11d48" onClick={() => openDrawer('total_users', 'Todos os usuários')} />
          <Card label="Verificados"            value={m.total_verified}       icon={UserCheck} color="#22c55e" onClick={() => openDrawer('verified', 'Usuários verificados')} />
          <Card label="Aguardando verificação" value={m.pending_verification} icon={UserCheck} color="#f59e0b" onClick={() => openDrawer('pending_verification', 'Aguardando verificação')} />
          <Card label="Banidos"                value={m.total_banned}         icon={Ban}       color="#ef4444" onClick={() => openDrawer('banned', 'Usuários banidos')} />
          <Card label="Excluíram a conta"      value={m.total_deleted}        icon={Ban}       color="#6b7280" onClick={() => openDrawer('deleted', 'Contas excluídas')} />
        </div>
      </Section>

      <Section title="💳 Assinaturas ativas">
        <div style={grid}>
          <Card label="Essencial — R$10/mês" value={m.plan_essencial} icon={Heart} color="#6b7280" sub={`≈ R$${(m.plan_essencial * 10).toLocaleString('pt-BR')}/mês`} onClick={() => openDrawer('plan_essencial', 'Plano Essencial')} />
          <Card label="Plus — R$39/mês"      value={m.plan_plus}      icon={Heart} color="#3b82f6" sub={`≈ R$${(m.plan_plus * 39).toLocaleString('pt-BR')}/mês`}    onClick={() => openDrawer('plan_plus', 'Plano Plus')} />
          <Card label="Black — R$100/mês"    value={m.plan_black}     icon={Heart} color="#f59e0b" sub={`≈ R$${(m.plan_black * 100).toLocaleString('pt-BR')}/mês`}  onClick={() => openDrawer('plan_black', 'Plano Black')} />
          <Card label="Receita estimada/mês" value={`R$${receita.toLocaleString('pt-BR')}`} icon={TrendingUp} color="#22c55e" />
        </div>
      </Section>

      <Section title="🚨 Moderação">
        <div style={grid}>
          <Card label="Denúncias pendentes"    value={m.reports_pending}    icon={Flag} color="#ef4444" linkTo="/admin/denuncias" />
          <Card label="Denúncias resolvidas"   value={m.reports_resolved}   icon={Flag} color="#22c55e" linkTo="/admin/denuncias" />
          <Card label="Indicações totais"      value={m.referrals_total}    icon={Gift} color="#a855f7" />
          <Card label="Indicações convertidas" value={m.referrals_converted} icon={Gift} color="#22c55e"
            sub={m.referrals_total > 0 ? `${Math.round((m.referrals_converted / m.referrals_total) * 100)}% de conversão` : undefined} />
        </div>
      </Section>

      <Section title="📋 Cancelamentos e Suporte">
        <div style={grid}>
          <Card label="Cancelamentos pendentes"   value={extra.cancel_pending}  icon={XCircle}        color="#ef4444" sub="aguardando processamento" linkTo="/admin/cancelamentos" />
          <Card label="Cancelamentos processados" value={extra.cancel_done}     icon={XCircle}        color="#22c55e" sub="concluídos"               linkTo="/admin/cancelamentos" />
          <Card label="Pedidos de suporte abertos" value={extra.support_pending} icon={MessageSquare} color="#f59e0b" sub={extra.support_total > 0 ? `de ${extra.support_total} total` : 'total'} />
          <Card label="Total de pedidos suporte"   value={extra.support_total}   icon={MessageSquare} color="#6b7280" />
        </div>
      </Section>

      <Section title="📹 Videochamadas (últimos 30 dias)">
        <div style={grid}>
          <Card label="Sessões realizadas" value={extra.video_sessions} icon={Video} color="#3b82f6" />
          <Card label="Minutos totais"     value={extra.video_minutes > 0 ? extra.video_minutes.toLocaleString('pt-BR') : '—'} icon={Video} color="#a855f7" sub={extra.video_minutes > 0 ? `≈ ${Math.round(extra.video_minutes / 60)}h` : undefined} />
        </div>
      </Section>

      <Section title="💰 Métricas de Valor">
        <div style={grid}>
          <Card label="Receita estimada/mês"  value={`R$${receita.toLocaleString('pt-BR')}`}    icon={DollarSign} color="#22c55e" />
          <Card label="Ticket médio"           value={`R$${ticketMedio}`}                         icon={DollarSign} color="#3b82f6" sub="entre assinantes" />
          <Card label="Valor médio por usuário" value={`R$${valorPorUsuario}`}                   icon={DollarSign} color="#a855f7" sub="receita / total de usuários" />
          <Card label="Taxa de conversão"      value={m.total_users > 0 ? `${((totalAssinantes / m.total_users) * 100).toFixed(1)}%` : '—'} icon={TrendingUp} color="#f59e0b" sub="usuários → assinantes" />
        </div>
      </Section>

      {drawer && (
        <UserDrawer
          filterKey={drawer.filterKey}
          title={drawer.title}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(248,249,250,0.40)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '12px',
}

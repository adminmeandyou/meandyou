'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { X, BarChart2 } from 'lucide-react'

interface ClientProfile {
  id: string
  name: string
  email: string
  plan: string
  age: number | null
  gender: string | null
  religion: string | null
  city: string | null
  state: string | null
  photo_best: string | null
  created_at: string
  verified: boolean
  estimated_spend: number
}

interface DemogGroup {
  label: string
  count: number
  pct: number
}

type FilterType = 'all' | 'black' | 'plus' | 'essencial'
type DemogField = 'gender' | 'age_group' | 'religion' | 'state'

const PLAN_PRICE: Record<string, number> = { black: 100, plus: 39, essencial: 10 }
const PLAN_COLORS: Record<string, string> = { black: '#f59e0b', plus: '#3b82f6', essencial: '#6b7280' }

function ageGroup(age: number | null): string {
  if (!age) return 'Não informado'
  if (age < 25) return '18-24'
  if (age < 30) return '25-29'
  if (age < 35) return '30-34'
  if (age < 40) return '35-39'
  if (age < 50) return '40-49'
  return '50+'
}

function buildGroups(clients: ClientProfile[], field: DemogField): DemogGroup[] {
  const map: Record<string, number> = {}
  clients.forEach(c => {
    const key = field === 'age_group'
      ? ageGroup(c.age)
      : field === 'gender' ? (c.gender || 'Não informado')
      : field === 'religion' ? (c.religion || 'Não informado')
      : (c.state || 'Não informado')
    map[key] = (map[key] || 0) + 1
  })
  const total = clients.length || 1
  return Object.entries(map)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

// ── Drawer de usuários ───────────────────────────────────────────────────

function ClientDrawer({ clients, title, onClose }: { clients: ClientProfile[]; title: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
      <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={onClose} />
      <div style={{ width: '680px', maxWidth: '96vw', backgroundColor: '#0F1117', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{title}</p>
            <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '2px' }}>{clients.length} usuário{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.40)', padding: '4px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(248,249,250,0.40)' }}>Nenhum usuário neste grupo</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clients.map(c => (
                <div key={c.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#13161F', backgroundImage: c.photo_best ? `url(${c.photo_best})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: 'rgba(248,249,250,0.40)' }}>
                    {!c.photo_best && '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{c.name || 'Sem nome'}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '6px', backgroundColor: (PLAN_COLORS[c.plan] || '#333') + '22', color: PLAN_COLORS[c.plan] || '#555', border: `1px solid ${(PLAN_COLORS[c.plan] || '#333')}33` }}>
                        {c.plan}
                      </span>
                      {c.verified && <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '6px', color: '#22c55e', backgroundColor: '#22c55e18' }}>verificado</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.email}{c.age ? ` · ${c.age} anos` : ''}{c.gender ? ` · ${c.gender}` : ''}{c.city ? ` · ${c.city}` : ''}{c.state ? `/${c.state}` : ''}
                      {c.religion ? ` · ${c.religion}` : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '1px' }}>
                      Gasto estimado: <span style={{ color: '#22c55e' }}>R${c.estimated_spend}/mês</span>
                      {' '}· Cadastro: {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <a href={`/perfil/${c.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.50)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Ver perfil
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bloco de distribuição demográfica ────────────────────────────────────

function DemogBlock({ title, groups, clients, fieldKey }: { title: string; groups: DemogGroup[]; clients: ClientProfile[]; fieldKey: DemogField }) {
  const [drawer, setDrawer] = useState<{ label: string; list: ClientProfile[] } | null>(null)
  const max = groups[0]?.count || 1

  function openGroup(label: string) {
    const list = clients.filter(c => {
      const val = fieldKey === 'age_group' ? ageGroup(c.age)
        : fieldKey === 'gender' ? (c.gender || 'Não informado')
        : fieldKey === 'religion' ? (c.religion || 'Não informado')
        : (c.state || 'Não informado')
      return val === label
    })
    setDrawer({ label, list })
  }

  return (
    <>
      <div style={{ backgroundColor: '#0F1117', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(248,249,250,0.40)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {groups.slice(0, 8).map(g => (
            <div
              key={g.label}
              onClick={() => openGroup(g.label)}
              style={{ cursor: 'pointer' }}
              title={`Ver ${g.count} usuários`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#ccc' }}>{g.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)' }}>{g.count} ({g.pct}%)</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#13161F', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(g.count / max) * 100}%`, backgroundColor: '#e11d48', borderRadius: '3px', transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
          {groups.length === 0 && <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.40)' }}>Nenhum dado disponível</p>}
        </div>
      </div>
      {drawer && (
        <ClientDrawer
          clients={drawer.list}
          title={`${title}: ${drawer.label}`}
          onClose={() => setDrawer(null)}
        />
      )}
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────

export default function InsightsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [planFilter, setPlanFilter] = useState<FilterType>('all')
  const [allDrawer, setAllDrawer] = useState(false)

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .not('plan', 'in', '("free")')
      .order('plan', { ascending: false })
      .limit(500)

    const mapped: ClientProfile[] = (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      age: u.age ?? null,
      gender: u.gender ?? null,
      religion: u.religion ?? null,
      city: u.city ?? null,
      state: u.state ?? null,
      photo_best: u.photo_best ?? null,
      created_at: u.created_at,
      verified: u.verified ?? false,
      estimated_spend: PLAN_PRICE[u.plan] ?? 0,
    }))

    setClients(mapped)
    setLoading(false)
  }

  const filtered = planFilter === 'all' ? clients : clients.filter(c => c.plan === planFilter)
  const totalReceita = filtered.reduce((acc, c) => acc + c.estimated_spend, 0)

  const FILTERS: { key: FilterType; label: string; color: string }[] = [
    { key: 'all',      label: `Todos (${clients.length})`,                               color: '#e11d48' },
    { key: 'black',    label: `Black (${clients.filter(c => c.plan === 'black').length})`,  color: '#f59e0b' },
    { key: 'plus',     label: `Plus (${clients.filter(c => c.plan === 'plus').length})`,    color: '#3b82f6' },
    { key: 'essencial',label: `Essencial (${clients.filter(c => c.plan === 'essencial').length})`, color: '#6b7280' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <BarChart2 size={20} color="#e11d48" />
          <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)' }}>Perfil de Clientes</h1>
        </div>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '14px' }}>Distribuição demográfica dos usuários pagantes — clique em qualquer barra para ver os usuários</p>
      </div>

      {/* Filtros de plano */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setPlanFilter(f.key)}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: `1px solid ${planFilter === f.key ? f.color + '66' : '#2a2a2a'}`,
              backgroundColor: planFilter === f.key ? f.color + '18' : 'transparent',
              color: planFilter === f.key ? f.color : '#666',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setAllDrawer(true)}
          style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'transparent', color: '#aaa', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          Ver lista completa
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Clientes neste filtro', value: filtered.length.toString() },
          { label: 'Receita estimada/mês',  value: `R$${totalReceita.toLocaleString('pt-BR')}` },
          { label: 'Ticket médio',          value: filtered.length > 0 ? `R$${(totalReceita / filtered.length).toFixed(0)}` : '—' },
          { label: 'Taxa verificados',      value: filtered.length > 0 ? `${Math.round((filtered.filter(c => c.verified).length / filtered.length) * 100)}%` : '—' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#0F1117', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginBottom: '6px' }}>{k.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', color: '#fff' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Blocos demográficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <DemogBlock title="Por Gênero"      groups={buildGroups(filtered, 'gender')}    clients={filtered} fieldKey="gender" />
        <DemogBlock title="Por Faixa Etária" groups={buildGroups(filtered, 'age_group')} clients={filtered} fieldKey="age_group" />
        <DemogBlock title="Por Religião"    groups={buildGroups(filtered, 'religion')}  clients={filtered} fieldKey="religion" />
        <DemogBlock title="Por Estado"      groups={buildGroups(filtered, 'state')}     clients={filtered} fieldKey="state" />
      </div>

      {allDrawer && (
        <ClientDrawer
          clients={filtered}
          title={`Clientes — ${FILTERS.find(f => f.key === planFilter)?.label}`}
          onClose={() => setAllDrawer(false)}
        />
      )}
    </div>
  )
}

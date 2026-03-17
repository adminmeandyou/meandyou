'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Search, Edit2, Trash2, Award, Users, CheckCircle, XCircle, Zap } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RARIDADES = ['comum', 'incomum', 'raro', 'lendario']
const RARIDADE_CORES: Record<string, string> = {
  comum: '#9ca3af', incomum: '#34d399', raro: '#60a5fa', lendario: '#f59e0b',
}
const CONDITION_TYPES = [
  { value: 'manual', label: 'Manual (admin concede)' },
  { value: 'on_verify', label: 'Ao verificar identidade' },
  { value: 'on_join', label: 'Ao criar conta' },
  { value: 'invited_x', label: 'Ao convidar X pessoas' },
  { value: 'match_x', label: 'Ao fazer X matches' },
  { value: 'msg_x', label: 'Ao enviar X mensagens' },
  { value: 'took_bolo', label: 'Ao reportar bolo' },
  { value: 'profile_complete', label: 'Perfil 100% completo' },
]

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  requirement_description: string | null
  condition_type: string
  condition_value: any
  is_active: boolean
  is_published: boolean
  user_count?: number
}

const EMPTY_BADGE: Omit<Badge, 'id'> = {
  name: '', description: '', icon: '🏆', rarity: 'comum',
  requirement_description: '', condition_type: 'manual',
  condition_value: null, is_active: true, is_published: false,
}

export default function AdminEmblemas() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroRaridade, setFiltroRaridade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState<'criar' | 'editar' | null>(null)
  const [form, setForm] = useState<Omit<Badge, 'id'>>(EMPTY_BADGE)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [implementando, setImplementando] = useState<string | null>(null)
  const [confirmarDelete, setConfirmarDelete] = useState<string | null>(null)

  useEffect(() => { loadBadges() }, [])

  async function loadBadges() {
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*, badge_user_counts(user_count)')
      .order('created_at', { ascending: false })
    setBadges((data ?? []).map((b: any) => ({
      ...b, user_count: b.badge_user_counts?.[0]?.user_count ?? 0,
    })))
    setLoading(false)
  }

  const filtrados = badges.filter(b => {
    if (busca && !b.name.toLowerCase().includes(busca.toLowerCase())) return false
    if (filtroRaridade && b.rarity !== filtroRaridade) return false
    if (filtroStatus === 'ativo' && !b.is_active) return false
    if (filtroStatus === 'inativo' && b.is_active) return false
    if (filtroStatus === 'publicado' && !b.is_published) return false
    return true
  })

  function abrirCriar() {
    setForm(EMPTY_BADGE)
    setEditandoId(null)
    setModal('criar')
  }

  function abrirEditar(b: Badge) {
    setForm({ name: b.name, description: b.description, icon: b.icon, rarity: b.rarity,
      requirement_description: b.requirement_description ?? '', condition_type: b.condition_type,
      condition_value: b.condition_value, is_active: b.is_active, is_published: b.is_published })
    setEditandoId(b.id)
    setModal('editar')
  }

  async function salvar() {
    if (!form.name.trim()) return
    setSalvando(true)
    const payload = { ...form, condition_value: form.condition_value || null }
    if (modal === 'criar') {
      await supabase.from('badges').insert(payload)
    } else if (editandoId) {
      await supabase.from('badges').update(payload).eq('id', editandoId)
    }
    setSalvando(false)
    setModal(null)
    loadBadges()
  }

  async function deletar(id: string) {
    await supabase.from('badges').delete().eq('id', id)
    setConfirmarDelete(null)
    loadBadges()
  }

  async function togglePublicado(b: Badge) {
    await supabase.from('badges').update({ is_published: !b.is_published }).eq('id', b.id)
    loadBadges()
  }

  async function implementarAgora(b: Badge) {
    setImplementando(b.id)
    await fetch('/api/badges/auto-award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badgeId: b.id }),
    })
    setImplementando(null)
    loadBadges()
  }

  const s = { // styles shorthand
    card: { backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '16px' } as React.CSSProperties,
    label: { fontSize: '12px', color: '#555', fontWeight: 600, marginBottom: '6px', display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '8px 12px', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: '#fff', margin: '0 0 4px' }}>Emblemas</h1>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>{badges.length} emblemas cadastrados</p>
        </div>
        <button onClick={abrirCriar} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#e11d48', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
          <Plus size={16} /> Novo emblema
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
          <Search size={14} color="#555" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..."
            style={{ ...s.input, paddingLeft: '32px' }} />
        </div>
        <select value={filtroRaridade} onChange={e => setFiltroRaridade(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="">Todas raridades</option>
          {RARIDADES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="publicado">Publicados</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtrados.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: '48px', color: '#444' }}>
              <Award size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Nenhum emblema encontrado.</p>
            </div>
          )}
          {filtrados.map(b => (
            <div key={b.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{b.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{b.name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: RARIDADE_CORES[b.rarity] + '18', color: RARIDADE_CORES[b.rarity] }}>
                    {b.rarity}
                  </span>
                  {b.is_published && <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: '#10b98120', color: '#10b981' }}>publicado</span>}
                  {!b.is_active && <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f87171' + '20', color: '#f87171' }}>inativo</span>}
                </div>
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#444' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={11} /> {b.user_count ?? 0} usuários</span>
                  <span>{CONDITION_TYPES.find(c => c.value === b.condition_type)?.label ?? b.condition_type}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => implementarAgora(b)} title="Implementar agora"
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: implementando === b.id ? '#1a1a1a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {implementando === b.id
                    ? <div style={{ width: '14px', height: '14px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <Zap size={14} color="#f59e0b" />}
                </button>
                <button onClick={() => togglePublicado(b)} title={b.is_published ? 'Despublicar' : 'Publicar'}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {b.is_published ? <XCircle size={14} color="#f87171" /> : <CheckCircle size={14} color="#10b981" />}
                </button>
                <button onClick={() => abrirEditar(b)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Edit2 size={14} color="#aaa" />
                </button>
                <button onClick={() => setConfirmarDelete(b.id)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={14} color="#f87171" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: '0 0 20px' }}>
              {modal === 'criar' ? 'Novo emblema' : 'Editar emblema'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Ícone (emoji)</label>
                  <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={{ ...s.input, fontSize: '22px', textAlign: 'center' }} maxLength={2} />
                </div>
                <div>
                  <label style={s.label}>Nome / Título</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pioneiro do Lançamento" style={s.input} />
                </div>
              </div>

              <div>
                <label style={s.label}>Descrição</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Explica o que esse emblema representa..." rows={2}
                  style={{ ...s.input, resize: 'vertical' }} />
              </div>

              <div>
                <label style={s.label}>O que é preciso para conquistar (visível ao usuário)</label>
                <input value={form.requirement_description ?? ''} onChange={e => setForm(p => ({ ...p, requirement_description: e.target.value }))}
                  placeholder="Ex: Entrou no app durante o lançamento" style={s.input} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Raridade</label>
                  <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))} style={s.input}>
                    {RARIDADES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Condição de concessão</label>
                  <select value={form.condition_type} onChange={e => setForm(p => ({ ...p, condition_type: e.target.value }))} style={s.input}>
                    {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {(form.condition_type === 'invited_x' || form.condition_type === 'match_x' || form.condition_type === 'msg_x') && (
                <div>
                  <label style={s.label}>Quantidade necessária</label>
                  <input type="number" min={1}
                    value={form.condition_value?.count ?? ''}
                    onChange={e => setForm(p => ({ ...p, condition_value: { count: parseInt(e.target.value) } }))}
                    style={{ ...s.input, width: '120px' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#aaa', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                  Ativo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#aaa', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                  Publicado (visível aos usuários)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #333', backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.name.trim()} style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: salvando ? '#333' : '#e11d48', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer' }}>
                {salvando ? 'Salvando...' : modal === 'criar' ? 'Criar emblema' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar delete */}
      {confirmarDelete && (
        <div onClick={() => setConfirmarDelete(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ color: '#fff', fontFamily: 'var(--font-fraunces)', marginBottom: '8px' }}>Excluir emblema?</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Esta ação remove o emblema de todos os usuários que o possuem.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => deletar(confirmarDelete)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f87171', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

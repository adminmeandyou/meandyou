'use client'

import { useEffect, useState } from 'react'
import {
  Gift, RotateCcw, Loader2, Plus, Trash2, Save, Eye,
  Star, Zap, Search, Ghost, Crown, Ticket, AlertTriangle,
} from 'lucide-react'

// ─── Labels e ícones em português ────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; cor: string; icon: React.ReactNode }> = {
  ticket:        { label: 'Ticket da Roleta',  cor: '#eab308', icon: <Ticket size={15} strokeWidth={1.5} /> },
  supercurtida:  { label: 'SuperCurtida',      cor: '#ec4899', icon: <Star   size={15} strokeWidth={1.5} /> },
  boost:         { label: 'Boost',              cor: '#b8f542', icon: <Zap    size={15} strokeWidth={1.5} /> },
  lupa:          { label: 'Lupa',               cor: '#3b82f6', icon: <Search size={15} strokeWidth={1.5} /> },
  rewind:        { label: 'Desfazer',           cor: '#a855f7', icon: <RotateCcw size={15} strokeWidth={1.5} /> },
  invisivel_1d:  { label: 'Invisível 1 dia',    cor: '#9ca3af', icon: <Ghost  size={15} strokeWidth={1.5} /> },
  plan_plus_1d:  { label: '1 dia Plus',         cor: '#8b5cf6', icon: <Crown  size={15} strokeWidth={1.5} /> },
  plan_black_1d: { label: '1 dia Black',        cor: '#F8F9FA', icon: <Crown  size={15} strokeWidth={1.5} /> },
}

const TIPOS_DISPONIVEIS = Object.keys(TIPO_CONFIG)

function nomePremio(reward_type: string, reward_amount: number) {
  const cfg = TIPO_CONFIG[reward_type]
  const label = cfg?.label ?? reward_type
  return `${reward_amount}x ${label}`
}

// ─── Tipos ────────────────────────────────────────────────────────────────
interface RoletaPrize {
  id: string
  reward_type: string
  reward_amount: number
  weight: number
  active: boolean
}

interface CalendarioEntry {
  day_number: number
  reward_type: string
  reward_amount: number
}

// ─── Barra de chance visual ───────────────────────────────────────────────
function BarraChance({ weight, total }: { weight: number; total: number }) {
  const pct = total > 0 ? Math.round((weight / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', borderRadius: 100, backgroundColor: '#E11D48', width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#F8F9FA', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

// ─── Modal de edição ─────────────────────────────────────────────────────
function ModalEditar({
  prize, total, onSave, onClose,
}: {
  prize: RoletaPrize | null
  total: number
  onSave: (data: Partial<RoletaPrize>) => Promise<void>
  onClose: () => void
}) {
  const [tipo, setTipo] = useState(prize?.reward_type ?? 'ticket')
  const [qtd, setQtd] = useState(String(prize?.reward_amount ?? 1))
  const [peso, setPeso] = useState(String(prize?.weight ?? 10))
  const [ativo, setAtivo] = useState(prize?.active ?? true)
  const [saving, setSaving] = useState(false)

  const pesoNum = Number(peso) || 0
  const totalNovo = prize ? total - prize.weight + pesoNum : total + pesoNum
  const pct = totalNovo > 0 ? Math.round((pesoNum / totalNovo) * 100) : 0

  async function handleSave() {
    setSaving(true)
    await onSave({ reward_type: tipo, reward_amount: Number(qtd), weight: pesoNum, active: ativo })
    setSaving(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: '50% auto auto 50%', transform: 'translate(-50%,-50%)', zIndex: 50, backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, width: 'min(420px, calc(100vw - 32px))' }}>
        <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#F8F9FA', margin: '0 0 20px' }}>
          {prize ? 'Editar prêmio' : 'Novo prêmio'}
        </h3>

        {/* Tipo */}
        <label style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)', marginBottom: 6, display: 'block' }}>Tipo de prêmio</label>
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.08)', color: '#F8F9FA', fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-jakarta)' }}
        >
          {TIPOS_DISPONIVEIS.map(t => (
            <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>
          ))}
        </select>

        {/* Quantidade */}
        <label style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)', marginBottom: 6, display: 'block' }}>Quantidade</label>
        <input
          type="number" min={1} max={100} value={qtd}
          onChange={e => setQtd(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.08)', color: '#F8F9FA', fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
        />

        {/* Peso */}
        <label style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)', marginBottom: 6, display: 'block' }}>
          Peso (mais peso = mais chance). Chance atual: <strong style={{ color: '#E11D48' }}>{pct}%</strong>
        </label>
        <input
          type="number" min={1} max={9999} value={peso}
          onChange={e => setPeso(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.08)', color: '#F8F9FA', fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
        />
        <input
          type="range" min={1} max={200} value={pesoNum}
          onChange={e => setPeso(e.target.value)}
          style={{ width: '100%', accentColor: '#E11D48', marginBottom: 16 }}
        />

        {/* Ativo */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <div
            onClick={() => setAtivo(v => !v)}
            style={{ width: 40, height: 22, borderRadius: 100, backgroundColor: ativo ? '#E11D48' : 'rgba(255,255,255,0.10)', transition: 'background 0.2s', position: 'relative', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 3, left: ativo ? 20 : 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 13, color: '#F8F9FA' }}>Prêmio ativo</span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: 'rgba(248,249,250,0.5)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: saving ? 'rgba(225,29,72,0.4)' : '#E11D48', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={15} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function AdminRecompensasPage() {
  const [aba, setAba] = useState<'roleta' | 'calendario'>('roleta')

  // Roleta
  const [premios, setPremios] = useState<RoletaPrize[]>([])
  const [loadingRoleta, setLoadingRoleta] = useState(true)
  const [editando, setEditando] = useState<RoletaPrize | 'novo' | null>(null)

  // Calendário
  const [calendario, setCalendario] = useState<CalendarioEntry[]>([])
  const [loadingCal, setLoadingCal] = useState(true)
  const [editandoDia, setEditandoDia] = useState<CalendarioEntry | null>(null)
  const [savingDia, setSavingDia] = useState<number | null>(null)

  // Feedback
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  function showMsg(tipo: 'ok' | 'erro', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3000)
  }

  useEffect(() => {
    carregarRoleta()
    carregarCalendario()
  }, [])

  async function carregarRoleta() {
    setLoadingRoleta(true)
    const res = await fetch('/api/admin/recompensas?type=roleta')
    const json = await res.json()
    setPremios(json.data ?? [])
    setLoadingRoleta(false)
  }

  async function carregarCalendario() {
    setLoadingCal(true)
    const res = await fetch('/api/admin/recompensas?type=calendario')
    const json = await res.json()
    setCalendario(json.data ?? [])
    setLoadingCal(false)
  }

  const totalPeso = premios.filter(p => p.active).reduce((s, p) => s + p.weight, 0)

  // ─── Ações roleta ─────────────────────────────────────────────────────
  async function salvarPremio(dados: Partial<RoletaPrize>) {
    if (editando === 'novo') {
      const res = await fetch('/api/admin/recompensas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'roleta', ...dados }),
      })
      if (res.ok) { showMsg('ok', 'Prêmio criado!'); await carregarRoleta() }
      else showMsg('erro', 'Erro ao criar prêmio')
    } else if (editando) {
      const res = await fetch('/api/admin/recompensas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'roleta', id: editando.id, ...dados }),
      })
      if (res.ok) { showMsg('ok', 'Prêmio atualizado!'); await carregarRoleta() }
      else showMsg('erro', 'Erro ao atualizar prêmio')
    }
    setEditando(null)
  }

  async function excluirPremio(id: string) {
    if (!confirm('Excluir este prêmio da roleta?')) return
    const res = await fetch(`/api/admin/recompensas?id=${id}`, { method: 'DELETE' })
    if (res.ok) { showMsg('ok', 'Prêmio removido'); await carregarRoleta() }
    else showMsg('erro', 'Erro ao remover')
  }

  // ─── Ações calendário ─────────────────────────────────────────────────
  async function salvarDia(day_number: number, reward_type: string, reward_amount: number) {
    setSavingDia(day_number)
    const res = await fetch('/api/admin/recompensas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'calendario', day_number, reward_type, reward_amount }),
    })
    if (res.ok) {
      setCalendario(prev => prev.map(e => e.day_number === day_number ? { ...e, reward_type, reward_amount } : e))
      showMsg('ok', `Dia ${day_number} salvo!`)
    } else {
      showMsg('erro', 'Erro ao salvar dia')
    }
    setSavingDia(null)
    setEditandoDia(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-jakarta)' }}>

      {/* Toast */}
      {msg && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, padding: '12px 20px', borderRadius: 12, backgroundColor: msg.tipo === 'ok' ? '#10b981' : '#E11D48', color: '#fff', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {msg.texto}
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#F8F9FA', marginBottom: 6 }}>Recompensas</h1>
      <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.45)', marginBottom: 24 }}>Gerencie os prêmios da roleta, caixas e calendário diário</p>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
        {([
          { id: 'roleta',    label: 'Roleta e Caixas' },
          { id: 'calendario', label: 'Calendário Diário' },
        ] as const).map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', backgroundColor: aba === a.id ? '#E11D48' : 'transparent', color: aba === a.id ? '#fff' : 'rgba(248,249,250,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.15s' }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA: Roleta e Caixas ─────────────────────────────────────── */}
      {aba === 'roleta' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.5)', margin: 0 }}>
                Os prêmios abaixo são usados tanto na roleta (com ticket) quanto na caixa surpresa (com fichas).
              </p>
              <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.3)', margin: '4px 0 0' }}>
                Peso total ativo: {totalPeso} pontos
              </p>
            </div>
            <button
              onClick={() => setEditando('novo')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: '#E11D48', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} />
              Novo prêmio
            </button>
          </div>

          {loadingRoleta ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={22} color="#E11D48" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {premios.map(p => {
                const cfg = TIPO_CONFIG[p.reward_type]
                const pct = totalPeso > 0 ? Math.round((p.weight / totalPeso) * 100) : 0
                return (
                  <div
                    key={p.id}
                    style={{ backgroundColor: '#0F1117', border: `1px solid ${p.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`, borderRadius: 14, padding: '14px 16px', opacity: p.active ? 1 : 0.45 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Ícone */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${cfg?.cor ?? '#666'}22`, border: `1px solid ${cfg?.cor ?? '#666'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg?.cor ?? '#F8F9FA', flexShrink: 0 }}>
                        {cfg?.icon ?? <Gift size={15} />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8F9FA' }}>{nomePremio(p.reward_type, p.reward_amount)}</span>
                          {!p.active && <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', backgroundColor: 'rgba(107,114,128,0.15)', borderRadius: 100, padding: '2px 8px' }}>INATIVO</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.4)' }}>Peso: {p.weight}</span>
                          {p.active && <BarraChance weight={p.weight} total={totalPeso} />}
                        </div>
                      </div>

                      {/* Ações */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setEditando(p)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: 'rgba(248,249,250,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => excluirPremio(p.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(225,29,72,0.2)', backgroundColor: 'rgba(225,29,72,0.08)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Aviso */}
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.20)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color="#eab308" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)', margin: 0, lineHeight: 1.5 }}>
              Alterar pesos afeta imediatamente a probabilidade em novos giros da roleta e aberturas de caixa surpresa. Prêmios inativos não entram no sorteio.
            </p>
          </div>
        </div>
      )}

      {/* ── ABA: Calendário Diário ────────────────────────────────────── */}
      {aba === 'calendario' && (
        <div>
          <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.5)', margin: '0 0 16px' }}>
            Define o prêmio de cada dia do ciclo de 30 dias. Novos usuários e extensões de ciclo usam este template.
          </p>

          {loadingCal ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={22} color="#E11D48" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {calendario.map(entry => {
                const cfg = TIPO_CONFIG[entry.reward_type]
                const isEdit = editandoDia?.day_number === entry.day_number
                const saving = savingDia === entry.day_number

                return (
                  <div
                    key={entry.day_number}
                    style={{ backgroundColor: '#0F1117', border: `1px solid ${isEdit ? 'rgba(225,29,72,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: 14, transition: 'border-color 0.2s' }}
                  >
                    {/* Cabeçalho do dia */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(248,249,250,0.45)' }}>{entry.day_number}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: cfg?.cor ?? '#F8F9FA' }}>
                        {cfg?.icon}
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg?.cor ?? '#F8F9FA' }}>
                          {entry.reward_amount}x {cfg?.label ?? entry.reward_type}
                        </span>
                      </div>
                    </div>

                    {/* Formulário inline */}
                    {isEdit ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select
                          value={editandoDia.reward_type}
                          onChange={e => setEditandoDia(d => d ? { ...d, reward_type: e.target.value } : d)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.08)', color: '#F8F9FA', fontSize: 12, fontFamily: 'var(--font-jakarta)' }}
                        >
                          {TIPOS_DISPONIVEIS.map(t => (
                            <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="number" min={1} max={100}
                            value={editandoDia.reward_amount}
                            onChange={e => setEditandoDia(d => d ? { ...d, reward_amount: Number(e.target.value) } : d)}
                            style={{ width: 60, padding: '7px 10px', borderRadius: 8, backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.08)', color: '#F8F9FA', fontSize: 12, fontFamily: 'var(--font-jakarta)' }}
                          />
                          <button
                            onClick={() => salvarDia(editandoDia.day_number, editandoDia.reward_type, editandoDia.reward_amount)}
                            disabled={saving}
                            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', backgroundColor: saving ? 'rgba(225,29,72,0.4)' : '#E11D48', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          >
                            {saving ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={12} />}
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditandoDia(null)}
                            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: 'rgba(248,249,250,0.4)', fontSize: 12, cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditandoDia({ ...entry })}
                        style={{ width: '100%', padding: '6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(248,249,250,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)', margin: 0, lineHeight: 1.5 }}>
              Alterações no template valem apenas para calendários gerados a partir de agora. Usuários com calendário ativo mantêm os prêmios já definidos.
            </p>
          </div>
        </div>
      )}

      {/* Modal edição roleta */}
      {editando !== null && (
        <ModalEditar
          prize={editando === 'novo' ? null : editando}
          total={totalPeso}
          onSave={salvarPremio}
          onClose={() => setEditando(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

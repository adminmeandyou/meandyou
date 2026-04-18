'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Globe, Lock, Rocket, Heart, DollarSign, FileText, Eye, EyeOff, Pencil } from 'lucide-react'

type Modo = 'normal' | 'lancamento' | 'gated'

interface SiteConfig {
  id: number
  modo_site: Modo
  lancamento_ativo: boolean
  lancamento_inicio: string | null
  lancamento_fim: string | null
  lancamento_desconto_pct: number
  gate_ativo: boolean
  gate_senha: string
  gate_titulo: string
  gate_mensagem: string
  obrigado_titulo: string
  obrigado_mensagem: string
  obrigado_msg_essencial: string
  obrigado_msg_plus: string
  obrigado_msg_black: string
  preco_essencial: number
  preco_plus: number
  preco_black: number
}

interface LandingRow {
  id: string
  secao: string
  chave: string
  valor: string
  tipo: string
  pagina: string
  ordem: number
}

type AbaId = 'modo' | 'gate' | 'lancamento' | 'obrigado' | 'precos' | 'textos'

const ABAS: { id: AbaId; label: string; icon: React.ElementType }[] = [
  { id: 'modo',       label: 'Modo do site', icon: Globe },
  { id: 'gate',       label: 'Gate',         icon: Lock },
  { id: 'lancamento', label: 'Lançamento',   icon: Rocket },
  { id: 'obrigado',   label: 'Obrigado',     icon: Heart },
  { id: 'precos',     label: 'Preços',       icon: DollarSign },
  { id: 'textos',     label: 'Textos',       icon: FileText },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  backgroundColor: '#13161F',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#F8F9FA',
  fontSize: 14,
  fontFamily: 'var(--font-jakarta)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(248,249,250,0.6)',
  marginBottom: 6,
  display: 'block',
  fontWeight: 600,
}

const helpStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(248,249,250,0.4)',
  marginTop: 4,
  lineHeight: 1.5,
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 100,
          backgroundColor: value ? '#E11D48' : 'rgba(255,255,255,0.10)',
          transition: 'background 0.2s', position: 'relative', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%',
          backgroundColor: '#fff', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#F8F9FA' }}>{label}</span>
    </label>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#0F1117',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: 20,
    }}>
      {children}
    </div>
  )
}

function BotaoSalvar({ saving, onClick, label = 'Salvar alterações' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        padding: '11px 20px',
        borderRadius: 10,
        border: 'none',
        backgroundColor: saving ? 'rgba(225,29,72,0.4)' : '#E11D48',
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-jakarta)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {saving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={15} />}
      {saving ? 'Salvando...' : label}
    </button>
  )
}

export default function AdminSitePage() {
  const [aba, setAba] = useState<AbaId>('modo')
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [landing, setLanding] = useState<LandingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [valorEdicao, setValorEdicao] = useState('')

  function showMsg(tipo: 'ok' | 'erro', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3000)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/admin/site?type=config'),
        fetch('/api/admin/site?type=landing'),
      ])
      const j1 = await r1.json()
      const j2 = await r2.json()
      if (j1.data) setConfig(j1.data)
      if (j2.data) setLanding(j2.data)
    } catch {
      showMsg('erro', 'Erro ao carregar dados')
    }
    setLoading(false)
  }

  async function salvarConfig(patch: Partial<SiteConfig>) {
    if (!config) return
    setSaving(true)
    const res = await fetch('/api/admin/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'config', patch }),
    })
    if (res.ok) {
      setConfig({ ...config, ...patch })
      showMsg('ok', 'Alterações salvas!')
    } else {
      const j = await res.json().catch(() => ({}))
      showMsg('erro', j.error || 'Erro ao salvar')
    }
    setSaving(false)
  }

  async function salvarLanding(id: string, valor: string) {
    setSaving(true)
    const res = await fetch('/api/admin/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'landing', id, valor }),
    })
    if (res.ok) {
      setLanding(prev => prev.map(r => r.id === id ? { ...r, valor } : r))
      setEditandoId(null)
      showMsg('ok', 'Texto atualizado!')
    } else {
      showMsg('erro', 'Erro ao salvar texto')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Loader2 size={24} color="#E11D48" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!config) {
    return (
      <div style={{ padding: 24, color: '#F8F9FA', fontFamily: 'var(--font-jakarta)' }}>
        <p>Não foi possível carregar a configuração. Verifique se a migration `migration_site_config.sql` foi rodada no Supabase.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font-jakarta)' }}>
      {msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          padding: '12px 20px', borderRadius: 12,
          backgroundColor: msg.tipo === 'ok' ? '#10b981' : '#E11D48',
          color: '#fff', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {msg.texto}
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#F8F9FA', margin: '0 0 6px' }}>
        Site e Landing
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.45)', marginBottom: 24 }}>
        Edite textos, preços, gate e mensagens da landing sem tocar em código.
      </p>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12, padding: 4, overflowX: 'auto',
      }}>
        {ABAS.map(a => {
          const Icon = a.icon
          const ativo = aba === a.id
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              style={{
                flex: 1, minWidth: 110,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                backgroundColor: ativo ? '#E11D48' : 'transparent',
                color: ativo ? '#fff' : 'rgba(248,249,250,0.45)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-jakarta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} strokeWidth={1.7} />
              {a.label}
            </button>
          )
        })}
      </div>

      {aba === 'modo' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Modo do site</h2>
          <p style={helpStyle}>Escolha o que aparece quando alguém entra em meandyou.com.br.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0 20px' }}>
            {([
              { v: 'normal',     t: 'Normal',     d: 'Mostra a landing oficial do app' },
              { v: 'lancamento', t: 'Lançamento', d: 'Redireciona para a landing de lançamento' },
              { v: 'gated',      t: 'Fechado',    d: 'Pede senha para entrar (tela /acesso)' },
            ] as const).map(opt => {
              const selected = config.modo_site === opt.v
              return (
                <label
                  key={opt.v}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    backgroundColor: selected ? 'rgba(225,29,72,0.08)' : '#13161F',
                    border: `1px solid ${selected ? 'rgba(225,29,72,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    checked={selected}
                    onChange={() => setConfig({ ...config, modo_site: opt.v })}
                    style={{ accentColor: '#E11D48', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F8F9FA' }}>{opt.t}</div>
                    <div style={{ fontSize: 12, color: 'rgba(248,249,250,0.5)' }}>{opt.d}</div>
                  </div>
                </label>
              )
            })}
          </div>

          <BotaoSalvar saving={saving} onClick={() => salvarConfig({ modo_site: config.modo_site })} />
        </Card>
      )}

      {aba === 'gate' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Gate de acesso</h2>
          <p style={helpStyle}>Protege o site com senha. Ativa quando o modo do site está em <strong>Fechado</strong>.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '20px 0' }}>
            <Toggle
              value={config.gate_ativo}
              onChange={v => setConfig({ ...config, gate_ativo: v })}
              label={config.gate_ativo ? 'Gate ativo' : 'Gate desativado'}
            />

            <div>
              <label style={labelStyle}>Senha do gate</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={config.gate_senha}
                  onChange={e => setConfig({ ...config, gate_senha: e.target.value })}
                  style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="Digite a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(248,249,250,0.5)', padding: 4,
                  }}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Título exibido no gate</label>
              <input
                type="text"
                value={config.gate_titulo}
                onChange={e => setConfig({ ...config, gate_titulo: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Mensagem do gate</label>
              <textarea
                value={config.gate_mensagem}
                onChange={e => setConfig({ ...config, gate_mensagem: e.target.value })}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>
          </div>

          <BotaoSalvar saving={saving} onClick={() => salvarConfig({
            gate_ativo: config.gate_ativo,
            gate_senha: config.gate_senha,
            gate_titulo: config.gate_titulo,
            gate_mensagem: config.gate_mensagem,
          })} />
        </Card>
      )}

      {aba === 'lancamento' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Lançamento</h2>
          <p style={helpStyle}>Liga ou desliga a landing de lançamento e define o desconto da promoção.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '20px 0' }}>
            <Toggle
              value={config.lancamento_ativo}
              onChange={v => setConfig({ ...config, lancamento_ativo: v })}
              label={config.lancamento_ativo ? 'Lançamento ativo' : 'Lançamento desativado'}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Início da promoção</label>
                <input
                  type="datetime-local"
                  value={config.lancamento_inicio ? config.lancamento_inicio.slice(0, 16) : ''}
                  onChange={e => setConfig({ ...config, lancamento_inicio: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Fim da promoção</label>
                <input
                  type="datetime-local"
                  value={config.lancamento_fim ? config.lancamento_fim.slice(0, 16) : ''}
                  onChange={e => setConfig({ ...config, lancamento_fim: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Desconto (%)</label>
              <input
                type="number" min={0} max={100}
                value={config.lancamento_desconto_pct}
                onChange={e => setConfig({ ...config, lancamento_desconto_pct: Number(e.target.value) })}
                style={inputStyle}
              />
              <p style={helpStyle}>Aplicado sobre os preços base nos cards da landing de lançamento.</p>
            </div>
          </div>

          <BotaoSalvar saving={saving} onClick={() => salvarConfig({
            lancamento_ativo: config.lancamento_ativo,
            lancamento_inicio: config.lancamento_inicio,
            lancamento_fim: config.lancamento_fim,
            lancamento_desconto_pct: config.lancamento_desconto_pct,
          })} />
        </Card>
      )}

      {aba === 'obrigado' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Página de obrigado</h2>
          <p style={helpStyle}>Mensagens exibidas após a assinatura, com variação por plano.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '20px 0' }}>
            <div>
              <label style={labelStyle}>Título padrão</label>
              <input
                type="text"
                value={config.obrigado_titulo}
                onChange={e => setConfig({ ...config, obrigado_titulo: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Mensagem padrão</label>
              <textarea
                value={config.obrigado_mensagem}
                onChange={e => setConfig({ ...config, obrigado_mensagem: e.target.value })}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Mensagem para Essencial</label>
              <textarea
                value={config.obrigado_msg_essencial}
                onChange={e => setConfig({ ...config, obrigado_msg_essencial: e.target.value })}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Mensagem para Plus</label>
              <textarea
                value={config.obrigado_msg_plus}
                onChange={e => setConfig({ ...config, obrigado_msg_plus: e.target.value })}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Mensagem para Black</label>
              <textarea
                value={config.obrigado_msg_black}
                onChange={e => setConfig({ ...config, obrigado_msg_black: e.target.value })}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </div>
          </div>

          <BotaoSalvar saving={saving} onClick={() => salvarConfig({
            obrigado_titulo: config.obrigado_titulo,
            obrigado_mensagem: config.obrigado_mensagem,
            obrigado_msg_essencial: config.obrigado_msg_essencial,
            obrigado_msg_plus: config.obrigado_msg_plus,
            obrigado_msg_black: config.obrigado_msg_black,
          })} />
        </Card>
      )}

      {aba === 'precos' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Preços dos planos</h2>
          <p style={helpStyle}>Esses valores aparecem na landing, em /planos e em /minha-assinatura.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '20px 0' }}>
            <div>
              <label style={labelStyle}>Essencial (R$)</label>
              <input
                type="number" step="0.01" min={0}
                value={config.preco_essencial}
                onChange={e => setConfig({ ...config, preco_essencial: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Plus (R$)</label>
              <input
                type="number" step="0.01" min={0}
                value={config.preco_plus}
                onChange={e => setConfig({ ...config, preco_plus: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Black (R$)</label>
              <input
                type="number" step="0.01" min={0}
                value={config.preco_black}
                onChange={e => setConfig({ ...config, preco_black: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{
            padding: '10px 14px', borderRadius: 10,
            backgroundColor: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.20)',
            fontSize: 12, color: 'rgba(248,249,250,0.6)',
            marginBottom: 20, lineHeight: 1.5,
          }}>
            Atenção: alterar estes preços só muda o que <strong>aparece</strong> na landing.
            Os valores reais cobrados pelo gateway (Cakto) continuam conforme configurado lá.
          </div>

          <BotaoSalvar saving={saving} onClick={() => salvarConfig({
            preco_essencial: config.preco_essencial,
            preco_plus: config.preco_plus,
            preco_black: config.preco_black,
          })} />
        </Card>
      )}

      {aba === 'textos' && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 6px' }}>Textos da landing</h2>
          <p style={helpStyle}>Edite os textos das seções da landing oficial e da landing de lançamento.</p>

          {landing.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.5)', marginTop: 20 }}>
              Nenhum texto cadastrado ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
              {(['oficial', 'lancamento'] as const).map(pagina => {
                const linhas = landing.filter(l => l.pagina === pagina)
                if (linhas.length === 0) return null
                const porSecao: Record<string, LandingRow[]> = {}
                for (const l of linhas) {
                  (porSecao[l.secao] ||= []).push(l)
                }

                return (
                  <div key={pagina}>
                    <h3 style={{
                      fontSize: 13, fontWeight: 700,
                      color: '#E11D48',
                      textTransform: 'uppercase', letterSpacing: 0.8,
                      margin: '0 0 12px',
                    }}>
                      {pagina === 'oficial' ? 'Landing oficial (/)' : 'Landing de lançamento (/lancamento)'}
                    </h3>

                    {Object.entries(porSecao).map(([secao, rows]) => (
                      <div key={secao} style={{ marginBottom: 16 }}>
                        <p style={{
                          fontSize: 11, color: 'rgba(248,249,250,0.4)',
                          textTransform: 'uppercase', letterSpacing: 1,
                          margin: '0 0 8px',
                        }}>
                          {secao}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rows.map(row => {
                            const editando = editandoId === row.id
                            return (
                              <div
                                key={row.id}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  backgroundColor: '#13161F',
                                  border: `1px solid ${editando ? 'rgba(225,29,72,0.35)' : 'rgba(255,255,255,0.05)'}`,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: editando ? 8 : 4 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,249,250,0.6)' }}>
                                    {row.chave}
                                  </span>
                                  {!editando && (
                                    <button
                                      onClick={() => { setEditandoId(row.id); setValorEdicao(row.valor) }}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(248,249,250,0.5)', padding: 4,
                                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                                      }}
                                    >
                                      <Pencil size={12} /> Editar
                                    </button>
                                  )}
                                </div>

                                {editando ? (
                                  <>
                                    {row.tipo === 'texto_longo' ? (
                                      <textarea
                                        value={valorEdicao}
                                        onChange={e => setValorEdicao(e.target.value)}
                                        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                        autoFocus
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={valorEdicao}
                                        onChange={e => setValorEdicao(e.target.value)}
                                        style={inputStyle}
                                        autoFocus
                                      />
                                    )}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                      <button
                                        onClick={() => salvarLanding(row.id, valorEdicao)}
                                        disabled={saving}
                                        style={{
                                          padding: '7px 14px', borderRadius: 8, border: 'none',
                                          backgroundColor: saving ? 'rgba(225,29,72,0.4)' : '#E11D48',
                                          color: '#fff', fontSize: 12, fontWeight: 700,
                                          cursor: saving ? 'not-allowed' : 'pointer',
                                          display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                      >
                                        {saving ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={12} />}
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => setEditandoId(null)}
                                        style={{
                                          padding: '7px 14px', borderRadius: 8,
                                          border: '1px solid rgba(255,255,255,0.08)',
                                          backgroundColor: 'transparent',
                                          color: 'rgba(248,249,250,0.5)',
                                          fontSize: 12, cursor: 'pointer',
                                        }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <p style={{
                                    fontSize: 13, color: '#F8F9FA',
                                    margin: 0, lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                  }}>
                                    {row.valor || <span style={{ color: 'rgba(248,249,250,0.3)' }}>(vazio)</span>}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

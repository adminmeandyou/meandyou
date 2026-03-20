// src/app/admin/marketing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Send, Settings2, BarChart2 } from 'lucide-react'

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'campanhas', label: 'Campanhas', icon: Send },
  { id: 'notificacoes', label: 'Notificacoes', icon: Settings2 },
]

const EVENTOS = [
  { key: 'new_user', label: 'Novo cadastro' },
  { key: 'payment_approved', label: 'Pagamento aprovado' },
  { key: 'plan_cancelled', label: 'Plano cancelado' },
  { key: 'user_inactive', label: 'Usuario inativo' },
  { key: 'new_match', label: 'Novo match' },
]

function Toggle({ ativo, onChange, disabled }: { ativo: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: '44px', height: '26px', borderRadius: '100px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: ativo && !disabled ? '#e11d48' : 'rgba(255,255,255,0.12)',
        position: 'relative', flexShrink: 0, transition: 'background-color 0.22s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: ativo && !disabled ? '21px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.22s',
      }} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(248,249,250,0.40)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}

export default function AdminMarketing() {
  const [tab, setTab] = useState('analytics')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Campanhas
  const [campTitulo, setCampTitulo] = useState('')
  const [campCorpo, setCampCorpo] = useState('')
  const [campSegmento, setCampSegmento] = useState('todos')
  const [campEnviando, setCampEnviando] = useState(false)
  const [campResultado, setCampResultado] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)

  // Notificacoes
  const [notifSettings, setNotifSettings] = useState<any[]>([])
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => { loadAnalytics() }, [])

  useEffect(() => {
    if (tab === 'campanhas' && historico.length === 0) loadHistorico()
    if (tab === 'notificacoes' && notifSettings.length === 0) loadNotifSettings()
  }, [tab])

  async function loadAnalytics() {
    const [
      { data: metrics },
      { data: referrals },
      { data: deleted },
    ] = await Promise.all([
      supabase.from('admin_metrics').select('*').single(),
      supabase.from('referrals').select('id, status, created_at, referred:referred_id(name), referrer:referrer_id(name)').order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(20),
    ])
    setAnalyticsData({ metrics, referrals: referrals || [], deleted: deleted || [] })
    setLoading(false)
  }

  async function loadHistorico() {
    setHistoricoLoading(true)
    const res = await fetch('/api/admin/marketing/historico')
    const json = await res.json()
    setHistorico(json.data ?? [])
    setHistoricoLoading(false)
  }

  async function loadNotifSettings() {
    setNotifLoading(true)
    const res = await fetch('/api/admin/notificacoes/settings')
    const json = await res.json()
    setNotifSettings(json.data ?? [])
    const wa = (json.data ?? []).find((s: any) => s.webhook_url)?.webhook_url ?? ''
    setWhatsappUrl(wa)
    setNotifLoading(false)
  }

  async function enviarCampanha() {
    if (!campTitulo || !campCorpo) return
    setCampEnviando(true)
    setCampResultado(null)
    const res = await fetch('/api/admin/marketing/campanha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: campTitulo, corpo: campCorpo, segmento: campSegmento }),
    })
    const json = await res.json()
    setCampResultado(json)
    setCampEnviando(false)
    if (json.ok) {
      setCampTitulo('')
      setCampCorpo('')
      loadHistorico()
    }
  }

  async function toggleNotif(evento: string, canal: string, ativo: boolean) {
    setNotifSettings(prev => prev.map((s: any) =>
      s.evento === evento && s.canal === canal ? { ...s, ativo } : s
    ))
    await fetch('/api/admin/notificacoes/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento, canal, ativo, webhook_url: canal === 'whatsapp' ? whatsappUrl : null }),
    })
  }

  async function salvarWhatsapp() {
    setSalvando(true)
    const waSettings = notifSettings.filter((s: any) => s.canal === 'whatsapp')
    for (const s of waSettings) {
      await fetch('/api/admin/notificacoes/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: s.evento, canal: 'whatsapp', ativo: s.ativo, webhook_url: whatsappUrl }),
      })
    }
    setSalvando(false)
  }

  function getSetting(evento: string, canal: string) {
    return notifSettings.find((s: any) => s.evento === evento && s.canal === canal)
  }

  if (loading) return <div style={{ padding: '32px', color: 'rgba(248,249,250,0.40)' }}>Carregando...</div>

  const { metrics, referrals, deleted } = analyticsData ?? {}
  const total      = metrics?.total_users ?? 0
  const verified   = metrics?.total_verified ?? 0
  const subscribed = (metrics?.plan_essencial ?? 0) + (metrics?.plan_plus ?? 0) + (metrics?.plan_black ?? 0)
  const convRate   = total > 0 ? ((subscribed / total) * 100).toFixed(1) : '0'

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Marketing</h1>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: '#0F1117', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              backgroundColor: tab === t.id ? '#13161F' : 'transparent',
              color: tab === t.id ? '#fff' : '#555',
              fontSize: '14px', fontWeight: tab === t.id ? '600' : '400',
            }}>
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ABA ANALYTICS */}
      {tab === 'analytics' && (
        <>
          <Section title="Funil de conversao">
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Cadastraram', value: total,      color: '#3b82f6' },
                { label: 'Verificaram', value: verified,   color: '#a855f7' },
                { label: 'Assinaram',   value: subscribed, color: '#22c55e' },
              ].map((step, i) => {
                const pct = total > 0 ? Math.round((step.value / total) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(248,249,250,0.50)' }}>{step.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{step.value} <span style={{ color: 'rgba(248,249,250,0.40)', fontWeight: '400' }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#1e1e1e', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: step.color, borderRadius: '100px' }} />
                    </div>
                  </div>
                )
              })}
              <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.40)', marginTop: '8px' }}>Taxa cadastro -&gt; assinatura: <strong style={{ color: '#22c55e' }}>{convRate}%</strong></p>
            </div>
          </Section>

          <Section title={`Indicacoes (${referrals?.length ?? 0})`}>
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
              {(referrals?.length ?? 0) === 0 ? (
                <p style={{ padding: '20px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Nenhuma indicacao ainda</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Indicou', 'Indicado', 'Status', 'Data'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r: any) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px 16px' }}>{r.referrer?.name ?? '\u2014'}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.50)' }}>{r.referred?.name ?? '\u2014'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: r.status === 'rewarded' ? '#22c55e22' : '#f59e0b22',
                            color: r.status === 'rewarded' ? '#22c55e' : '#f59e0b',
                          }}>{r.status === 'rewarded' ? 'Convertida' : 'Pendente'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>

          <Section title={`Excluiram a conta (${deleted?.length ?? 0})`}>
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
              {(deleted?.length ?? 0) === 0 ? (
                <p style={{ padding: '20px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Nenhuma conta excluida</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Nome', 'Data de exclusao'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deleted.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)' }}>{u.name ?? '\u2014'}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{new Date(u.deleted_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </>
      )}

      {/* ABA CAMPANHAS */}
      {tab === 'campanhas' && (
        <>
          <Section title="Nova campanha">
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                placeholder="Assunto do e-mail"
                value={campTitulo}
                onChange={e => setCampTitulo(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['todos', 'essencial', 'plus', 'black'].map(s => (
                  <button key={s} onClick={() => setCampSegmento(s)} style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
                    backgroundColor: campSegmento === s ? '#e11d48' : '#13161F',
                    color: campSegmento === s ? '#fff' : '#666',
                  }}>{s === 'todos' ? 'Todos os usuarios' : `Plano ${s}`}</button>
                ))}
              </div>
              <textarea
                placeholder="Corpo do e-mail (suporta HTML simples)"
                value={campCorpo}
                onChange={e => setCampCorpo(e.target.value)}
                rows={8}
                style={{ padding: '12px 14px', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical' }}
              />
              {campResultado && (
                <div style={{
                  padding: '12px', borderRadius: '10px', fontSize: '13px',
                  backgroundColor: campResultado.ok ? '#22c55e11' : '#ef444411',
                  border: `1px solid ${campResultado.ok ? '#22c55e33' : '#ef444433'}`,
                  color: campResultado.ok ? '#22c55e' : '#ef4444',
                }}>
                  {campResultado.ok
                    ? `Campanha enviada para ${campResultado.total} destinatarios!`
                    : 'Erro ao enviar campanha. Verifique as configuracoes do Resend.'}
                </div>
              )}
              <button
                onClick={enviarCampanha}
                disabled={campEnviando || !campTitulo || !campCorpo}
                style={{
                  padding: '12px', backgroundColor: '#e11d48', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: (!campTitulo || !campCorpo) ? 'not-allowed' : 'pointer',
                  opacity: (!campTitulo || !campCorpo) ? 0.5 : 1,
                }}
              >
                {campEnviando ? 'Enviando...' : 'Enviar campanha'}
              </button>
            </div>
          </Section>

          <Section title="Historico de campanhas">
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
              {historicoLoading ? (
                <p style={{ padding: '20px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Carregando...</p>
              ) : historico.length === 0 ? (
                <p style={{ padding: '20px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Nenhuma campanha enviada ainda</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Data', 'Assunto', 'Segmento', 'Enviados', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((c: any) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '13px' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px 16px', color: '#fff' }}>{c.titulo}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.50)' }}>{c.segmento}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.50)' }}>{c.total_destinatarios}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: c.status === 'enviado' ? '#22c55e22' : '#ef444422',
                            color: c.status === 'enviado' ? '#22c55e' : '#ef4444',
                          }}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </>
      )}

      {/* ABA NOTIFICACOES */}
      {tab === 'notificacoes' && (
        <>
          <Section title="WhatsApp Business API">
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '13px', marginBottom: '12px', lineHeight: 1.6 }}>
                URL do webhook do provedor WhatsApp (Z-API, Evolution API, Twilio, etc). Deixe em branco ate contratar o servico.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  placeholder="https://api.z-api.io/instances/xxx/token/xxx/send-text"
                  value={whatsappUrl}
                  onChange={e => setWhatsappUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
                <button onClick={salvarWhatsapp} disabled={salvando} style={{
                  padding: '10px 20px', backgroundColor: '#e11d48', color: '#fff',
                  border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  opacity: salvando ? 0.6 : 1,
                }}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </Section>

          <Section title="Eventos automaticos">
            <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
              {notifLoading ? (
                <p style={{ padding: '20px', color: 'rgba(248,249,250,0.40)', textAlign: 'center' }}>Carregando...</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Evento', 'E-mail', 'WhatsApp'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(248,249,250,0.40)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EVENTOS.map(ev => {
                      const emailS = getSetting(ev.key, 'email')
                      const waS = getSetting(ev.key, 'whatsapp')
                      return (
                        <tr key={ev.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <td style={{ padding: '12px 16px', color: '#ccc' }}>{ev.label}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <Toggle ativo={emailS?.ativo ?? false} onChange={() => toggleNotif(ev.key, 'email', !(emailS?.ativo ?? false))} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <Toggle ativo={waS?.ativo ?? false} onChange={() => toggleNotif(ev.key, 'whatsapp', !(waS?.ativo ?? false))} disabled={!whatsappUrl} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {!whatsappUrl && (
                <p style={{ padding: '12px 16px', color: 'rgba(248,249,250,0.40)', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  Configure a URL do WhatsApp acima para ativar notificacoes via WhatsApp.
                </p>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

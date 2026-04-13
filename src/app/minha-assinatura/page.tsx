'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { ArrowLeft, Check, AlertTriangle, Loader2, Headphones } from 'lucide-react'

type Subscription = {
  id: string
  plan: string
  status: string
  gateway_order_id: string
  starts_at: string
  ends_at: string
  created_at: string
}

const PLAN_LABELS: Record<string, string> = {
  essencial: 'Essencial',
  plus: 'Plus',
  black: 'Black',
}

const PLAN_PRICES: Record<string, string> = {
  essencial: 'R$ 9,97/mês',
  plus: 'R$ 39,97/mês',
  black: 'R$ 99,97/mês',
}

const PLAN_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  essencial: { color: 'rgba(248,249,250,0.70)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)' },
  plus:      { color: '#E11D48',   bg: 'rgba(225,29,72,0.08)',  border: 'rgba(225,29,72,0.30)'  },
  black:     { color: '#F59E0B',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)' },
}

const PLAN_FEATURES: Record<string, string[]> = {
  essencial: ['20 curtidas/dia', '1 SuperCurtida/dia', '1 ticket de roleta/dia', 'Verificação de identidade', '1 filtro ativo'],
  plus:      ['50 curtidas/dia', '5 SuperCurtidas/dia', '2 tickets/dia', '1 Lupa/dia', 'Desfazer curtida', 'Filtros avançados', 'Ver quem curtiu'],
  black:     ['Curtidas ilimitadas', '10 SuperCurtidas/dia', '3 tickets/dia', '2 Lupas/dia', 'Backstage (Sugar e Fetiche)', 'Suporte prioritário 24h'],
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function daysLeft(ends_at: string) {
  const diff = new Date(ends_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function MinhaAssinaturaPage() {
  const router = useRouter()
  const [userId, setUserId]           = useState<string | null>(null)
  const [subscriptions, setSubs]      = useState<Subscription[]>([])
  const [loading, setLoading]         = useState(true)
  const [cancelling, setCancelling]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [msg, setMsg]                 = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    }).catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSubs(data ?? [])
        setLoading(false)
      })
  }, [userId])

  const active = subscriptions.find(s => s.status === 'active')
  const history = subscriptions.filter(s => s.status !== 'active')
  const planStyle = active ? (PLAN_COLORS[active.plan] ?? PLAN_COLORS['essencial']) : null

  async function handleCancel() {
    if (!active) return
    setCancelling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/assinatura/cancelar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ subscription_id: active.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao cancelar')
      setMsg({ text: 'Assinatura cancelada. Você mantém acesso até o fim do período pago.', type: 'success' })
      setSubs(prev => prev.map(s => s.id === active.id ? { ...s, status: 'cancelled' } : s))
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Erro ao cancelar'
      setMsg({ text: error, type: 'error' })
    } finally {
      setCancelling(false)
      setShowConfirm(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="var(--accent)" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '80px' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0 }}>Minha assinatura</h1>
      </header>

      <div className="page-content" style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Mensagem de feedback */}
        {msg && (
          <div style={{
            borderRadius: '12px', padding: '14px 16px', fontSize: '14px', fontWeight: 600,
            backgroundColor: msg.type === 'success' ? 'rgba(16,185,129,0.10)' : 'rgba(225,29,72,0.10)',
            color: msg.type === 'success' ? '#10b981' : 'var(--accent)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'var(--accent-border)'}`,
          }}>
            {msg.text}
          </div>
        )}

        {/* Plano ativo */}
        {active && planStyle ? (
          <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px', border: `2px solid ${planStyle.border}`, overflow: 'hidden' }}>

            {/* Topo */}
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', backgroundColor: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}` }}>
                    Plano ativo
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: planStyle.color, margin: '8px 0 4px' }}>
                    {PLAN_LABELS[active.plan] ?? active.plan}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{PLAN_PRICES[active.plan]}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 4px' }}>Renova em</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>{formatDate(active.ends_at)}</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{daysLeft(active.ends_at)} dias restantes</p>
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(PLAN_FEATURES[active.plan] ?? []).map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text)' }}>
                    <Check size={14} color={planStyle.color} strokeWidth={2} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Detalhes */}
            <div style={{ backgroundColor: 'var(--bg)', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Ativo desde: <span style={{ color: 'var(--text)' }}>{formatDate(active.starts_at)}</span></p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Válido até: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatDate(active.ends_at)}</span></p>
              {active.gateway_order_id && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>N. pedido: <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '11px' }}>{active.gateway_order_id}</span></p>}
            </div>

            {/* Acoes */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => router.push('/planos')}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                Fazer upgrade de plano
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'transparent', color: '#f87171', fontWeight: 500, fontSize: '14px', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                Cancelar assinatura
              </button>
            </div>
          </div>
        ) : (
          /* Sem plano ativo */
          <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={26} color="var(--accent)" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: '0 0 8px' }}>Nenhum plano ativo</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px' }}>Assine um plano para desbloquear mais recursos e aparecer para mais pessoas.</p>
            <button
              onClick={() => router.push('/planos')}
              style={{ padding: '12px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Ver planos disponíveis
            </button>
          </div>
        )}

        {/* Historico */}
        {history.length > 0 && (
          <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', padding: '16px 20px 8px', margin: 0 }}>Histórico de assinaturas</p>
            <div>
              {history.map((s, i) => {
                const statusColor = s.status === 'cancelled' ? '#f87171' : s.status === 'expired' ? 'var(--muted)' : '#F59E0B'
                const statusBg = s.status === 'cancelled' ? 'rgba(239,68,68,0.10)' : s.status === 'expired' ? 'rgba(255,255,255,0.05)' : 'rgba(245,158,11,0.10)'
                const statusLabel = s.status === 'cancelled' ? 'Cancelado' : s.status === 'expired' ? 'Expirado' : s.status
                return (
                  <div key={s.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: i === 0 ? '1px solid var(--border)' : '1px solid var(--border-soft)' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{PLAN_LABELS[s.plan] ?? s.plan}</p>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 2px' }}>{formatDate(s.starts_at)} até {formatDate(s.ends_at)}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)', fontFamily: 'monospace', margin: 0 }}>{s.gateway_order_id}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', backgroundColor: statusBg, color: statusColor, flexShrink: 0, marginLeft: '12px' }}>
                      {statusLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info / suporte */}
        <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Precisa de ajuda?</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Para contestar cobranças, reembolsos ou dúvidas sobre sua assinatura, entre em contato com o suporte. Respondemos em até 24h úteis.
          </p>
          <button
            onClick={() => router.push('/suporte')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
          >
            <Headphones size={14} strokeWidth={1.5} />
            Abrir suporte
          </button>
        </div>

      </div>

      {/* Modal de confirmacao de cancelamento */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={22} color="#f87171" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', textAlign: 'center', color: 'var(--text)', margin: '0 0 8px' }}>Cancelar assinatura?</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', margin: '0 0 8px', lineHeight: 1.5 }}>
              Você continuará com acesso ao plano <strong style={{ color: 'var(--text)' }}>{PLAN_LABELS[active?.plan ?? '']}</strong> até{' '}
              <strong style={{ color: 'var(--text)' }}>{active ? formatDate(active.ends_at) : ''}</strong>.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.30)', textAlign: 'center', margin: '0 0 24px' }}>Após essa data, você perderá o acesso às funcionalidades do plano. Para voltar a usá-las, será necessário assinar novamente.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'transparent', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                Manter plano
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: '14px', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', opacity: cancelling ? 0.6 : 1, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={14} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Cancelando...
                  </>
                ) : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

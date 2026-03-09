'use client'
// src/app/minha-assinatura/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Subscription = {
  id: string
  plan: string
  status: string
  cakto_order_id: string
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
  essencial: 'R$ 10/mês',
  plus: 'R$ 39/mês',
  black: 'R$ 100/mês',
}

const PLAN_COLORS: Record<string, { badge: string; border: string; text: string }> = {
  essencial: { badge: 'bg-green-100 text-green-700', border: 'border-[var(--accent)]', text: 'text-[var(--accent)]' },
  plus:      { badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-400',         text: 'text-blue-600'       },
  black:     { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-400',     text: 'text-purple-600'     },
}

const PLAN_FEATURES: Record<string, string[]> = {
  essencial: ['5 curtidas/dia', '1 SuperCurtida/dia', '1 ticket de roleta/dia', 'Verificação de identidade', '1 filtro ativo'],
  plus:      ['30 curtidas/dia', '5 SuperCurtidas/dia', '2 tickets/dia', '1 Lupa/dia', 'Desfazer curtida (1/dia)', 'Filtros avançados', 'Ver quem curtiu'],
  black:     ['Curtidas ilimitadas', '10 SuperCurtidas/dia', '3 tickets/dia', '2 Lupas/dia', 'Boost automático diário', 'Backstage (Sugar e Fetiche)', 'Suporte prioritário 24h'],
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

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    }).catch(() => router.replace('/login'))
  }, [router])

  // ── Buscar assinaturas ────────────────────────────────────────────────
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

  // ── Cancelar ──────────────────────────────────────────────────────────
  async function handleCancel() {
    if (!active) return
    setCancelling(true)
    try {
      const res = await fetch('/api/assinatura/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-fraunces text-xl font-bold text-[var(--text)]">Minha Assinatura</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Mensagem de feedback */}
        {msg && (
          <div className={`rounded-xl p-4 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Plano ativo */}
        {active ? (
          <div className={`bg-white rounded-2xl border-2 ${PLAN_COLORS[active.plan]?.border ?? 'border-[var(--border)]'} shadow-sm overflow-hidden`}>
            {/* Topo */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[active.plan]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                    Plano ativo
                  </span>
                  <h2 className={`font-fraunces text-2xl font-bold mt-2 ${PLAN_COLORS[active.plan]?.text ?? 'text-[var(--text)]'}`}>
                    {PLAN_LABELS[active.plan] ?? active.plan}
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-0.5">{PLAN_PRICES[active.plan]}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)]">Renova em</p>
                  <p className="text-sm font-semibold text-[var(--text)]">{formatDate(active.ends_at)}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{daysLeft(active.ends_at)} dias restantes</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-1.5 mt-3">
                {(PLAN_FEATURES[active.plan] ?? []).map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Detalhes */}
            <div className="bg-[var(--bg)] px-5 py-3 border-t border-[var(--border)] space-y-1.5 text-xs text-[var(--muted)]">
              <p>Ativo desde: <span className="text-[var(--text)]">{formatDate(active.starts_at)}</span></p>
              <p>Válido até: <span className="text-[var(--text)] font-medium">{formatDate(active.ends_at)}</span></p>
              <p>Pedido: <span className="text-[var(--text)] font-mono">{active.cakto_order_id}</span></p>
            </div>

            {/* Ações */}
            <div className="px-5 py-4 flex flex-col gap-2 border-t border-[var(--border)]">
              <button
                onClick={() => router.push('/planos')}
                className="btn-primary w-full text-sm py-2.5"
              >
                Fazer upgrade de plano
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full text-sm py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Cancelar assinatura
              </button>
            </div>
          </div>
        ) : (
          /* Sem plano ativo */
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-fraunces font-bold text-lg text-[var(--text)] mb-1">Nenhum plano ativo</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Assine um plano para desbloquear mais recursos e aparecer para mais pessoas.</p>
            <button onClick={() => router.push('/planos')} className="btn-primary text-sm px-6">
              Ver planos disponíveis
            </button>
          </div>
        )}

        {/* Histórico */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <h3 className="font-semibold text-[var(--text)] px-5 pt-4 pb-2 text-sm">Histórico de assinaturas</h3>
            <div className="divide-y divide-[var(--border)]">
              {history.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{PLAN_LABELS[s.plan] ?? s.plan}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(s.starts_at)} → {formatDate(s.ends_at)}</p>
                    <p className="text-xs font-mono text-[var(--muted)] mt-0.5">{s.cakto_order_id}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    s.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                    s.status === 'expired'   ? 'bg-gray-100 text-gray-500' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {s.status === 'cancelled' ? 'Cancelado' : s.status === 'expired' ? 'Expirado' : s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info LGPD / suporte */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
          <h3 className="font-semibold text-[var(--text)] text-sm mb-2">Precisa de ajuda?</h3>
          <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
            Para contestar cobranças, reembolsos ou dúvidas sobre sua assinatura, entre em contato com o suporte. Respondemos em até 24h úteis.
          </p>
          <button onClick={() => router.push('/suporte')} className="btn-secondary text-xs px-4 py-2">
            Abrir suporte
          </button>
        </div>

      </div>

      {/* Modal de confirmação de cancelamento */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-fraunces font-bold text-lg text-center text-[var(--text)] mb-2">Cancelar assinatura?</h3>
            <p className="text-sm text-[var(--muted)] text-center mb-1">
              Você continuará com acesso ao plano <strong className="text-[var(--text)]">{PLAN_LABELS[active?.plan ?? '']}</strong> até{' '}
              <strong className="text-[var(--text)]">{active ? formatDate(active.ends_at) : ''}</strong>.
            </p>
            <p className="text-xs text-[var(--muted)] text-center mb-5">Após essa data, sua conta retorna ao plano gratuito.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
              >
                Manter plano
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

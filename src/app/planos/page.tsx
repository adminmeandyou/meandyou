'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Check, Zap, Star, Crown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CheckoutModal from '@/components/CheckoutModal'

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 9.97,
    icon: Zap,
    color: 'rgba(248,249,250,0.70)',
    features: [
      'Até 10 fotos no perfil',
      '20 curtidas por dia',
      '1 SuperCurtida/dia',
      '1 Ticket de roleta/dia',
      '1 Lupa por dia',
      'Chat com seus matches',
      '1h de videochamada/dia',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 39.97,
    icon: Star,
    color: '#E11D48',
    highlight: true,
    badge: 'Melhor Custo-Beneficio',
    features: [
      'Até 10 fotos no perfil',
      '30 curtidas por dia',
      '4 SuperCurtidas/dia',
      '2 Tickets de roleta/dia',
      '1 Lupa por dia',
      'Ver quem curtiu você',
      'Desfazer curtida (1/dia)',
      'Destaque na busca',
      '5h de videochamada/dia',
    ],
  },
  {
    id: 'black',
    name: 'Black',
    price: 99.97,
    icon: Crown,
    color: '#F59E0B',
    features: [
      'Até 10 fotos no perfil',
      'Curtidas ilimitadas',
      '10 SuperCurtidas/dia',
      '3 Tickets de roleta/dia',
      '2 Lupas por dia',
      'Boosts (max. 2 simultaneos)',
      'Filtros Sugar e Fetiche',
      'Area Backstage exclusiva',
      '10h de videochamada/dia',
    ],
  },
]

export default function PlanosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadCurrentPlan()
    if (user.email) {
      setUserEmail(user.email)
    } else {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email)
      })
    }
  }, [user])

  async function loadCurrentPlan() {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status, ends_at')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .single()
    setCurrentPlan(data?.plan ?? null)
    setLoading(false)
  }

  function handleCheckout(plan: typeof PLANS[0]) {
    setCheckoutPlan(plan.id)
    setCheckoutOpen(true)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '48px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Planos</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Escolha o seu</p>
        </div>
      </header>

      {/* Titulo */}
      <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>
          Encontre quem{' '}
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>combina</em>
          {' '}com você
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, maxWidth: '280px', display: 'inline-block' }}>
          Todos os planos incluem verificação biométrica e perfis 100% reais
        </p>
      </div>

      {/* Hint de arraste */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.30)', marginBottom: '8px', letterSpacing: '0.05em' }}>
        Arraste para ver todos os planos
      </p>

      {/* Cards — scroll horizontal com snap */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '20px 20px 16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' } as React.CSSProperties}>
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isActive = currentPlan === plan.id
          const isHighlight = !!plan.highlight
          const isBlack = plan.id === 'black'

          const cardBg = isHighlight ? 'rgba(225,29,72,0.05)' : isBlack ? 'rgba(245,158,11,0.03)' : 'rgba(255,255,255,0.03)'
          const cardBorder = isActive
            ? `2px solid ${plan.color}`
            : isHighlight
            ? '1px solid rgba(225,29,72,0.30)'
            : isBlack
            ? '1px solid rgba(245,158,11,0.20)'
            : '1px solid rgba(255,255,255,0.07)'

          return (
            <div
              key={plan.id}
              style={{
                position: 'relative', flexShrink: 0, width: '272px', scrollSnapAlign: 'center',
                borderRadius: '24px', border: cardBorder,
                backgroundColor: cardBg,
                padding: '20px', display: 'flex', flexDirection: 'column',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              {/* Badge Melhor Custo-Beneficio */}
              {isHighlight && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap', padding: '4px 16px', borderRadius: '100px',
                  background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
                  fontSize: '11px', fontWeight: 700,
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Badge Plano atual */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '-14px', right: '16px',
                  padding: '4px 12px', borderRadius: '100px',
                  backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
                  color: 'var(--text)', fontSize: '11px',
                }}>
                  Plano atual
                </div>
              )}

              {/* Topo: icone + nome + preco */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${plan.color}18` }}>
                    <Icon size={18} color={plan.color} strokeWidth={1.5} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text)' }}>{plan.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', display: 'block', lineHeight: 1 }}>
                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>/mês</span>
                </div>
              </div>

              {/* Divisor */}
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'rgba(248,249,250,0.65)' }}>
                    <Check size={13} color={plan.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Botao */}
              <button
                onClick={() => handleCheckout(plan)}
                disabled={isActive || loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '16px',
                  fontWeight: 700, fontSize: '14px', cursor: isActive ? 'default' : 'pointer',
                  fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  ...(isActive
                    ? { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', border: 'none' }
                    : isHighlight
                    ? { background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', border: 'none' }
                    : isBlack
                    ? { backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)', color: '#F59E0B' }
                    : { backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text)' }
                  ),
                }}
              >
                {isActive ? 'Ativo' : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}

        {/* Spacer final */}
        <div style={{ flexShrink: 0, width: '4px' }} />
      </div>

      {/* Indicador de scroll */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
        {PLANS.map((p) => (
          <div
            key={p.id}
            style={{
              height: '4px', borderRadius: '100px', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              width: p.highlight ? '20px' : '8px',
              backgroundColor: p.highlight ? 'var(--accent)' : 'rgba(255,255,255,0.20)',
            }}
          />
        ))}
      </div>

      {/* Comparativo rapido */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', textAlign: 'center', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Feature</div>
            {PLANS.map((p) => (
              <div key={p.id} style={{ padding: '12px 4px', fontWeight: 700, color: p.color }}>{p.name}</div>
            ))}
          </div>
          {[
            { label: 'Curtidas',      values: ['20/dia', '30/dia', 'Ilimitadas'] },
            { label: 'SuperCurtidas', values: ['1/dia', '4/dia', '10/dia'] },
            { label: 'Lupas',         values: ['1/dia', '1/dia', '2/dia'] },
            { label: 'Tickets',       values: ['1/dia', '2/dia', '3/dia'] },
            { label: 'Video',         values: ['1h/dia', '5h/dia', '10h/dia'] },
            { label: 'Quem curtiu',   values: ['—', 'Sim', 'Sim'] },
            { label: 'Backstage',     values: ['—', '—', 'Sim'] },
          ].map((row, i) => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', textAlign: 'center', fontSize: '11px', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <div style={{ padding: '10px 8px', color: 'rgba(248,249,250,0.40)', textAlign: 'left' }}>{row.label}</div>
              {row.values.map((v, j) => (
                <div key={j} style={{ padding: '10px 4px', color: 'rgba(248,249,250,0.60)' }}>{v}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Rodape */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.20)', padding: '0 20px 8px' }}>
        Pagamento seguro via PIX ou cartão · Cancele quando quiser
      </p>

      {checkoutOpen && checkoutPlan && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => { setCheckoutOpen(false); setCheckoutPlan(null) }}
          type="subscription"
          plan={checkoutPlan}
        />
      )}
    </div>
  )
}

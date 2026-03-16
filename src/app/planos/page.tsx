'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Check, Zap, Star, Crown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 9.97,
    icon: Zap,
    color: '#ffffff',
    checkoutUrl: 'https://pay.cakto.com.br/cip6fy9_797209',
    features: [
      'Ate 10 fotos no perfil',
      '5 curtidas por dia',
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
    color: '#b8f542',
    checkoutUrl: 'https://pay.cakto.com.br/3arwn9f',
    highlight: true,
    badge: 'Melhor Custo-Beneficio',
    features: [
      'Ate 10 fotos no perfil',
      '30 curtidas por dia',
      '4 SuperCurtidas/dia',
      '2 Tickets de roleta/dia',
      '1 Lupa por dia',
      'Ver quem curtiu voce',
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
    checkoutUrl: 'https://pay.cakto.com.br/hftqkrj',
    features: [
      'Ate 10 fotos no perfil',
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
    if (currentPlan === plan.id) return
    const email = userEmail || user?.email || ''
    const url = email
      ? `${plan.checkoutUrl}?email=${encodeURIComponent(email)}`
      : plan.checkoutUrl
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-12">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div>
          <h1 className="font-fraunces text-xl text-white leading-tight">Planos</h1>
          <p className="text-white/30 text-xs">Escolha o seu</p>
        </div>
      </header>

      {/* Título */}
      <div className="text-center px-6 pt-8 pb-6">
        <h2 className="font-fraunces text-3xl text-white leading-tight">
          Encontre quem <span className="italic text-[#b8f542]">combina</span> com voce
        </h2>
        <p className="text-white/35 text-sm mt-2 max-w-xs mx-auto">
          Todos os planos incluem verificacao biometrica e perfis 100% reais
        </p>
      </div>

      {/* Cards — scroll horizontal com snap */}
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isActive = currentPlan === plan.id
          const isHighlight = !!plan.highlight

          return (
            <div
              key={plan.id}
              className={`relative flex-shrink-0 w-[272px] snap-center rounded-3xl border p-5 flex flex-col transition ${
                isHighlight
                  ? 'bg-[#b8f542]/5 border-[#b8f542]/30'
                  : 'bg-white/3 border-white/8'
              } ${isActive ? 'ring-2 ring-[#b8f542]' : ''}`}
            >
              {/* Badge "Melhor Custo-Benefício" */}
              {isHighlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full bg-[#b8f542] text-black text-[11px] font-bold">
                  {plan.badge}
                </div>
              )}

              {/* Badge "Plano atual" */}
              {isActive && (
                <div className="absolute -top-3.5 right-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px]">
                  Plano atual
                </div>
              )}

              {/* Topo: ícone + nome + preço */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}18` }}
                  >
                    <Icon size={18} style={{ color: plan.color }} />
                  </div>
                  <span className="font-fraunces text-lg text-white">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-fraunces text-xl text-white">
                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="text-white/30 text-[11px]">/mes</div>
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px bg-white/6 mb-4" />

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-white/65">
                    <Check size={13} style={{ color: plan.color }} className="shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                onClick={() => handleCheckout(plan)}
                disabled={isActive || loading}
                className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-95 ${
                  isActive
                    ? 'bg-white/5 text-white/30 cursor-default'
                    : isHighlight
                    ? 'bg-[#b8f542] text-black hover:bg-[#a8e030]'
                    : plan.id === 'black'
                    ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                    : 'bg-white/8 text-white border border-white/10 hover:bg-white/12'
                }`}
              >
                {isActive ? 'Ativo' : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}

        {/* Spacer final para o último card não colar na borda */}
        <div className="flex-shrink-0 w-1" />
      </div>

      {/* Indicador de scroll */}
      <div className="flex justify-center gap-1.5 mt-1 mb-6">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`h-1 rounded-full transition-all ${
              p.highlight ? 'w-5 bg-[#b8f542]' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Comparativo rápido */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
          <div className="grid grid-cols-4 text-center text-[11px] border-b border-white/6">
            <div className="py-3 px-2 text-white/30 font-medium">Feature</div>
            {PLANS.map((p) => (
              <div key={p.id} className="py-3 px-1 font-semibold" style={{ color: p.color }}>
                {p.name}
              </div>
            ))}
          </div>
          {[
            { label: 'Curtidas',      values: ['5/dia', '30/dia', 'Ilimitadas'] },
            { label: 'SuperCurtidas', values: ['1/dia', '4/dia', '10/dia'] },
            { label: 'Lupas',         values: ['1/dia', '1/dia', '2/dia'] },
            { label: 'Tickets',       values: ['1/dia', '2/dia', '3/dia'] },
            { label: 'Video',         values: ['1h/dia', '5h/dia', '10h/dia'] },
            { label: 'Quem curtiu',   values: ['—', '✓', '✓'] },
            { label: 'Backstage',     values: ['—', '—', '✓'] },
          ].map((row, i) => (
            <div key={row.label} className={`grid grid-cols-4 text-center text-[11px] ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
              <div className="py-2.5 px-2 text-white/40 text-left">{row.label}</div>
              {row.values.map((v, j) => (
                <div key={j} className="py-2.5 px-1 text-white/60">
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <p className="text-center text-white/20 text-xs px-5">
        Pagamento seguro via PIX ou cartao · Cancele quando quiser
      </p>
    </div>
  )
}

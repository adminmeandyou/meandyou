'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Check, Zap, Star, Crown } from 'lucide-react'

// ─── Configuração dos planos ──────────────────────────────────────────────────

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 10,
    icon: Zap,
    color: '#ffffff',
    checkoutUrl: 'https://pay.cakto.com.br/cip6fy9_797209',
    features: [
      'Até 3 fotos no perfil',
      '1h de videochamada por dia',
      'Sistema de matches',
      'Chat com seus matches',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 39,
    icon: Star,
    color: '#b8f542',
    checkoutUrl: 'https://pay.cakto.com.br/3arwn9f',
    highlight: true,
    features: [
      'Até 5 fotos no perfil',
      '5h de videochamada por dia',
      'SuperLikes',
      'Chat com seus matches',
      'Acesso prioritário na busca',
    ],
  },
  {
    id: 'black',
    name: 'Black',
    price: 100,
    icon: Crown,
    color: '#f5c842',
    checkoutUrl: 'https://pay.cakto.com.br/hftqkrj',
    features: [
      'Até 8 fotos no perfil',
      '10h de videochamada por dia',
      'SuperLikes + Boosts',
      'Chat com seus matches',
      'Acesso prioritário na busca',
      'Filtros Sugar e Fetiche',
    ],
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PlanosPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadCurrentPlan()
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

    // Redireciona para o checkout da Cakto
    // A Cakto vai capturar o email do usuário no checkout
    window.open(plan.checkoutUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta px-4 py-10">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-fraunces text-4xl text-white mb-3">
          Escolha seu <span className="italic text-[#b8f542]">plano</span>
        </h1>
        <p className="text-white/40 text-sm max-w-xs mx-auto">
          Todos os planos incluem verificação biométrica e perfis 100% reais
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isActive = currentPlan === plan.id
          const isHighlight = plan.highlight

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-6 transition ${
                isHighlight
                  ? 'bg-[#b8f542]/5 border-[#b8f542]/30'
                  : 'bg-white/3 border-white/8'
              } ${isActive ? 'ring-2 ring-[#b8f542]' : ''}`}
            >
              {/* Badge mais popular */}
              {isHighlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#b8f542] text-black text-xs font-bold">
                  Mais popular
                </div>
              )}

              {/* Plano ativo */}
              {isActive && (
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs">
                  Plano atual
                </div>
              )}

              {/* Topo */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}15` }}
                  >
                    <Icon size={20} style={{ color: plan.color }} />
                  </div>
                  <span className="font-fraunces text-xl text-white">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-fraunces text-2xl text-white">R$ {plan.price}</span>
                  <span className="text-white/30 text-xs">/mês</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
                    <Check size={14} style={{ color: plan.color }} className="shrink-0" />
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
                    : 'bg-white/8 text-white hover:bg-white/12 border border-white/10'
                }`}
              >
                {isActive ? 'Ativo' : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Rodapé */}
      <p className="text-center text-white/20 text-xs mt-8">
        Pagamento seguro via PIX ou cartão · Cancele quando quiser
      </p>
    </div>
  )
}
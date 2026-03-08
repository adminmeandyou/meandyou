'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { Star, Zap, ArrowLeft, CheckCircle, Loader2, ShoppingBag, Search, RotateCcw, Ticket } from 'lucide-react'

const STORE_ITEMS = [
  // SuperLikes
  {
    id: 'superlikes_5',
    type: 'superlike',
    label: '5 SuperLikes',
    description: 'Se destaque para quem você mais quer',
    amount: 5,
    price: 'R$ 5',
    url: 'https://pay.cakto.com.br/qjgmwzu',
    icon: '⭐',
    highlight: false,
  },
  {
    id: 'superlikes_15',
    type: 'superlike',
    label: '15 SuperLikes',
    description: 'Melhor custo-benefício',
    amount: 15,
    price: 'R$ 10',
    url: 'https://pay.cakto.com.br/33kbrpq',
    icon: '⭐',
    highlight: true,
  },
  {
    id: 'superlikes_30',
    type: 'superlike',
    label: '30 SuperLikes',
    description: 'Para quem quer se destacar muito',
    amount: 30,
    price: 'R$ 15',
    url: 'https://pay.cakto.com.br/ft87o9v',
    icon: '⭐',
    highlight: false,
  },
  // Boosts
  {
    id: 'boost_1',
    type: 'boost',
    label: '1 Boost',
    description: '30 min em destaque na sua região',
    amount: 1,
    price: 'R$ 6',
    url: 'https://pay.cakto.com.br/hsv4ooq',
    icon: '⚡',
    highlight: false,
  },
  {
    id: 'boost_5',
    type: 'boost',
    label: '5 Boosts',
    description: 'Use quando quiser, sem prazo',
    amount: 5,
    price: 'R$ 25',
    url: 'https://pay.cakto.com.br/sgbdabs',
    icon: '⚡',
    highlight: true,
  },
  // Lupas — slugs a definir no Cakto
  {
    id: 'lupa_5',
    type: 'lupa',
    label: '5 Lupas',
    description: 'Veja quem curtiu seu perfil',
    amount: 5,
    price: 'R$ 7',
    url: 'https://pay.cakto.com.br/lupa_5_slug',
    icon: '🔍',
    highlight: false,
  },
  {
    id: 'lupa_15',
    type: 'lupa',
    label: '15 Lupas',
    description: 'Melhor custo-benefício',
    amount: 15,
    price: 'R$ 17',
    url: 'https://pay.cakto.com.br/lupa_15_slug',
    icon: '🔍',
    highlight: true,
  },
  {
    id: 'lupa_30',
    type: 'lupa',
    label: '30 Lupas',
    description: 'Para explorar bastante',
    amount: 30,
    price: 'R$ 29',
    url: 'https://pay.cakto.com.br/lupa_30_slug',
    icon: '🔍',
    highlight: false,
  },
  // Rewinds — slug a definir no Cakto
  {
    id: 'rewind_5',
    type: 'rewind',
    label: '5 Desfazer Curtida',
    description: 'Volte atrás em até 5 perfis',
    amount: 5,
    price: 'R$ 5',
    url: 'https://pay.cakto.com.br/rewind_5_slug',
    icon: '↩️',
    highlight: false,
  },
]

const SECTION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  superlike: { label: 'SuperLikes', icon: <Star size={12} className="text-yellow-400" /> },
  boost:     { label: 'Boosts',     icon: <Zap size={12} className="text-[#b8f542]" /> },
  lupa:      { label: 'Lupas',      icon: <Search size={12} className="text-blue-400" /> },
  rewind:    { label: 'Desfazer Curtida', icon: <RotateCcw size={12} className="text-purple-400" /> },
}

export default function LojaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()

  const [superlikes, setSuperlikes] = useState(0)
  const [boosts, setBoosts] = useState(0)
  const [lupas, setLupas] = useState(0)
  const [rewinds, setRewinds] = useState(0)
  const [tickets, setTickets] = useState(0)
  const [boostActiveUntil, setBoostActiveUntil] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)
  const [activateMsg, setActivateMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadBalance()
  }, [user])

  async function loadBalance() {
    const [{ data: sl }, { data: bo }, { data: lp }, { data: rw }, { data: tk }] = await Promise.all([
      supabase.from('user_superlikes').select('amount').eq('user_id', user!.id).single(),
      supabase.from('user_boosts').select('amount, active_until').eq('user_id', user!.id).single(),
      supabase.from('user_lupas').select('amount').eq('user_id', user!.id).single(),
      supabase.from('user_rewinds').select('amount').eq('user_id', user!.id).single(),
      supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
    ])
    setSuperlikes(sl?.amount ?? 0)
    setBoosts(bo?.amount ?? 0)
    setBoostActiveUntil(bo?.active_until ?? null)
    setLupas(lp?.amount ?? 0)
    setRewinds(rw?.amount ?? 0)
    setTickets(tk?.amount ?? 0)
    setLoading(false)
  }

  async function handleActivateBoost() {
    // Black: max 2 boosts simultâneos
    if (limits.isBlack) {
      const { data: activeBoosts } = await supabase
        .from('user_boosts')
        .select('active_until')
        .eq('user_id', user!.id)
        .gt('active_until', new Date().toISOString())
      if ((activeBoosts?.length ?? 0) >= 2) {
        setActivateMsg('Limite de 2 Boosts simultâneos atingido (plano Black).')
        setTimeout(() => setActivateMsg(null), 4000)
        return
      }
    }

    setActivating(true)
    setActivateMsg(null)
    const { data } = await supabase.rpc('activate_boost', { p_user_id: user!.id })
    if (data?.success) {
      setActivateMsg('Boost ativado! Seu perfil está em destaque por 30 minutos.')
      setBoostActiveUntil(data.active_until)
      setBoosts((b) => b - 1)
    } else if (data?.reason === 'no_boosts') {
      setActivateMsg('Você não tem Boosts disponíveis.')
    } else if (data?.reason === 'already_active') {
      setActivateMsg('Você já tem um Boost ativo!')
    }
    setActivating(false)
    setTimeout(() => setActivateMsg(null), 4000)
  }

  const boostIsActive = boostActiveUntil && new Date(boostActiveUntil) > new Date()
  const types = ['superlike', 'boost', 'lupa', 'rewind'] as const

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#b8f542]" />
          <h1 className="font-fraunces text-xl text-white">Loja</h1>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-6">

        {/* Saldo atual */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2">
            <BalanceCard emoji="⭐" label="SuperLikes" value={superlikes} />
            <BalanceCard emoji="⚡" label="Boosts" value={boosts} active={!!boostIsActive} />
            <BalanceCard emoji="🔍" label="Lupas" value={lupas} />
            <BalanceCard emoji="↩️" label="Rewinds" value={rewinds} />
            <BalanceCard emoji={<Ticket size={20} className="text-[#b8f542]" />} label="Tickets" value={tickets} />
          </div>
        )}

        {/* Ativar boost */}
        {boosts > 0 && !boostIsActive && (
          <button
            onClick={handleActivateBoost}
            disabled={activating}
            className="w-full py-3.5 rounded-2xl bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#b8f542]/20 transition"
          >
            {activating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Ativar Boost agora
          </button>
        )}

        {boostIsActive && (
          <div className="w-full py-3.5 rounded-2xl bg-[#b8f542]/10 border border-[#b8f542]/30 flex items-center justify-center gap-2">
            <CheckCircle size={16} className="text-[#b8f542]" />
            <span className="text-[#b8f542] text-sm font-semibold">Boost ativo — perfil em destaque!</span>
          </div>
        )}

        {activateMsg && (
          <p className="text-center text-sm text-white/50">{activateMsg}</p>
        )}

        {/* Seções por tipo */}
        {types.map((type) => {
          const items = STORE_ITEMS.filter((i) => i.type === type)
          const section = SECTION_LABELS[type]
          return (
            <div key={type}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                {section.icon} {section.label}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <StoreItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}

        <p className="text-center text-white/20 text-xs pb-4">
          Compras são processadas pela Cakto. Pagamento único, sem reembolso.
        </p>
      </div>
    </div>
  )
}

function BalanceCard({ emoji, label, value, active }: {
  emoji: React.ReactNode
  label: string
  value: number
  active?: boolean
}) {
  return (
    <div className={`rounded-2xl p-3 flex items-center gap-2 border ${active ? 'bg-[#b8f542]/10 border-[#b8f542]/30' : 'bg-white/5 border-white/8'}`}>
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="text-white/30 text-xs">{label}</p>
        <p className={`font-bold text-lg ${active ? 'text-[#b8f542]' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}

function StoreItem({ item }: { item: typeof STORE_ITEMS[0] }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 p-4 rounded-2xl border transition hover:scale-[1.01] active:scale-[0.99] ${
        item.highlight
          ? 'bg-[#b8f542]/5 border-[#b8f542]/30'
          : 'bg-white/3 border-white/8'
      }`}
    >
      <span className="text-2xl">{item.icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm">{item.label}</p>
          {item.highlight && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#b8f542]/20 text-[#b8f542] font-semibold">
              Popular
            </span>
          )}
        </div>
        <p className="text-white/30 text-xs mt-0.5">{item.description}</p>
      </div>
      <span className={`font-bold text-sm ${item.highlight ? 'text-[#b8f542]' : 'text-white'}`}>
        {item.price}
      </span>
    </a>
  )
}

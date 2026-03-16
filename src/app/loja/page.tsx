'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { Star, Zap, ArrowLeft, CheckCircle, Loader2, ShoppingBag, Search, RotateCcw, Ticket, Plus } from 'lucide-react'
import { StoreBottomSheet, type StoreItemType } from '@/components/StoreBottomSheet'

const SECTION_LABELS: Record<StoreItemType, { label: string; icon: React.ReactNode; description: string }> = {
  superlike: {
    label: 'SuperLikes',
    icon: <Star size={14} className="text-yellow-400" />,
    description: 'Se destaque para quem voce mais quer',
  },
  boost: {
    label: 'Boosts',
    icon: <Zap size={14} className="text-[#b8f542]" />,
    description: '30 min em destaque na sua regiao',
  },
  lupa: {
    label: 'Lupas',
    icon: <Search size={14} className="text-blue-400" />,
    description: 'Revele perfis na aba Destaque',
  },
  rewind: {
    label: 'Desfazer Curtida',
    icon: <RotateCcw size={14} className="text-purple-400" />,
    description: 'Volte atras em perfis que passou',
  },
  ghost: {
    label: 'Modo Fantasma',
    icon: <span style={{ fontSize: '14px', lineHeight: 1 }}>👻</span>,
    description: 'Some das buscas temporariamente',
  },
}

const TYPES: StoreItemType[] = ['superlike', 'boost', 'lupa', 'rewind', 'ghost']

export default function LojaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()

  const [superlikes, setSuperlikes]           = useState(0)
  const [boosts, setBoosts]                   = useState(0)
  const [lupas, setLupas]                     = useState(0)
  const [rewinds, setRewinds]                 = useState(0)
  const [tickets, setTickets]                 = useState(0)
  const [boostActiveUntil, setBoostActiveUntil] = useState<string | null>(null)
  const [ghostModeUntil, setGhostModeUntil]   = useState<string | null>(null)
  const [activating, setActivating]           = useState(false)
  const [activateMsg, setActivateMsg]         = useState<string | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [openSheet, setOpenSheet]             = useState<StoreItemType | null>(null)

  useEffect(() => {
    if (!user) return
    loadBalance()
  }, [user])

  async function loadBalance() {
    const [{ data: sl }, { data: bo }, { data: lp }, { data: rw }, { data: tk }, { data: gh }] =
      await Promise.all([
        supabase.from('user_superlikes').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user!.id).single(),
        supabase.from('user_lupas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_rewinds').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
        supabase.from('profiles').select('ghost_mode_until').eq('id', user!.id).single(),
      ])

    setSuperlikes(sl?.amount ?? 0)
    setBoosts(bo?.amount ?? 0)
    setBoostActiveUntil(bo?.active_until ?? null)
    setLupas(lp?.amount ?? 0)
    setRewinds(rw?.amount ?? 0)
    setTickets(tk?.amount ?? 0)
    setGhostModeUntil(gh?.ghost_mode_until ?? null)
    setLoading(false)

    // Notificar se boost expirou nas últimas 2 horas
    if (bo?.active_until) {
      const expiredAt = new Date(bo.active_until)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      if (expiredAt < new Date() && expiredAt > twoHoursAgo) {
        const notifyKey = `boost_expired_${bo.active_until}`
        if (!sessionStorage.getItem(notifyKey)) {
          sessionStorage.setItem(notifyKey, '1')
          const { data: { session } } = await supabase.auth.getSession()
          fetch('/api/boosts/notify-expired', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
          }).catch(() => {})
        }
      }
    }
  }

  async function handleActivateBoost() {
    setActivating(true)
    setActivateMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/boosts/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
    })
    const data = await res.json()

    if (data?.success) {
      setActivateMsg('Boost ativado! Seu perfil esta em destaque por 30 minutos.')
      setBoostActiveUntil(data.active_until)
      setBoosts((b) => b - 1)
    } else if (data?.reason === 'no_boosts') {
      setActivateMsg('Voce nao tem Boosts disponiveis.')
    } else if (data?.reason === 'already_active') {
      setActivateMsg('Voce ja tem um Boost ativo!')
    } else if (data?.reason === 'max_simultaneous') {
      setActivateMsg('Limite de 2 Boosts simultaneos atingido (plano Black).')
    }
    setActivating(false)
    setTimeout(() => setActivateMsg(null), 4000)
  }

  const boostIsActive = boostActiveUntil && new Date(boostActiveUntil) > new Date()
  const ghostIsActive = ghostModeUntil && new Date(ghostModeUntil) > new Date()
  const ghostDaysLeft = ghostIsActive
    ? Math.ceil((new Date(ghostModeUntil!).getTime() - Date.now()) / 86400000)
    : 0

  const balanceByType: Record<StoreItemType, number> = {
    superlike: superlikes,
    boost: boosts,
    lupa: lupas,
    rewind: rewinds,
    ghost: ghostDaysLeft,
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#b8f542]" />
          <h1 className="font-fraunces text-xl text-white">Loja</h1>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-5">

        {/* Saldo atual */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2">
            <BalanceCard emoji="⭐" label="SuperLikes" value={superlikes} />
            <BalanceCard emoji="⚡" label="Boosts" value={boosts} active={!!boostIsActive} />
            <BalanceCard emoji="🔍" label="Lupas" value={lupas} />
            <BalanceCard emoji="↩️" label="Rewinds" value={rewinds} />
            <BalanceCard
              emoji={<Ticket size={20} className="text-[#b8f542]" />}
              label="Tickets"
              value={tickets}
            />
            <BalanceCard emoji="👻" label="Fantasma" value={ghostDaysLeft} active={!!ghostIsActive} suffix="d" />
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

        {/* Seções de compra */}
        <div className="space-y-3">
          {TYPES.map((type) => {
            const section = SECTION_LABELS[type]
            const balance = balanceByType[type]
            const suffix  = type === 'ghost' ? 'd' : undefined

            return (
              <div
                key={type}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/3"
              >
                {/* Ícone + saldo */}
                <div className="w-11 h-11 rounded-2xl bg-white/6 flex items-center justify-center shrink-0 text-xl">
                  {type === 'superlike' ? '⭐'
                    : type === 'boost'  ? '⚡'
                    : type === 'lupa'   ? '🔍'
                    : type === 'rewind' ? '↩️'
                    : '👻'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {section.icon}
                    <span className="text-white font-semibold text-sm">{section.label}</span>
                  </div>
                  <p className="text-white/30 text-xs truncate">{section.description}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    Saldo: <span className="text-white/80 font-medium">{balance}{suffix ?? ''}</span>
                  </p>
                </div>

                {/* Botão comprar */}
                <button
                  onClick={() => setOpenSheet(type)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] text-sm font-semibold shrink-0 hover:bg-[#b8f542]/20 transition active:scale-95"
                >
                  <Plus size={13} />
                  Comprar
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-white/20 text-xs pb-4">
          Compras sao processadas pela Cakto. Pagamento unico, sem reembolso.
        </p>
      </div>

      {/* Bottom Sheet de microtransação */}
      {openSheet && (
        <StoreBottomSheet
          type={openSheet}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </div>
  )
}

function BalanceCard({ emoji, label, value, active, suffix }: {
  emoji: React.ReactNode
  label: string
  value: number
  active?: boolean
  suffix?: string
}) {
  return (
    <div className={`rounded-2xl p-3 flex items-center gap-2 border ${active ? 'bg-[#b8f542]/10 border-[#b8f542]/30' : 'bg-white/5 border-white/[0.08]'}`}>
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="text-white/30 text-xs">{label}</p>
        <p className={`font-bold text-lg leading-tight ${active ? 'text-[#b8f542]' : 'text-white'}`}>
          {value}{suffix && <span className="text-sm font-normal ml-0.5">{suffix}</span>}
        </p>
      </div>
    </div>
  )
}

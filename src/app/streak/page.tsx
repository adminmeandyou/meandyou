'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Flame, Ticket, Star, Zap, Search, RotateCcw, Gift, Lock, CheckCircle, Loader2 } from 'lucide-react'

// Ícone e cor por tipo de prêmio
const REWARD_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string; label: string }> = {
  ticket:       { emoji: '🎟️', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  label: 'Ticket' },
  supercurtida: { emoji: '⭐',  color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    label: 'SuperLike' },
  boost:        { emoji: '⚡',  color: 'text-[#b8f542]',  bg: 'bg-[#b8f542]/10',  border: 'border-[#b8f542]/30',   label: 'Boost' },
  lupa:         { emoji: '🔍',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',    label: 'Lupa' },
  rewind:       { emoji: '↩️',  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30',  label: 'Desfazer' },
}

type CalendarEntry = {
  day_number: number
  reward_type: string
  reward_amount: number
  claimed: boolean
}

type StreakData = {
  current_streak: number
  longest_streak: number
  last_login_date: string | null
}

export default function StreakPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [streak, setStreak] = useState<StreakData | null>(null)
  const [calendar, setCalendar] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [claimMsg, setClaimMsg] = useState<{ day: number; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)

    const [{ data: st }, { data: cal }] = await Promise.all([
      supabase
        .from('daily_streaks')
        .select('current_streak, longest_streak, last_login_date')
        .eq('user_id', user!.id)
        .single(),
      supabase
        .from('streak_calendar')
        .select('day_number, reward_type, reward_amount, claimed')
        .eq('user_id', user!.id)
        .order('day_number', { ascending: true }),
    ])

    setStreak(st ?? { current_streak: 0, longest_streak: 0, last_login_date: null })
    setCalendar(cal ?? [])
    setLoading(false)
  }

  async function handleClaim(dayNumber: number) {
    setClaiming(dayNumber)
    const { data, error } = await supabase.rpc('claim_streak_reward', {
      p_user_id: user!.id,
      p_day_number: dayNumber,
    })

    if (error || !data?.success) {
      const reason = data?.reason ?? 'erro'
      const msgs: Record<string, string> = {
        already_claimed: 'Já resgatado hoje.',
        not_reached: 'Dia ainda não alcançado.',
        streak_reset: 'Seu streak foi resetado.',
      }
      setClaimMsg({ day: dayNumber, text: msgs[reason] ?? 'Não foi possível resgatar.' })
    } else {
      // Marca como claimed localmente
      setCalendar((prev) =>
        prev.map((e) => (e.day_number === dayNumber ? { ...e, claimed: true } : e))
      )
      const entry = calendar.find((e) => e.day_number === dayNumber)
      if (entry) {
        const cfg = REWARD_CONFIG[entry.reward_type]
        setClaimMsg({
          day: dayNumber,
          text: `+${entry.reward_amount} ${cfg?.label ?? entry.reward_type} adicionado!`,
        })
      }
    }

    setClaiming(null)
    setTimeout(() => setClaimMsg(null), 3000)
  }

  // Dia atual do streak (1-based)
  const currentDay = streak?.current_streak ?? 0

  // Verifica se o usuário pode resgatar o dia (alcançou e não resgatou ainda)
  function canClaim(entry: CalendarEntry) {
    return entry.day_number <= currentDay && !entry.claimed
  }

  // Fases de streak para exibir badge
  function getPhaseLabel(day: number) {
    if (day >= 30) return { label: '🔥 Lendário', color: 'text-orange-400' }
    if (day >= 21) return { label: '💪 Dedicado', color: 'text-violet-400' }
    if (day >= 14) return { label: '⚡ Em forma', color: 'text-[#b8f542]' }
    if (day >= 7)  return { label: '📈 Crescendo', color: 'text-blue-400' }
    return { label: '🌱 Iniciante', color: 'text-white/40' }
  }

  const phase = getPhaseLabel(currentDay)

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Sequência diária</h1>
          <p className="text-white/30 text-xs">Entre todo dia e ganhe prêmios</p>
        </div>
        {/* Streak atual */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
          <Flame size={12} className="text-orange-400" />
          <span className="text-orange-400 text-xs font-bold">{loading ? '…' : currentDay} dias</span>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 size={28} className="animate-spin text-white/20" />
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-6">

          {/* Card de streak */}
          <div className="rounded-2xl p-5 bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Flame size={32} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold mb-0.5 ${phase.color}`}>{phase.label}</p>
                <p className="font-fraunces text-3xl text-white">{currentDay} <span className="text-base text-white/40">dias seguidos</span></p>
                <p className="text-white/30 text-xs mt-0.5">Recorde pessoal: {streak?.longest_streak ?? 0} dias</p>
              </div>
            </div>

            {/* Aviso de reset */}
            {currentDay > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-500/10 text-center">
                <p className="text-white/30 text-xs">
                  ⚠️ Fique mais de 7 dias sem entrar e o streak reseta para 0
                </p>
              </div>
            )}
          </div>

          {/* Mensagem de feedback */}
          {claimMsg && (
            <div className="rounded-xl p-3 bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] text-sm text-center font-semibold">
              {claimMsg.text}
            </div>
          )}

          {/* Calendário */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
              Calendário do mês — 1 prêmio por dia
            </h2>

            {calendar.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-sm">
                Calendário do mês ainda não gerado. Volte em breve!
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {calendar.map((entry) => {
                  const cfg = REWARD_CONFIG[entry.reward_type] ?? REWARD_CONFIG['ticket']
                  const reached = entry.day_number <= currentDay
                  const claimable = canClaim(entry)
                  const isClaiming = claiming === entry.day_number

                  return (
                    <div
                      key={entry.day_number}
                      className={`relative rounded-2xl p-3 border flex flex-col items-center gap-1.5 transition
                        ${entry.claimed
                          ? 'bg-white/3 border-white/5 opacity-50'
                          : claimable
                            ? `${cfg.bg} ${cfg.border} cursor-pointer hover:opacity-90`
                            : reached
                              ? 'bg-white/5 border-white/10'
                              : 'bg-white/2 border-white/5 opacity-40'
                        }`}
                      onClick={() => claimable && !isClaiming && handleClaim(entry.day_number)}
                    >
                      {/* Número do dia */}
                      <span className="text-white/30 text-xs font-bold">Dia {entry.day_number}</span>

                      {/* Emoji do prêmio */}
                      {entry.claimed ? (
                        <CheckCircle size={20} className="text-white/30" />
                      ) : reached ? (
                        <span className="text-2xl">{cfg.emoji}</span>
                      ) : (
                        <Lock size={18} className="text-white/20" />
                      )}

                      {/* Quantidade */}
                      {!entry.claimed && (
                        <span className={`text-xs font-bold ${reached ? cfg.color : 'text-white/20'}`}>
                          {entry.reward_amount}x
                        </span>
                      )}

                      {/* Loader ao resgatar */}
                      {isClaiming && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                          <Loader2 size={16} className="animate-spin text-white" />
                        </div>
                      )}

                      {/* Badge "Resgatar" */}
                      {claimable && !isClaiming && (
                        <span className={`text-xs font-bold ${cfg.color}`}>Resgatar</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legenda de fases */}
          <div className="rounded-2xl p-4 bg-white/3 border border-white/8 space-y-2">
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">Prêmios por fase</p>
            {[
              { range: 'Dias 1–6',   desc: 'Tickets (maioria), item básico ocasional',        color: 'text-white/40' },
              { range: 'Dias 7–13',  desc: 'Mais tickets, primeiros itens especiais',         color: 'text-blue-400' },
              { range: 'Dias 14–20', desc: 'Itens médios com mais frequência',                color: 'text-[#b8f542]' },
              { range: 'Dias 21–29', desc: 'Itens bons aparecem',                             color: 'text-violet-400' },
              { range: 'Dias 30–60', desc: 'Prêmios máximos (até 10 itens do mesmo tipo)',    color: 'text-orange-400' },
            ].map((f) => (
              <div key={f.range} className="flex gap-3 items-start">
                <span className={`text-xs font-bold w-20 shrink-0 ${f.color}`}>{f.range}</span>
                <span className="text-white/30 text-xs">{f.desc}</span>
              </div>
            ))}
          </div>

          {/* CTA roleta */}
          <div className="rounded-2xl p-4 bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-3">
            <Ticket size={24} className="text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-white/70 text-sm">Use seus tickets na roleta para ganhar ainda mais prêmios!</p>
            </div>
            <a href="/roleta" className="px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30 transition whitespace-nowrap">
              Ir à roleta
            </a>
          </div>

        </div>
      )}
    </div>
  )
}

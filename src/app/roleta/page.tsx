'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket, Loader2, Star, Zap, Search, RotateCcw, Gift, Crown } from 'lucide-react'

// Mapeamento visual dos tipos de prêmio
const PRIZE_CONFIG: Record<string, {
  label: string
  emoji: string
  color: string
  bg: string
  border: string
  icon: React.ReactNode
  rarity?: string
}> = {
  ticket:        { label: 'Ticket',         emoji: '🎟️', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30', icon: <Ticket size={20} /> },
  supercurtida:  { label: 'SuperLike',      emoji: '⭐',  color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',   icon: <Star size={20} /> },
  boost:         { label: 'Boost',          emoji: '⚡',  color: 'text-[#b8f542]',  bg: 'bg-[#b8f542]/10',  border: 'border-[#b8f542]/30',  icon: <Zap size={20} /> },
  lupa:          { label: 'Lupa',           emoji: '🔍',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: <Search size={20} /> },
  rewind:        { label: 'Desfazer',       emoji: '↩️',  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <RotateCcw size={20} /> },
  invisivel_1d:  { label: 'Invisível 1 dia', emoji: '👻', color: 'text-gray-300',  bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   icon: <Gift size={20} /> },
  plan_plus_1d:  { label: '1 dia Plus',     emoji: '💎',  color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/40', icon: <Crown size={20} />, rarity: 'Raro' },
  plan_black_1d: { label: '1 dia Black',    emoji: '🖤',  color: 'text-white',      bg: 'bg-white/10',      border: 'border-white/30',      icon: <Crown size={20} />, rarity: 'Lendário' },
}

// Segmentos visuais da roleta (ordem na roda)
const WHEEL_SEGMENTS = [
  { type: 'ticket',       label: '1 Ticket',    color: '#eab308' },
  { type: 'supercurtida', label: '1 SuperLike', color: '#ec4899' },
  { type: 'ticket',       label: '2 Tickets',   color: '#ca8a04' },
  { type: 'lupa',         label: '1 Lupa',      color: '#3b82f6' },
  { type: 'ticket',       label: '1 Ticket',    color: '#eab308' },
  { type: 'boost',        label: '1 Boost',     color: '#b8f542' },
  { type: 'ticket',       label: '3 Tickets',   color: '#ca8a04' },
  { type: 'rewind',       label: '1 Desfazer',  color: '#a855f7' },
]

type SpinResult = {
  reward_type: string
  reward_amount: number
  was_jackpot?: boolean
}

export default function RoletaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinningRef = useRef(false)

  const [tickets, setTickets] = useState(0)
  const [spinsToday, setSpinsToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [rotation, setRotation] = useState(0)
  const [history, setHistory] = useState<any[]>([])

  // Tickets diários por plano
  const dailyTickets = limits.isBlack ? 3 : limits.isPlus ? 2 : 1
  const spinsLeft = Math.max(0, dailyTickets - spinsToday)
  const canSpin = tickets > 0 && !spinning

  useEffect(() => {
    if (!user) return
    loadData()
    drawWheel(rotation)
  }, [user])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [{ data: tk }, { data: hist }] = await Promise.all([
      supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
      supabase.from('roleta_history')
        .select('reward_type, reward_amount, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Contar giros de hoje
    const { count } = await supabase
      .from('roleta_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', `${today}T00:00:00`)

    setTickets(tk?.amount ?? 0)
    setSpinsToday(count ?? 0)
    setHistory(hist ?? [])
    setLoading(false)
  }

  function drawWheel(currentRotation: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const radius = cx - 8
    const segCount = WHEEL_SEGMENTS.length
    const segAngle = (2 * Math.PI) / segCount

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    WHEEL_SEGMENTS.forEach((seg, i) => {
      const startAngle = currentRotation + i * segAngle
      const endAngle = startAngle + segAngle

      // Fatia
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = seg.color + '33'
      ctx.fill()
      ctx.strokeStyle = seg.color + '88'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Texto
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + segAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.fillText(seg.label, radius - 10, 4)
      ctx.restore()
    })

    // Centro
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a1025'
    ctx.fill()
    ctx.strokeStyle = '#ffffff22'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  function animateSpin(targetRotation: number, onDone: () => void) {
    const start = performance.now()
    const duration = 3500
    const from = rotation

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = from + (targetRotation - from) * ease
      drawWheel(current)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setRotation(targetRotation % (2 * Math.PI))
        onDone()
      }
    }
    requestAnimationFrame(step)
  }

  async function handleSpin() {
    if (!canSpin || spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setResult(null)

    // Chama RPC — toda lógica de peso, jackpot e débito de ticket está no banco
    const { data, error } = await supabase.rpc('spin_roleta', { p_user_id: user!.id })

    if (error || !data) {
      setSpinning(false)
      spinningRef.current = false
      return
    }

    const prize: SpinResult = data

    // Anima a roda até um ângulo aleatório (pelo menos 5 voltas completas)
    const extraSpins = 5 + Math.random() * 3
    const targetRotation = rotation + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI

    animateSpin(targetRotation, () => {
      setResult(prize)
      setTickets((t) => t - 1)
      setSpinsToday((s) => s + 1)
      setHistory((prev) => [
        { reward_type: prize.reward_type, reward_amount: prize.reward_amount, created_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ])
      setSpinning(false)
      spinningRef.current = false
    })
  }

  function formatPrize(type: string, amount: number) {
    const config = PRIZE_CONFIG[type]
    if (!config) return `${amount}x ${type}`
    if (type === 'plan_plus_1d' || type === 'plan_black_1d') return config.label
    return `${amount}x ${config.label}`
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Roleta</h1>
          <p className="text-white/30 text-xs">Gire e ganhe prêmios todos os dias</p>
        </div>
        {/* Saldo de tickets */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <Ticket size={12} className="text-yellow-400" />
          <span className="text-yellow-400 text-xs font-bold">{loading ? '…' : tickets}</span>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-6">

        {/* Roleta */}
        <div className="flex flex-col items-center gap-4">
          {/* Ponteiro */}
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0"
              style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '18px solid #b8f542' }} />
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="rounded-full border border-white/10"
            />
          </div>

          {/* Botão girar */}
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-base transition-all
              bg-[#b8f542] text-black hover:bg-[#a8e030] active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {spinning ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Girando…
              </span>
            ) : tickets === 0 ? (
              'Sem tickets — ganhe entrando amanhã'
            ) : (
              `Girar (1 ticket)`
            )}
          </button>

          {/* Info de tickets diários */}
          <p className="text-white/30 text-xs text-center">
            Plano {limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'}: {dailyTickets} ticket{dailyTickets > 1 ? 's' : ''}/dia •{' '}
            {spinsLeft > 0 ? `${spinsLeft} ticket${spinsLeft > 1 ? 's' : ''} diário${spinsLeft > 1 ? 's' : ''} disponível` : 'Ticket diário usado — compre mais na loja'}
          </p>
        </div>

        {/* Resultado */}
        {result && (() => {
          const config = PRIZE_CONFIG[result.reward_type] ?? PRIZE_CONFIG['ticket']
          return (
            <div className={`rounded-2xl p-5 border ${config.bg} ${config.border} flex items-center gap-4`}>
              <span className="text-4xl">{config.emoji}</span>
              <div className="flex-1">
                {config.rarity && (
                  <span className={`text-xs font-bold uppercase tracking-widest ${config.color} mb-1 block`}>
                    {config.rarity}!
                  </span>
                )}
                <p className="text-white font-fraunces text-lg">
                  Você ganhou {formatPrize(result.reward_type, result.reward_amount)}!
                </p>
                <p className="text-white/40 text-xs mt-0.5">Adicionado ao seu saldo automaticamente</p>
              </div>
            </div>
          )
        })()}

        {/* Tabela de prêmios */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Prêmios possíveis</h2>
          <div className="space-y-2">
            {Object.entries(PRIZE_CONFIG).map(([type, cfg]) => (
              <div key={type} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <span className="text-lg">{cfg.emoji}</span>
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                {cfg.rarity && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} ${cfg.color} font-bold`}>
                    {cfg.rarity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        {history.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Últimos giros</h2>
            <div className="space-y-2">
              {history.map((h, i) => {
                const cfg = PRIZE_CONFIG[h.reward_type] ?? PRIZE_CONFIG['ticket']
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                    <span className="text-base">{cfg.emoji}</span>
                    <span className="text-white/60 text-sm flex-1">{formatPrize(h.reward_type, h.reward_amount)}</span>
                    <span className="text-white/20 text-xs">
                      {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA para ganhar mais tickets */}
        <div className="rounded-2xl p-4 bg-white/3 border border-white/8 text-center space-y-2">
          <p className="text-white/50 text-sm">Quer mais tickets?</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <a href="/indicar" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition">
              Indicar amigos (+3 tickets)
            </a>
            <a href="/loja" className="px-4 py-2 rounded-xl bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] text-xs hover:bg-[#b8f542]/20 transition">
              Comprar na loja
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

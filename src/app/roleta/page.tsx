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
  color: string
  bg: string
  border: string
  icon: React.ReactNode
  rarity?: string
}> = {
  ticket:        { label: 'Ticket',           color: '#eab308', bg: 'rgba(234,179,8,0.10)',    border: 'rgba(234,179,8,0.30)',    icon: <Ticket size={20} strokeWidth={1.5} /> },
  supercurtida:  { label: 'SuperLike',        color: '#ec4899', bg: 'rgba(236,72,153,0.10)',   border: 'rgba(236,72,153,0.30)',   icon: <Star size={20} strokeWidth={1.5} /> },
  boost:         { label: 'Boost',            color: '#E11D48', bg: 'rgba(225,29,72,0.10)',   border: 'rgba(225,29,72,0.30)',   icon: <Zap size={20} strokeWidth={1.5} /> },
  lupa:          { label: 'Lupa',             color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',   border: 'rgba(59,130,246,0.30)',   icon: <Search size={20} strokeWidth={1.5} /> },
  rewind:        { label: 'Desfazer',         color: '#a855f7', bg: 'rgba(168,85,247,0.10)',   border: 'rgba(168,85,247,0.30)',   icon: <RotateCcw size={20} strokeWidth={1.5} /> },
  invisivel_1d:  { label: 'Invisível 1 dia',  color: '#9ca3af', bg: 'rgba(156,163,175,0.10)',  border: 'rgba(156,163,175,0.30)',  icon: <Gift size={20} strokeWidth={1.5} /> },
  plan_plus_1d:  { label: '1 dia Plus',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',   border: 'rgba(139,92,246,0.40)',   icon: <Crown size={20} strokeWidth={1.5} />, rarity: 'Raro' },
  plan_black_1d: { label: '1 dia Black',      color: '#F8F9FA', bg: 'rgba(255,255,255,0.10)',  border: 'rgba(255,255,255,0.30)',  icon: <Crown size={20} strokeWidth={1.5} />, rarity: 'Lendário' },
}

// Segmentos visuais da roleta (ordem na roda)
const WHEEL_SEGMENTS = [
  { type: 'ticket',       label: '1 Ticket',    color: '#eab308' },
  { type: 'supercurtida', label: '1 SuperLike', color: '#ec4899' },
  { type: 'ticket',       label: '2 Tickets',   color: '#ca8a04' },
  { type: 'lupa',         label: '1 Lupa',      color: '#3b82f6' },
  { type: 'ticket',       label: '1 Ticket',    color: '#eab308' },
  { type: 'boost',        label: '1 Boost',     color: '#E11D48' },
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
  const canSpin = tickets > 0 && spinsLeft > 0 && !spinning

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
    const radius = cx - 6
    const segCount = WHEEL_SEGMENTS.length
    const segAngle = (2 * Math.PI) / segCount

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sombra externa da roda
    ctx.save()
    ctx.shadowColor = 'rgba(225,29,72,0.35)'
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(225,29,72,0.50)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    WHEEL_SEGMENTS.forEach((seg, i) => {
      const startAngle = currentRotation + i * segAngle
      const endAngle = startAngle + segAngle
      const midAngle = startAngle + segAngle / 2

      // Gradiente radial por segmento (do centro para a borda)
      const gx1 = cx + (radius * 0.2) * Math.cos(midAngle)
      const gy1 = cy + (radius * 0.2) * Math.sin(midAngle)
      const gx2 = cx + radius * Math.cos(midAngle)
      const gy2 = cy + radius * Math.sin(midAngle)
      const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
      grad.addColorStop(0, seg.color + '18')
      grad.addColorStop(1, seg.color + '55')

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Borda com brilho
      ctx.strokeStyle = seg.color + 'bb'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Texto com sombra
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)
      ctx.textAlign = 'right'
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 4
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.fillText(seg.label, radius - 12, 4)
      ctx.restore()
    })

    // Hub central com gradiente
    const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 24)
    hubGrad.addColorStop(0, '#2a1520')
    hubGrad.addColorStop(1, '#0F1117')
    ctx.beginPath()
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(225,29,72,0.55)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Ponto central
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(225,29,72,0.8)'
    ctx.fill()
  }

  function animateSpin(targetRotation: number, onDone: () => void) {
    const start = performance.now()
    const duration = 3500
    const from = rotation

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
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

    const { data, error } = await supabase.rpc('spin_roleta', { p_user_id: user!.id })

    if (error || !data) {
      setSpinning(false)
      spinningRef.current = false
      return
    }

    const prize: SpinResult = data

    const segAngle = (2 * Math.PI) / WHEEL_SEGMENTS.length
    const segIdx = (() => {
      if (prize.reward_type === 'ticket') {
        if (prize.reward_amount === 2) return 2
        if (prize.reward_amount === 3) return 6
        return 0
      }
      const map: Record<string, number> = { supercurtida: 1, lupa: 3, boost: 5, rewind: 7 }
      return map[prize.reward_type] ?? 0
    })()
    const naturalStop = -Math.PI / 2 - (segIdx + 0.5) * segAngle
    const delta = ((naturalStop - rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const targetRotation = rotation + 6 * 2 * Math.PI + delta

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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Roleta</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Gire e ganhe prêmios todos os dias</p>
        </div>
        {/* Saldo de tickets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.25)', flexShrink: 0 }}>
          <Ticket size={13} color="#eab308" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: '#eab308', fontWeight: 700 }}>{loading ? '…' : tickets}</span>
        </div>
      </header>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Roleta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

          {/* Ponteiro + canvas */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%) translateY(-1px)',
              zIndex: 10, width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '18px solid #E11D48',
            }} />
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.10)', display: 'block' }}
            />
          </div>

          {/* Botão girar */}
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            style={{
              width: '100%', maxWidth: '320px', padding: '16px',
              borderRadius: '16px', border: 'none',
              backgroundColor: canSpin ? '#E11D48' : 'rgba(225,29,72,0.30)',
              color: '#fff', fontSize: '15px', fontWeight: 700,
              cursor: canSpin ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-jakarta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {spinning ? (
              <>
                <Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
                Girando…
              </>
            ) : tickets === 0 ? (
              'Sem tickets — ganhe entrando amanhã'
            ) : spinsLeft === 0 ? (
              'Limite diário atingido'
            ) : (
              'Girar (1 ticket)'
            )}
          </button>

          {/* Info de tickets diários */}
          <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
            Plano {limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'}: {dailyTickets} ticket{dailyTickets > 1 ? 's' : ''}/dia
            {' • '}
            {spinsLeft > 0
              ? `${spinsLeft} ticket${spinsLeft > 1 ? 's' : ''} diário${spinsLeft > 1 ? 's' : ''} disponível`
              : 'Ticket diário usado — compre mais na loja'}
          </p>
        </div>

        {/* Resultado */}
        {result && (() => {
          const config = PRIZE_CONFIG[result.reward_type] ?? PRIZE_CONFIG['ticket']
          return (
            <div style={{ borderRadius: '16px', padding: '20px', border: `1px solid ${config.border}`, backgroundColor: config.bg, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: config.bg, border: `1px solid ${config.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color, flexShrink: 0 }}>{config.icon}</div>
              <div style={{ flex: 1 }}>
                {config.rarity && (
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: config.color, display: 'block', marginBottom: '4px' }}>
                    {config.rarity}!
                  </span>
                )}
                <p style={{ color: 'var(--text)', fontFamily: 'var(--font-fraunces)', fontSize: '17px', margin: 0 }}>
                  Você ganhou {formatPrize(result.reward_type, result.reward_amount)}!
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>Adicionado ao seu saldo automaticamente</p>
              </div>
            </div>
          )
        })()}

        {/* Tabela de prêmios */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Prêmios possíveis</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(PRIZE_CONFIG).map(([type, cfg]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
                <div style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: cfg.color, flex: 1 }}>{cfg.label}</span>
                {cfg.rarity && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '100px', padding: '2px 10px' }}>
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
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Últimos giros</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h, i) => {
                const cfg = PRIZE_CONFIG[h.reward_type] ?? PRIZE_CONFIG['ticket']
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</div>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', flex: 1 }}>{formatPrize(h.reward_type, h.reward_amount)}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)' }}>
                      {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA para ganhar mais tickets */}
        <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>Quer mais tickets?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/indicar"
              style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--muted)', fontSize: '12px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)' }}
            >
              Indicar amigos (+3 tickets)
            </a>
            <a
              href="/streak"
              style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '12px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)' }}
            >
              Ganhar via streak
            </a>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

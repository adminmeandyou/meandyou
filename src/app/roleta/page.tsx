'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket, Loader2, Star, Zap, Search, RotateCcw, Gift, Crown, Trophy, TrendingUp } from 'lucide-react'
import { useAppHeader } from '@/contexts/AppHeaderContext'

// Configuracao visual dos premios
const PRIZE_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  border: string
  glow: string
  icon: React.ReactNode
  rarity?: string
}> = {
  ticket:        { label: 'Ticket',           color: '#eab308', bg: 'rgba(234,179,8,0.12)',    border: 'rgba(234,179,8,0.35)',    glow: 'rgba(234,179,8,0.5)',    icon: <Ticket size={22} strokeWidth={1.5} /> },
  supercurtida:  { label: 'SuperLike',        color: '#ec4899', bg: 'rgba(236,72,153,0.12)',   border: 'rgba(236,72,153,0.35)',   glow: 'rgba(236,72,153,0.5)',   icon: <Star size={22} strokeWidth={1.5} /> },
  boost:         { label: 'Boost',            color: '#E11D48', bg: 'rgba(225,29,72,0.12)',    border: 'rgba(225,29,72,0.35)',    glow: 'rgba(225,29,72,0.5)',    icon: <Zap size={22} strokeWidth={1.5} /> },
  lupa:          { label: 'Lupa',             color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.35)',   glow: 'rgba(59,130,246,0.5)',   icon: <Search size={22} strokeWidth={1.5} /> },
  rewind:        { label: 'Desfazer',         color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   border: 'rgba(168,85,247,0.35)',   glow: 'rgba(168,85,247,0.5)',   icon: <RotateCcw size={22} strokeWidth={1.5} /> },
  invisivel_1d:  { label: 'Invisivel 1 dia',  color: '#9ca3af', bg: 'rgba(156,163,175,0.12)',  border: 'rgba(156,163,175,0.35)',  glow: 'rgba(156,163,175,0.5)',  icon: <Gift size={22} strokeWidth={1.5} /> },
  plan_plus_1d:  { label: '1 dia Plus',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',   border: 'rgba(139,92,246,0.45)',   glow: 'rgba(139,92,246,0.7)',   icon: <Crown size={22} strokeWidth={1.5} />, rarity: 'Raro' },
  plan_black_1d: { label: '1 dia Black',      color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',   border: 'rgba(245,158,11,0.45)',   glow: 'rgba(245,158,11,0.7)',   icon: <Trophy size={22} strokeWidth={1.5} />, rarity: 'Lendario' },
}

// Segmentos da roleta com gradientes premium
const WHEEL_SEGMENTS = [
  { type: 'ticket',       label: '1 Ticket',    colorA: '#92600A', colorB: '#eab308' },
  { type: 'supercurtida', label: 'SuperLike',   colorA: '#831843', colorB: '#ec4899' },
  { type: 'ticket',       label: '2 Tickets',   colorA: '#92600A', colorB: '#f59e0b' },
  { type: 'lupa',         label: 'Lupa',        colorA: '#1e3a8a', colorB: '#3b82f6' },
  { type: 'ticket',       label: '1 Ticket',    colorA: '#92600A', colorB: '#eab308' },
  { type: 'boost',        label: 'Boost',       colorA: '#881337', colorB: '#E11D48' },
  { type: 'ticket',       label: '3 Tickets',   colorA: '#78350f', colorB: '#f59e0b' },
  { type: 'rewind',       label: 'Desfazer',    colorA: '#4c1d95', colorB: '#a855f7' },
]

type SpinResult = {
  reward_type: string
  reward_amount: number
  was_jackpot?: boolean
}

type Particle = {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; life: number; maxLife: number
  rotation: number; rotSpeed: number
}

export default function RoletaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const { setBackHref } = useAppHeader()

  useEffect(() => {
    setBackHref('/dashboard')
    return () => setBackHref(null)
  }, [setBackHref])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef<HTMLCanvasElement>(null)
  const spinningRef = useRef(false)
  const rotRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const particleAnimRef = useRef<number>(0)

  const [tickets, setTickets] = useState(0)
  const [spinsToday, setSpinsToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userXp, setUserXp] = useState(0)
  const [userLevel, setUserLevel] = useState(0)
  const [xpBonusActive, setXpBonusActive] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [wheelSize, setWheelSize] = useState(300)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    function calcCountdown() {
      const now = new Date()
      const midnight = new Date()
      midnight.setDate(midnight.getDate() + 1)
      midnight.setHours(0, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setCountdown(`${h}:${m}:${s}`)
    }
    calcCountdown()
    const id = setInterval(calcCountdown, 1000)
    return () => clearInterval(id)
  }, [])

  const dailyTickets = limits.isBlack ? 3 : limits.isPlus ? 2 : 1
  const spinsLeft = Math.max(0, dailyTickets - spinsToday)
  const canSpin = tickets > 0 && spinsLeft > 0 && !spinning

  // Responsividade do canvas
  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth
      if (w >= 1024) setWheelSize(400)
      else if (w >= 768) setWheelSize(360)
      else setWheelSize(Math.min(280, w - 60))
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  useEffect(() => {
    if (wheelSize > 0) drawWheel(rotRef.current)
  }, [wheelSize])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [{ data: tk }, { data: hist }, { data: profile }] = await Promise.all([
      supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
      supabase.from('roleta_history')
        .select('reward_type, reward_amount, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('profiles').select('xp, xp_level, xp_bonus_until').eq('id', user!.id).single(),
    ])

    const { count } = await supabase
      .from('roleta_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', `${today}T00:00:00`)

    setTickets(tk?.amount ?? 0)
    setSpinsToday(count ?? 0)
    setHistory(hist ?? [])
    setUserXp(profile?.xp ?? 0)
    setUserLevel(profile?.xp_level ?? 0)
    setXpBonusActive(profile?.xp_bonus_until ? new Date(profile.xp_bonus_until) > new Date() : false)
    setLoading(false)
  }

  function drawWheel(currentRotation: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = wheelSize
    canvas.width = size
    canvas.height = size
    const cx = size / 2
    const cy = size / 2
    const outerR = cx - 4
    const innerR = outerR - 4
    const segCount = WHEEL_SEGMENTS.length
    const segAngle = (2 * Math.PI) / segCount

    ctx.clearRect(0, 0, size, size)

    // Anel externo decorativo com glow
    ctx.save()
    ctx.shadowColor = 'rgba(225,29,72,0.6)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(225,29,72,0.7)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()

    // Segundo anel decorativo
    ctx.beginPath()
    ctx.arc(cx, cy, outerR - 8, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Segmentos
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const startAngle = currentRotation + i * segAngle
      const endAngle = startAngle + segAngle
      const midAngle = startAngle + segAngle / 2

      // Gradiente do centro para a borda
      const gxA = cx + (innerR * 0.2) * Math.cos(midAngle)
      const gyA = cy + (innerR * 0.2) * Math.sin(midAngle)
      const gxB = cx + (innerR * 0.92) * Math.cos(midAngle)
      const gyB = cy + (innerR * 0.92) * Math.sin(midAngle)
      const grad = ctx.createLinearGradient(gxA, gyA, gxB, gyB)
      grad.addColorStop(0, seg.colorA + 'cc')
      grad.addColorStop(1, seg.colorB + 'ff')

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, innerR, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Borda do segmento com brilho sutil
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = seg.colorB
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Separador entre segmentos
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle))
      ctx.stroke()
      ctx.restore()

      // Label do segmento
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)
      ctx.textAlign = 'right'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.max(9, wheelSize * 0.035)}px Inter, sans-serif`
      ctx.fillText(seg.label, innerR - 14, 4)
      ctx.restore()

      // Ícone/ponto colorido próximo ao centro
      const iconDist = innerR * 0.32
      const ix = cx + iconDist * Math.cos(midAngle)
      const iy = cy + iconDist * Math.sin(midAngle)
      ctx.beginPath()
      ctx.arc(ix, iy, 4, 0, 2 * Math.PI)
      ctx.fillStyle = seg.colorB
      ctx.shadowColor = seg.colorB
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Hub central com gradiente e profundidade
    const hubR = Math.max(22, wheelSize * 0.1)
    const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 2, cx, cy, hubR)
    hubGrad.addColorStop(0, '#2a0d1c')
    hubGrad.addColorStop(0.5, '#16050f')
    hubGrad.addColorStop(1, '#0F1117')
    ctx.save()
    ctx.shadowColor = 'rgba(225,29,72,0.4)'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(225,29,72,0.60)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()

    // Anel interno do hub
    ctx.beginPath()
    ctx.arc(cx, cy, hubR - 6, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Ponto central brilhante
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
    ctx.fillStyle = '#E11D48'
    ctx.shadowColor = '#E11D48'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Easing easeOutBack para bounce ao parar
  function easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  function animateSpin(targetRotation: number, onDone: () => void) {
    const start = performance.now()
    const duration = 4000
    const from = rotRef.current

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)

      // easeOutBack apenas nos ultimos 20% para o bounce
      let ease: number
      if (progress < 0.8) {
        ease = 1 - Math.pow(1 - progress / 0.8, 2.5)
        ease *= 0.85
      } else {
        const t = (progress - 0.8) / 0.2
        ease = 0.85 + easeOutBack(t) * 0.15
      }

      const current = from + (targetRotation - from) * ease
      rotRef.current = current
      drawWheel(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        rotRef.current = targetRotation % (2 * Math.PI)
        drawWheel(rotRef.current)
        onDone()
      }
    }
    requestAnimationFrame(step)
  }

  // Particulas de celebracao
  function spawnParticles() {
    const canvas = particleRef.current
    if (!canvas) return
    const colors = ['#E11D48', '#F59E0B', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#eab308']
    const pts: Particle[] = []
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * 2 * Math.PI
      const speed = 3 + Math.random() * 8
      pts.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1, maxLife: 60 + Math.random() * 60,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
      })
    }
    particlesRef.current = pts

    function animateParticles() {
      const pCanvas = particleRef.current
      if (!pCanvas) return
      const pCtx = pCanvas.getContext('2d')
      if (!pCtx) return
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height)

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.25
        p.rotation += p.rotSpeed
        p.life = 1 - (1 / p.maxLife)
        p.maxLife--

        pCtx.save()
        pCtx.globalAlpha = p.maxLife / 60
        pCtx.translate(p.x, p.y)
        pCtx.rotate(p.rotation * Math.PI / 180)
        pCtx.fillStyle = p.color
        pCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        pCtx.restore()
        return p.maxLife > 0
      })

      if (particlesRef.current.length > 0) {
        particleAnimRef.current = requestAnimationFrame(animateParticles)
      } else {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height)
      }
    }
    cancelAnimationFrame(particleAnimRef.current)
    particleAnimRef.current = requestAnimationFrame(animateParticles)
  }

  async function handleSpin() {
    if (!canSpin || spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setResult(null)
    setShowCelebration(false)

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
    const currentRot = rotRef.current
    const delta = ((naturalStop - currentRot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const targetRotation = currentRot + 7 * 2 * Math.PI + delta

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

      // Celebracao para premios raros ou qualquer premio
      setShowCelebration(true)
      spawnParticles()
      // Confetti principal — burst do centro
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#E11D48','#F59E0B','#10b981','#3b82f6','#a855f7','#fff'] })
      // Confetti lateral esquerda
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#E11D48','#F59E0B','#fff'] }), 200)
      // Confetti lateral direita
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#E11D48','#F59E0B','#fff'] }), 200)
      if (prize.reward_type === 'plan_black_1d' || prize.reward_type === 'plan_plus_1d') {
        // Jackpot: confetti extra intenso
        setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#F59E0B','#fbbf24','#fff','#E11D48'] }), 400)
      }
      setTimeout(() => setShowCelebration(false), 3000)

      if (navigator.vibrate) {
        if (prize.reward_type === 'plan_black_1d' || prize.reward_type === 'plan_plus_1d') {
          navigator.vibrate([40, 30, 40, 30, 80])
        } else {
          navigator.vibrate([20, 30, 20])
        }
      }
    })
  }

  function formatPrize(type: string, amount: number) {
    const config = PRIZE_CONFIG[type]
    if (!config) return `${amount}x ${type}`
    if (type === 'plan_plus_1d' || type === 'plan_black_1d') return config.label
    return `${amount}x ${config.label}`
  }

  const isRare = result && (result.reward_type === 'plan_plus_1d' || result.reward_type === 'plan_black_1d')

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      fontFamily: 'var(--font-jakarta)',
      paddingBottom: '96px',
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'rgba(8,9,14,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Roleta</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0' }}>Gire e ganhe premios todos os dias</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', backgroundColor: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.25)', flexShrink: 0 }}>
          <Ticket size={13} color="#eab308" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: '#eab308', fontWeight: 700 }}>{loading ? '…' : tickets}</span>
        </div>
      </header>

      {/* XP / Nivel */}
      {!loading && (() => {
        const XP_THRESHOLDS = [0, 5000, 10000, 25000, 50000, 100000]
        const levelXpStart = XP_THRESHOLDS[userLevel] ?? 0
        const levelXpEnd   = XP_THRESHOLDS[userLevel + 1] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
        const progress     = userLevel >= 5 ? 100 : Math.round(((userXp - levelXpStart) / (levelXpEnd - levelXpStart)) * 100)
        return (
          <div style={{ margin: '0 20px', padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} color="#10b981" strokeWidth={1.5} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                  Nivel {userLevel}{userLevel < 5 ? ` → ${userLevel + 1}` : ' MAX'}
                </span>
                {xpBonusActive && <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', borderRadius: 100, padding: '1px 7px' }}>XP x2</span>}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                {userXp.toLocaleString('pt-BR')} XP
              </span>
            </div>
            <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#10b981', borderRadius: 100, transition: 'width 0.6s ease' }} />
            </div>
            {userLevel < 5 && (
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: '6px 0 0', textAlign: 'right' }}>
                {(levelXpEnd - userXp).toLocaleString('pt-BR')} XP para nivel {userLevel + 1}
              </p>
            )}
          </div>
        )
      })()}

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Roleta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', width: '100%' }}>

          {/* Container da roleta com glow de fundo */}
          <div style={{
            position: 'relative',
            width: wheelSize + 40,
            height: wheelSize + 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>

            {/* Glow de fundo animado */}
            <div style={{
              position: 'absolute',
              width: wheelSize * 0.7,
              height: wheelSize * 0.7,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)',
              animation: spinning ? 'wheel-glow-pulse 0.5s ease-in-out infinite alternate' : 'none',
              pointerEvents: 'none',
            }} />

            {/* Canvas de particulas — sobreposicao */}
            <canvas
              ref={particleRef}
              width={wheelSize + 40}
              height={wheelSize + 40}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }}
            />

            {/* Ponteiro aprimorado */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Sombra/glow do ponteiro */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: `22px solid #E11D48`,
                filter: 'drop-shadow(0 0 8px rgba(225,29,72,0.9))',
              }} />
              <div style={{
                width: 6, height: 6,
                borderRadius: '50%',
                backgroundColor: '#E11D48',
                boxShadow: '0 0 10px rgba(225,29,72,0.9)',
                marginTop: -2,
              }} />
            </div>

            {/* Canvas da roleta */}
            <canvas
              ref={canvasRef}
              width={wheelSize}
              height={wheelSize}
              style={{
                borderRadius: '50%',
                display: 'block',
                cursor: canSpin ? 'pointer' : 'default',
                filter: spinning ? 'brightness(1.05)' : 'brightness(1)',
                transition: 'filter 0.3s',
              }}
              onClick={handleSpin}
            />

            {/* Anel externo decorativo */}
            <div style={{
              position: 'absolute',
              width: wheelSize + 16,
              height: wheelSize + 16,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Botao Girar */}
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            style={{
              marginTop: 16,
              width: '100%', maxWidth: '320px', padding: '16px 24px',
              borderRadius: '16px', border: canSpin ? '1px solid rgba(225,29,72,0.40)' : '1px solid rgba(225,29,72,0.15)',
              backgroundColor: canSpin ? '#E11D48' : 'rgba(225,29,72,0.20)',
              color: '#fff', fontSize: '15px', fontWeight: 700,
              cursor: canSpin ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-jakarta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s',
              boxShadow: canSpin ? '0 8px 32px rgba(225,29,72,0.35)' : 'none',
            }}
          >
            {spinning ? (
              <>
                <Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin-anim 0.8s linear infinite' }} />
                Girando...
              </>
            ) : tickets === 0 ? (
              <>
                <Ticket size={16} strokeWidth={1.5} />
                Proximo giro em {countdown}
              </>
            ) : spinsLeft === 0 ? (
              <>
                <Ticket size={16} strokeWidth={1.5} />
                Limite diario — renova em {countdown}
              </>
            ) : (
              <>
                <Zap size={16} strokeWidth={2} />
                Girar (1 ticket)
              </>
            )}
          </button>

          {/* Info de giros restantes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Plano {limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'}
            </span>
            <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: dailyTickets }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: i < (dailyTickets - spinsLeft) ? 'rgba(234,179,8,0.3)' : '#eab308',
                  boxShadow: i < (dailyTickets - spinsLeft) ? 'none' : '0 0 6px rgba(234,179,8,0.6)',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: spinsLeft > 0 ? '#eab308' : 'var(--muted)' }}>
              {spinsLeft > 0 ? `${spinsLeft} disponivel${spinsLeft > 1 ? 'is' : ''}` : 'Esgotados'}
            </span>
          </div>
        </div>

        {/* Resultado do giro */}
        {result && (() => {
          const config = PRIZE_CONFIG[result.reward_type] ?? PRIZE_CONFIG['ticket']
          return (
            <div style={{
              width: '100%',
              borderRadius: '20px', padding: '20px',
              border: `1px solid ${config.border}`,
              backgroundColor: config.bg,
              boxShadow: `0 0 32px ${config.glow}40`,
              display: 'flex', alignItems: 'center', gap: '16px',
              animation: 'result-enter 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                backgroundColor: config.bg,
                border: `2px solid ${config.border}`,
                boxShadow: `0 0 20px ${config.glow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: config.color, flexShrink: 0,
              }}>{config.icon}</div>
              <div style={{ flex: 1 }}>
                {config.rarity && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: config.color,
                    display: 'block', marginBottom: '4px',
                    textShadow: `0 0 10px ${config.glow}`,
                  }}>
                    {config.rarity}!
                  </span>
                )}
                <p style={{ color: 'var(--text)', fontFamily: 'var(--font-fraunces)', fontSize: '18px', margin: 0, lineHeight: 1.2 }}>
                  Voce ganhou {formatPrize(result.reward_type, result.reward_amount)}!
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '5px 0 0' }}>Adicionado ao seu saldo automaticamente</p>
              </div>
            </div>
          )
        })()}

        {/* Tabela de premios */}
        <div style={{ width: '100%' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Premios possiveis</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {Object.entries(PRIZE_CONFIG).map(([type, cfg]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '14px',
                border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg,
              }}>
                <div style={{ color: cfg.color, display: 'flex', flexShrink: 0 }}>{cfg.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: cfg.color, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</span>
                  {cfg.rarity && (
                    <span style={{ fontSize: '10px', color: cfg.color, opacity: 0.7 }}>{cfg.rarity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historico */}
        {history.length > 0 && (
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Ultimos giros</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h, i) => {
                const cfg = PRIZE_CONFIG[h.reward_type] ?? PRIZE_CONFIG['ticket']
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px', borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ color: cfg.color, display: 'flex', flexShrink: 0 }}>{cfg.icon}</div>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', flex: 1 }}>{formatPrize(h.reward_type, h.reward_amount)}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.20)' }}>
                      {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA para mais tickets */}
        <div style={{ width: '100%', borderRadius: '16px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px' }}>Quer mais tickets?</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/indicar"
              style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}
            >
              Indicar amigos (+3 tickets)
            </a>
            <a
              href="/streak"
              style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}
            >
              Ganhar via streak
            </a>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin-anim { to { transform: rotate(360deg); } }
        @keyframes wheel-glow-pulse {
          from { opacity: 0.6; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes result-enter {
          0%   { opacity: 0; transform: scale(0.85) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

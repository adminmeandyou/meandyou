'use client'

import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket, Loader2, Star, Zap, Search, RotateCcw, Gift, Crown, Trophy, TrendingUp, Eye, X } from 'lucide-react'
import { useAppHeader } from '@/contexts/AppHeaderContext'
import { useToast } from '@/components/Toast'

// ── Configuracao visual dos premios ─────────────────────────────────────
const PRIZE_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; glow: string
  icon: React.ReactNode; rarity?: string
}> = {
  ticket:          { label: 'Ticket',          color: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.35)',   glow: 'rgba(234,179,8,0.5)',   icon: <Ticket size={22} strokeWidth={1.5} /> },
  supercurtida:    { label: 'SuperLike',       color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.35)',  glow: 'rgba(236,72,153,0.5)',  icon: <Star size={22} strokeWidth={1.5} /> },
  boost:           { label: 'Boost',           color: '#E11D48', bg: 'rgba(225,29,72,0.12)',   border: 'rgba(225,29,72,0.35)',   glow: 'rgba(225,29,72,0.5)',   icon: <Zap size={22} strokeWidth={1.5} /> },
  lupa:            { label: 'Lupa',            color: '#ea580c', bg: 'rgba(234,88,12,0.12)',   border: 'rgba(234,88,12,0.35)',   glow: 'rgba(234,88,12,0.5)',   icon: <Search size={22} strokeWidth={1.5} /> },
  rewind:          { label: 'Desfazer',        color: '#be185d', bg: 'rgba(190,24,93,0.12)',   border: 'rgba(190,24,93,0.35)',   glow: 'rgba(190,24,93,0.5)',   icon: <RotateCcw size={22} strokeWidth={1.5} /> },
  ver_quem_curtiu: { label: 'Ver quem curtiu', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.35)',   glow: 'rgba(244,63,94,0.5)',   icon: <Eye size={22} strokeWidth={1.5} /> },
  invisivel_1d:    { label: 'Invisivel 1 dia', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.35)', glow: 'rgba(156,163,175,0.5)', icon: <Gift size={22} strokeWidth={1.5} /> },
  plan_plus_1d:    { label: '1 dia Plus',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.45)',  glow: 'rgba(139,92,246,0.7)',  icon: <Crown size={22} strokeWidth={1.5} />, rarity: 'Raro' },
  plan_black_1d:   { label: '1 dia Black',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.45)',  glow: 'rgba(245,158,11,0.7)',  icon: <Trophy size={22} strokeWidth={1.5} />, rarity: 'Lendario' },
}

// ── Segmentos da roleta — inclui TODOS os prêmios possíveis ─────────────
// Índices precisam bater exatamente com getSegIdx() abaixo
const WHEEL_SEGMENTS = [
  { type: 'ticket',          label: '1 Ticket',     colorA: '#78350f', colorB: '#d97706' }, // 0
  { type: 'supercurtida',    label: 'SuperLike',    colorA: '#831843', colorB: '#ec4899' }, // 1
  { type: 'ticket',          label: '2 Tickets',    colorA: '#78350f', colorB: '#f59e0b' }, // 2
  { type: 'lupa',            label: 'Lupa',         colorA: '#7c2d12', colorB: '#ea580c' }, // 3
  { type: 'ver_quem_curtiu', label: 'Ver Curtidas', colorA: '#4c0519', colorB: '#F43F5E' }, // 4
  { type: 'boost',           label: 'Boost',        colorA: '#7f1d1d', colorB: '#E11D48' }, // 5
  { type: 'ticket',          label: '3 Tickets',    colorA: '#78350f', colorB: '#f59e0b' }, // 6
  { type: 'rewind',          label: 'Desfazer',     colorA: '#500724', colorB: '#be185d' }, // 7
  { type: 'invisivel_1d',    label: 'Invisivel',    colorA: '#1f2937', colorB: '#6b7280' }, // 8
  { type: 'plan_plus_1d',    label: '1 dia Plus',   colorA: '#2e1065', colorB: '#8b5cf6' }, // 9
  { type: 'plan_black_1d',   label: '1 dia Black',  colorA: '#451a03', colorB: '#F59E0B' }, // 10
]

// Mapeia o resultado da API para o índice correto no WHEEL_SEGMENTS
function getSegIdx(rewardType: string, rewardAmount: number): number {
  if (rewardType === 'ticket') {
    if (rewardAmount >= 3) return 6
    if (rewardAmount === 2) return 2
    return 0
  }
  const map: Record<string, number> = {
    supercurtida:    1,
    lupa:            3,
    ver_quem_curtiu: 4,
    boost:           5,
    rewind:          7,
    invisivel_1d:    8,
    plan_plus_1d:    9,
    plan_black_1d:   10,
  }
  return map[rewardType] ?? 0
}

type SpinResult = { reward_type: string; reward_amount: number; was_jackpot?: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; maxLife: number; rotation: number; rotSpeed: number }

export default function RoletaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const { setBackHref } = useAppHeader()
  const toast = useToast()

  useEffect(() => {
    setBackHref('/dashboard')
    return () => setBackHref(null)
  }, [setBackHref])

  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const particleRef     = useRef<HTMLCanvasElement>(null)
  const spinningRef     = useRef(false)
  const rotRef          = useRef(0)
  const fastSpinIdRef   = useRef(0)
  const particlesRef    = useRef<Particle[]>([])
  const particleAnimRef = useRef<number>(0)

  const [tickets, setTickets]             = useState(0)
  const [spinsToday, setSpinsToday]       = useState(0)
  const [loading, setLoading]             = useState(true)
  const [showPrizes, setShowPrizes]       = useState(false)
  const [userXp, setUserXp]               = useState(0)
  const [userLevel, setUserLevel]         = useState(0)
  const [xpBonusActive, setXpBonusActive] = useState(false)
  const [spinning, setSpinning]           = useState(false)
  const [result, setResult]               = useState<SpinResult | null>(null)
  const [history, setHistory]             = useState<any[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [wheelSize, setWheelSize]         = useState(300)
  const [countdown, setCountdown]         = useState('')

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
  const spinsLeft    = Math.max(0, dailyTickets - spinsToday)
  const canSpin      = tickets > 0 && spinsLeft > 0 && !spinning

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

  useEffect(() => { if (!user) return; loadData() }, [user])

  // Desenha somente quando wheelSize muda — não em todo render
  useEffect(() => { if (wheelSize > 0) drawWheel(rotRef.current) }, [wheelSize])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: tk }, { data: hist }, { data: profile }] = await Promise.all([
      supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
      supabase.from('roleta_history').select('reward_type, reward_amount, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('xp, xp_level, xp_bonus_until').eq('id', user!.id).single(),
    ])
    const { count } = await supabase.from('roleta_history').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', `${today}T00:00:00`)
    setTickets(tk?.amount ?? 0)
    setSpinsToday(count ?? 0)
    setHistory(hist ?? [])
    setUserXp(profile?.xp ?? 0)
    setUserLevel(profile?.xp_level ?? 0)
    setXpBonusActive(profile?.xp_bonus_until ? new Date(profile.xp_bonus_until) > new Date() : false)
    setLoading(false)
  }

  // ── Desenho da roda ────────────────────────────────────────────────────
  function drawWheel(currentRotation: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = wheelSize
    canvas.width  = size
    canvas.height = size
    const cx      = size / 2
    const cy      = size / 2
    const outerR  = cx - 4
    const innerR  = outerR - 4
    const segCount = WHEEL_SEGMENTS.length
    const segAngle = (2 * Math.PI) / segCount

    ctx.clearRect(0, 0, size, size)

    // Anel externo com glow
    ctx.save()
    ctx.shadowColor = 'rgba(225,29,72,0.6)'
    ctx.shadowBlur  = 20
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(225,29,72,0.7)'
    ctx.lineWidth   = 3
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(cx, cy, outerR - 8, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth   = 1
    ctx.stroke()

    // Segmentos
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const startAngle = currentRotation + i * segAngle
      const endAngle   = startAngle + segAngle
      const midAngle   = startAngle + segAngle / 2

      const gxA  = cx + (innerR * 0.2) * Math.cos(midAngle)
      const gyA  = cy + (innerR * 0.2) * Math.sin(midAngle)
      const gxB  = cx + (innerR * 0.92) * Math.cos(midAngle)
      const gyB  = cy + (innerR * 0.92) * Math.sin(midAngle)
      const grad = ctx.createLinearGradient(gxA, gyA, gxB, gyB)
      grad.addColorStop(0, seg.colorA + 'cc')
      grad.addColorStop(1, seg.colorB + 'ff')

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, innerR, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.save()
      ctx.globalAlpha  = 0.6
      ctx.strokeStyle  = seg.colorB
      ctx.lineWidth    = 1.5
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle))
      ctx.stroke()
      ctx.restore()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)
      ctx.textAlign   = 'right'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur  = 6
      ctx.fillStyle   = '#ffffff'
      ctx.font        = `bold ${Math.max(8, wheelSize * 0.030)}px Inter, sans-serif`
      ctx.fillText(seg.label, innerR - 12, 4)
      ctx.restore()

      // Ponto colorido
      const iconDist = innerR * 0.32
      const ix = cx + iconDist * Math.cos(midAngle)
      const iy = cy + iconDist * Math.sin(midAngle)
      ctx.beginPath()
      ctx.arc(ix, iy, 3.5, 0, 2 * Math.PI)
      ctx.fillStyle   = seg.colorB
      ctx.shadowColor = seg.colorB
      ctx.shadowBlur  = 8
      ctx.fill()
      ctx.shadowBlur  = 0
    })

    // Hub central
    const hubR    = Math.max(22, wheelSize * 0.10)
    const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 2, cx, cy, hubR)
    hubGrad.addColorStop(0, '#2a0d1c')
    hubGrad.addColorStop(0.5, '#16050f')
    hubGrad.addColorStop(1, '#0F1117')
    ctx.save()
    ctx.shadowColor = 'rgba(225,29,72,0.4)'
    ctx.shadowBlur  = 12
    ctx.beginPath()
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI)
    ctx.fillStyle   = hubGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(225,29,72,0.60)'
    ctx.lineWidth   = 2.5
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(cx, cy, hubR - 6, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth   = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
    ctx.fillStyle   = '#E11D48'
    ctx.shadowColor = '#E11D48'
    ctx.shadowBlur  = 12
    ctx.fill()
    ctx.shadowBlur  = 0
  }

  // ── Animação de desaceleração (fase 2 — para no prêmio exato) ─────────
  // Usa easeOutQuart: começa rápido, desacelera suave, para limpo
  function animateDecelerate(targetRotation: number, duration: number, onDone: () => void) {
    const start    = performance.now()
    const from     = rotRef.current
    const distance = targetRotation - from

    function step(now: number) {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuart — deceleração suave sem bounce
      const ease    = 1 - Math.pow(1 - progress, 4)
      const current = from + distance * ease
      rotRef.current = current
      drawWheel(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        // Normaliza para [0, 2π] para evitar números gigantes acumulando
        const final = ((targetRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        rotRef.current = final
        drawWheel(final)
        onDone()
      }
    }
    requestAnimationFrame(step)
  }

  // ── Spin principal ─────────────────────────────────────────────────────
  async function handleSpin() {
    if (!canSpin || spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setResult(null)
    setShowCelebration(false)

    // ── FASE 1: Gira imediatamente (antes da API responder) ───────────
    const spinStart   = performance.now()
    const MIN_SPIN_MS = 2400          // tempo mínimo de giro visual
    const MAX_SPEED   = Math.PI * 5   // ~2.5 rotações/seg no pico
    const RAMP_MS     = 700           // ms até atingir velocidade máxima

    let lastFrameTime = spinStart
    let fastRunning   = true

    function doFastSpin(now: number) {
      if (!fastRunning) return
      const dt      = (now - lastFrameTime) / 1000
      lastFrameTime = now
      const elapsed  = now - spinStart
      // Acelera com easeOutCubic até MAX_SPEED
      const rampT    = Math.min(elapsed / RAMP_MS, 1)
      const speed    = MAX_SPEED * (1 - Math.pow(1 - rampT, 3))
      rotRef.current += speed * dt
      drawWheel(rotRef.current)
      fastSpinIdRef.current = requestAnimationFrame(doFastSpin)
    }
    fastSpinIdRef.current = requestAnimationFrame(doFastSpin)

    // ── Chama a API em paralelo com a animação ───────────────────────
    const { data, error } = await supabase.rpc('spin_roleta', { p_user_id: user!.id })

    // Garante tempo mínimo de giro visual para não parecer instantâneo
    const elapsed = performance.now() - spinStart
    if (elapsed < MIN_SPIN_MS) {
      await new Promise<void>(r => setTimeout(r, MIN_SPIN_MS - elapsed))
    }

    // Para o giro rápido
    fastRunning = false
    cancelAnimationFrame(fastSpinIdRef.current)

    if (error || !data) {
      // Desacelera suavemente antes de mostrar o erro (sem parar bruscamente)
      const randomTarget = rotRef.current + Math.PI * 2 + Math.random() * Math.PI * 2
      animateDecelerate(randomTarget, 2000, () => {
        setSpinning(false)
        spinningRef.current = false
        toast.error('Erro ao girar. Tente novamente.')
      })
      return
    }

    // Supabase pode retornar array ou objeto dependendo da função RPC
    const prize = (Array.isArray(data) ? data[0] : data) as SpinResult

    if (!prize?.reward_type) {
      const randomTarget = rotRef.current + Math.PI * 2 + Math.random() * Math.PI * 2
      animateDecelerate(randomTarget, 2000, () => {
        setSpinning(false)
        spinningRef.current = false
        toast.error('Erro ao girar. Tente novamente.')
      })
      return
    }

    // ── FASE 2: Desacelera e para exatamente no prêmio sorteado ──────
    const segCount  = WHEEL_SEGMENTS.length
    const segAngle  = (2 * Math.PI) / segCount
    const segIdx    = getSegIdx(prize.reward_type, prize.reward_amount)

    // Ponteiro está no topo = -π/2. Calculamos o ângulo que faz o meio
    // do segmento sortido ficar exatamente sob o ponteiro.
    const segMid0       = segIdx * segAngle + segAngle / 2
    const naturalStop   = -Math.PI / 2 - segMid0

    // Delta positivo mínimo do ângulo atual até o ponto de parada
    const normalizedCur = ((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    let delta = ((naturalStop - normalizedCur) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    // Evita parar cedo demais — exige ao menos meia volta extra
    if (delta < Math.PI / 6) delta += 2 * Math.PI

    // Giros extras aleatórios: entre 2 e 5 voltas completas
    const extraTurns    = 2 + Math.floor(Math.random() * 4)
    const targetRotation = rotRef.current + extraTurns * 2 * Math.PI + delta

    // Duração da desaceleração: aleatória entre 3s e 4.5s (mais drama)
    const decelDuration = 3000 + Math.random() * 1500

    animateDecelerate(targetRotation, decelDuration, () => {
      setResult(prize)
      setTickets(t => t - 1)
      setSpinsToday(s => s + 1)
      setHistory(prev => [
        { reward_type: prize.reward_type, reward_amount: prize.reward_amount, created_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ])
      setSpinning(false)
      spinningRef.current = false

      // Toast com o prêmio
      const cfg = PRIZE_CONFIG[prize.reward_type]
      const prizeLabel = cfg
        ? (prize.reward_type === 'plan_plus_1d' || prize.reward_type === 'plan_black_1d'
          ? cfg.label
          : `${prize.reward_amount}x ${cfg.label}`)
        : `${prize.reward_amount}x ${prize.reward_type}`
      toast.success(`Voce ganhou ${prizeLabel}!`)

      setShowCelebration(true)
      spawnParticles()
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#E11D48', '#F59E0B', '#ec4899', '#ea580c', '#fff'] })
      setTimeout(() => confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#E11D48', '#F59E0B', '#fff'] }), 200)
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#E11D48', '#F59E0B', '#fff'] }), 200)
      if (prize.reward_type === 'plan_black_1d' || prize.reward_type === 'plan_plus_1d') {
        setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#F59E0B', '#fbbf24', '#fff', '#E11D48'] }), 400)
      }
      setTimeout(() => setShowCelebration(false), 3000)
      setTimeout(() => loadData(), 1500)
      setTimeout(() => loadData(), 3500)

      if (navigator.vibrate) {
        navigator.vibrate(
          prize.reward_type === 'plan_black_1d' || prize.reward_type === 'plan_plus_1d'
            ? [40, 30, 40, 30, 80]
            : [20, 30, 20]
        )
      }
    })
  }

  // ── Partículas de celebração ───────────────────────────────────────────
  function spawnParticles() {
    const canvas = particleRef.current
    if (!canvas) return
    const colors = ['#E11D48', '#F59E0B', '#ec4899', '#ea580c', '#eab308']
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
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.25
        p.rotation += p.rotSpeed
        p.maxLife--
        pCtx.save()
        pCtx.globalAlpha = Math.max(0, p.maxLife / 60)
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

  function formatPrize(type: string, amount: number) {
    const config = PRIZE_CONFIG[type]
    if (!config) return `${amount}x ${type}`
    if (type === 'plan_plus_1d' || type === 'plan_black_1d') return config.label
    return `${amount}x ${config.label}`
  }

  const commonPrizes = Object.entries(PRIZE_CONFIG).filter(([, cfg]) => !cfg.rarity)
  const rarePrizes   = Object.entries(PRIZE_CONFIG).filter(([, cfg]) =>  cfg.rarity)

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        const levelXpStart  = XP_THRESHOLDS[userLevel] ?? 0
        const levelXpEnd    = XP_THRESHOLDS[userLevel + 1] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
        const progress      = userLevel >= 5 ? 100 : Math.round(((userXp - levelXpStart) / (levelXpEnd - levelXpStart)) * 100)
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
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{userXp.toLocaleString('pt-BR')} XP</span>
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

        {/* ── Roleta ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          <button
            onClick={() => setShowPrizes(true)}
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(248,249,250,0.55)', fontFamily: 'var(--font-jakarta)', fontSize: 11, fontWeight: 600, marginBottom: 10 }}
          >
            <Gift size={12} strokeWidth={1.5} />
            O que posso ganhar?
          </button>

          {/* Container da roleta */}
          <div style={{ position: 'relative', width: wheelSize + 40, height: wheelSize + 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Glow pulsante durante o giro */}
            <div style={{ position: 'absolute', width: wheelSize * 0.7, height: wheelSize * 0.7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)', animation: spinning ? 'wheel-glow-pulse 0.5s ease-in-out infinite alternate' : 'none', pointerEvents: 'none' }} />

            {/* Canvas de partículas */}
            <canvas ref={particleRef} width={wheelSize + 40} height={wheelSize + 40} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />

            {/* Ponteiro */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #E11D48', filter: 'drop-shadow(0 0 8px rgba(225,29,72,0.9))' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E11D48', boxShadow: '0 0 10px rgba(225,29,72,0.9)', marginTop: -2 }} />
            </div>

            {/* Canvas da roda */}
            <canvas
              ref={canvasRef}
              width={wheelSize}
              height={wheelSize}
              style={{ borderRadius: '50%', display: 'block', cursor: canSpin ? 'pointer' : 'default', filter: spinning ? 'brightness(1.05)' : 'brightness(1)', transition: 'filter 0.3s' }}
              onClick={handleSpin}
            />

            <div style={{ position: 'absolute', width: wheelSize + 16, height: wheelSize + 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          </div>

          {/* Botão Girar */}
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            style={{ marginTop: 16, width: '100%', maxWidth: '320px', padding: '16px 24px', borderRadius: '16px', border: canSpin ? '1px solid rgba(225,29,72,0.40)' : '1px solid rgba(225,29,72,0.15)', backgroundColor: canSpin ? '#E11D48' : 'rgba(225,29,72,0.20)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: canSpin ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: canSpin ? '0 8px 32px rgba(225,29,72,0.35)' : 'none' }}
          >
            {spinning ? (
              <><Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin-anim 0.8s linear infinite' }} />Girando...</>
            ) : tickets === 0 ? (
              <><Ticket size={16} strokeWidth={1.5} />Proximo giro em {countdown}</>
            ) : spinsLeft === 0 ? (
              <><Ticket size={16} strokeWidth={1.5} />Limite diario — renova em {countdown}</>
            ) : (
              <><Zap size={16} strokeWidth={2} />Girar (1 ticket)</>
            )}
          </button>

          {/* Giros restantes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Plano {limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'}</span>
            <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: dailyTickets }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i < (dailyTickets - spinsLeft) ? 'rgba(234,179,8,0.3)' : '#eab308', boxShadow: i < (dailyTickets - spinsLeft) ? 'none' : '0 0 6px rgba(234,179,8,0.6)' }} />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: spinsLeft > 0 ? '#eab308' : 'var(--muted)' }}>
              {spinsLeft > 0 ? `${spinsLeft} disponivel${spinsLeft > 1 ? 'is' : ''}` : 'Esgotados'}
            </span>
          </div>
        </div>

        {/* ── Card de resultado ───────────────────────────────────────── */}
        {result && (() => {
          const config = PRIZE_CONFIG[result.reward_type] ?? PRIZE_CONFIG['ticket']
          return (
            <div style={{ width: '100%', borderRadius: '20px', padding: '20px', border: `1px solid ${config.border}`, backgroundColor: config.bg, boxShadow: `0 0 32px ${config.glow}40`, display: 'flex', alignItems: 'center', gap: '16px', animation: 'result-enter 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: config.bg, border: `2px solid ${config.border}`, boxShadow: `0 0 20px ${config.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color, flexShrink: 0 }}>
                {config.icon}
              </div>
              <div style={{ flex: 1 }}>
                {config.rarity && (
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: config.color, display: 'block', marginBottom: '4px', textShadow: `0 0 10px ${config.glow}` }}>
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

        {/* ── Histórico ───────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Ultimos giros</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h, i) => {
                const cfg = PRIZE_CONFIG[h.reward_type] ?? PRIZE_CONFIG['ticket']
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
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

        {/* ── CTA mais tickets ────────────────────────────────────────── */}
        <div style={{ width: '100%', borderRadius: '16px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px' }}>Quer mais tickets?</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/indicar" style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
              Indicar amigos (+5 tickets)
            </a>
            <a href="/streak" style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
              Prêmios diários
            </a>
          </div>
        </div>

      </div>

      {/* ── Modal "O que posso ganhar?" ─────────────────────────────────── */}
      {showPrizes && (
        <div onClick={() => setShowPrizes(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', backgroundColor: '#0F1117', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '20px 20px 48px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: 0 }}>Premios possiveis</h3>
              <button onClick={() => setShowPrizes(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <div style={{ backgroundColor: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <TrendingUp size={15} color="#E11D48" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.65)', margin: 0, lineHeight: 1.6 }}>
                Quanto mais dias seguidos voce entrar no app, maior a chance de sortear premios raros e lendarios. Mantenha seu streak ativo!
              </p>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(248,249,250,0.35)', margin: '0 0 10px' }}>Comuns</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
              {commonPrizes.map(([type, cfg]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
                  <div style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>1 a 5 unidades</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(248,249,250,0.35)', margin: '0 0 10px' }}>Raros e Lendarios</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
              {rarePrizes.map(([type, cfg]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
                  <div style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{cfg.label}</span>
                    <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.rarity}!</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: 'rgba(248,249,250,0.28)', margin: 0, lineHeight: 1.5 }}>
                A Caixa Super Lendaria e exclusiva da Loja e nao e sorteada na roleta.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-anim { to { transform: rotate(360deg); } }
        @keyframes wheel-glow-pulse {
          from { opacity: 0.6; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes result-enter {
          0%   { opacity: 0; transform: scale(0.85) translateY(10px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  )
}

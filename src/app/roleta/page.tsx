'use client'

import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useAppHeader } from '@/contexts/AppHeaderContext'
import { useToast } from '@/components/Toast'
import { useSounds } from '@/hooks/useSounds'

import { PRIZE_CONFIG, WHEEL_SEGMENTS, getSegIdx, playSpinSound, playWinSound } from './_components/helpers'
import RoletaHeader from './_components/RoletaHeader'
import XpBar from './_components/XpBar'
import StreakBanner from './_components/StreakBanner'
import WheelCanvas, { drawWheelOnCanvas } from './_components/WheelCanvas'
import ResultCard from './_components/ResultCard'
import HistoryList from './_components/HistoryList'
import MoreTicketsCTA from './_components/MoreTicketsCTA'
import PrizesModal from './_components/PrizesModal'

type SpinResult = { reward_type: string; reward_amount: number; was_jackpot?: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; maxLife: number; rotation: number; rotSpeed: number }

export default function RoletaPage() {
  const { user } = useAuth()
  const { limits, loading: planLoading } = usePlan()
  const { setBackHref } = useAppHeader()
  const toast = useToast()
  const { play } = useSounds()

  useEffect(() => {
    setBackHref('/modos')
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
  const [currentStreak, setCurrentStreak] = useState(0)
  const [spinning, setSpinning]           = useState(false)
  const [result, setResult]               = useState<SpinResult | null>(null)
  const [history, setHistory]             = useState<{ reward_type: string; reward_amount: number; created_at: string }[]>([])
  const [wheelSize, setWheelSize]         = useState(() => {
    if (typeof window === 'undefined') return 280
    const w = window.innerWidth
    if (w >= 1024) return 400
    if (w >= 768) return 360
    return Math.min(280, w - 60)
  })
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

  const dailyTickets = limits.ticketsPerDay
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

  useEffect(() => {
    if (wheelSize > 0 && canvasRef.current) drawWheelOnCanvas(canvasRef.current, rotRef.current, wheelSize)
  }, [wheelSize])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: tk }, { data: hist }, { data: profile }, { data: streakData }] = await Promise.all([
      supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
      supabase.from('roleta_history').select('reward_type, reward_amount, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('xp, xp_level, xp_bonus_until').eq('id', user!.id).single(),
      supabase.from('daily_streaks').select('current_streak').eq('user_id', user!.id).single(),
    ])
    const { count } = await supabase.from('roleta_history').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', `${today}T00:00:00`)
    setTickets(tk?.amount ?? 0)
    setSpinsToday(count ?? 0)
    setHistory(hist ?? [])
    setUserXp(profile?.xp ?? 0)
    setUserLevel(profile?.xp_level ?? 0)
    setXpBonusActive(profile?.xp_bonus_until ? new Date(profile.xp_bonus_until) > new Date() : false)
    setCurrentStreak(streakData?.current_streak ?? 0)
    setLoading(false)
  }

  function animateDecelerate(targetRotation: number, duration: number, onDone: () => void) {
    const start    = performance.now()
    const from     = rotRef.current
    const distance = targetRotation - from

    function step(now: number) {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      const ease    = 1 - Math.pow(1 - progress, 4)
      const current = from + distance * ease
      rotRef.current = current
      if (canvasRef.current) drawWheelOnCanvas(canvasRef.current, current, wheelSize)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        const final = ((targetRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        rotRef.current = final
        if (canvasRef.current) drawWheelOnCanvas(canvasRef.current, final, wheelSize)
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
    playSpinSound()

    const spinStart   = performance.now()
    const MIN_SPIN_MS = 2400
    const MAX_SPEED   = Math.PI * 5
    const RAMP_MS     = 700

    let lastFrameTime = spinStart
    let fastRunning   = true

    function doFastSpin(now: number) {
      if (!fastRunning) return
      const dt      = (now - lastFrameTime) / 1000
      lastFrameTime = now
      const elapsed  = now - spinStart
      const rampT    = Math.min(elapsed / RAMP_MS, 1)
      const speed    = MAX_SPEED * (1 - Math.pow(1 - rampT, 3))
      rotRef.current += speed * dt
      if (canvasRef.current) drawWheelOnCanvas(canvasRef.current, rotRef.current, wheelSize)
      fastSpinIdRef.current = requestAnimationFrame(doFastSpin)
    }
    fastSpinIdRef.current = requestAnimationFrame(doFastSpin)

    const apiResponse = await fetch('/api/roleta/girar', { method: 'POST' })

    const elapsed = performance.now() - spinStart
    if (elapsed < MIN_SPIN_MS) {
      await new Promise<void>(r => setTimeout(r, MIN_SPIN_MS - elapsed))
    }

    fastRunning = false
    cancelAnimationFrame(fastSpinIdRef.current)

    const responseData = apiResponse.ok ? await apiResponse.json().catch(() => null) : null

    if (!apiResponse.ok || !responseData?.reward_type) {
      const errMsg = responseData?.error || 'Erro ao girar. Tente novamente.'
      const randomTarget = rotRef.current + Math.PI * 2 + Math.random() * Math.PI * 2
      animateDecelerate(randomTarget, 2000, () => {
        setSpinning(false)
        spinningRef.current = false
        toast.error(errMsg)
      })
      return
    }

    const prize = responseData as SpinResult

    const segCount  = WHEEL_SEGMENTS.length
    const segAngle  = (2 * Math.PI) / segCount
    const segIdx    = getSegIdx(prize.reward_type, prize.reward_amount)

    const segMid0       = segIdx * segAngle + segAngle / 2
    const naturalStop   = -Math.PI / 2 - segMid0

    const normalizedCur = ((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    let delta = ((naturalStop - normalizedCur) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    if (delta < Math.PI / 6) delta += 2 * Math.PI

    const extraTurns    = 2 + Math.floor(Math.random() * 4)
    const targetRotation = rotRef.current + extraTurns * 2 * Math.PI + delta

    const decelDuration = 3000 + Math.random() * 1500

    animateDecelerate(targetRotation, decelDuration, () => {
      playWinSound(prize.was_jackpot)
      play(prize.reward_type === 'fichas' ? 'coin' : 'success')
      setResult(prize)
      setTickets(t => t - 1)
      setSpinsToday(s => s + 1)
      setHistory(prev => [
        { reward_type: prize.reward_type, reward_amount: prize.reward_amount, created_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ])
      setSpinning(false)
      spinningRef.current = false

      const cfg = PRIZE_CONFIG[prize.reward_type]
      const prizeLabel = cfg
        ? (prize.reward_type === 'plan_plus_1d' || prize.reward_type === 'plan_black_1d'
          ? cfg.label
          : `${prize.reward_amount}x ${cfg.label}`)
        : `${prize.reward_amount}x ${prize.reward_type}`
      toast.success(`Você ganhou ${prizeLabel}!`)

      spawnParticles()
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#E11D48', '#F59E0B', '#ec4899', '#ea580c', '#fff'] })
      setTimeout(() => confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#E11D48', '#F59E0B', '#fff'] }), 200)
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#E11D48', '#F59E0B', '#fff'] }), 200)
      if (prize.reward_type === 'plan_black_1d' || prize.reward_type === 'plan_plus_1d') {
        setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#F59E0B', '#fbbf24', '#fff', '#E11D48'] }), 400)
      }
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
    const normalizedType = type === 'ticket' ? 'fichas' : type
    const config = PRIZE_CONFIG[normalizedType]
    if (!config) return `${amount}x ${normalizedType}`
    if (normalizedType === 'plan_plus_1d' || normalizedType === 'plan_black_1d') return config.label
    return `${amount}x ${config.label}`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      <RoletaHeader tickets={tickets} loading={loading} />

      {!loading && (
        <XpBar userXp={userXp} userLevel={userLevel} xpBonusActive={xpBonusActive} />
      )}

      {!loading && (
        <StreakBanner currentStreak={currentStreak} />
      )}

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', maxWidth: '600px', margin: '0 auto' }}>

        <WheelCanvas
          wheelSize={wheelSize}
          spinning={spinning}
          canSpin={canSpin}
          tickets={tickets}
          spinsLeft={spinsLeft}
          dailyTickets={dailyTickets}
          countdown={countdown}
          limits={limits}
          onSpin={handleSpin}
          onShowPrizes={() => setShowPrizes(true)}
          canvasRef={canvasRef}
          particleRef={particleRef}
        />

        {result && (
          <ResultCard result={result} formatPrize={formatPrize} />
        )}

        <HistoryList history={history} formatPrize={formatPrize} />

        <MoreTicketsCTA />

      </div>

      {showPrizes && (
        <PrizesModal onClose={() => setShowPrizes(false)} />
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

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Flame, Ticket, Star, Zap, Search, RotateCcw, Ghost,
  Lock, CheckCircle, Loader2, Crown, AlertTriangle, TrendingUp, Sprout, Dumbbell,
} from 'lucide-react'

const REWARD_CONFIG: Record<string, {
  color: string; bg: string; border: string; label: string; icon: React.ReactNode
}> = {
  ticket:        { color: '#eab308', bg: 'rgba(234,179,8,0.10)',   border: 'rgba(234,179,8,0.30)',   label: 'Ticket',          icon: <Ticket size={18} strokeWidth={1.5} /> },
  supercurtida:  { color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  border: 'rgba(236,72,153,0.30)',  label: 'SuperLike',       icon: <Star size={18} strokeWidth={1.5} /> },
  boost:         { color: '#b8f542', bg: 'rgba(184,245,66,0.10)',  border: 'rgba(184,245,66,0.30)',  label: 'Boost',           icon: <Zap size={18} strokeWidth={1.5} /> },
  lupa:          { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.30)',  label: 'Lupa',            icon: <Search size={18} strokeWidth={1.5} /> },
  rewind:        { color: '#a855f7', bg: 'rgba(168,85,247,0.10)',  border: 'rgba(168,85,247,0.30)',  label: 'Desfazer',        icon: <RotateCcw size={18} strokeWidth={1.5} /> },
  invisivel_1d:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.30)', label: 'Invisível 1 dia', icon: <Ghost size={18} strokeWidth={1.5} /> },
  plan_plus_1d:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.40)',  label: '1 dia Plus',      icon: <Crown size={18} strokeWidth={1.5} /> },
  plan_black_1d: { color: '#F8F9FA', bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.30)', label: '1 dia Black',     icon: <Crown size={18} strokeWidth={1.5} /> },
}

type CalendarEntry = { day_number: number; reward_type: string; reward_amount: number; claimed: boolean }
type StreakData = { current_streak: number; longest_streak: number; last_login_date: string | null }

function getPhaseInfo(day: number): { label: string; color: string; icon: React.ReactNode } {
  if (day >= 30) return { label: 'Lendário',  color: '#f97316', icon: <Flame size={13} strokeWidth={1.5} /> }
  if (day >= 21) return { label: 'Dedicado',  color: '#8b5cf6', icon: <Dumbbell size={13} strokeWidth={1.5} /> }
  if (day >= 14) return { label: 'Em forma',  color: '#b8f542', icon: <Zap size={13} strokeWidth={1.5} /> }
  if (day >= 7)  return { label: 'Crescendo', color: '#3b82f6', icon: <TrendingUp size={13} strokeWidth={1.5} /> }
  return { label: 'Iniciante', color: 'rgba(248,249,250,0.40)', icon: <Sprout size={13} strokeWidth={1.5} /> }
}

export default function StreakPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [streak, setStreak] = useState<StreakData | null>(null)
  const [calendar, setCalendar] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [claimMsg, setClaimMsg] = useState<{ day: number; text: string } | null>(null)

  useEffect(() => { if (!user) return; loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: st }, { data: cal }] = await Promise.all([
      supabase.from('daily_streaks').select('current_streak, longest_streak, last_login_date').eq('user_id', user!.id).single(),
      supabase.from('streak_calendar').select('day_number, reward_type, reward_amount, claimed').eq('user_id', user!.id).order('day_number', { ascending: true }),
    ])
    const streakData = st ?? { current_streak: 0, longest_streak: 0, last_login_date: null }
    setStreak(streakData)

    const currentStreak = streakData.current_streak ?? 0
    const maxDay = cal && cal.length > 0 ? Math.max(...cal.map(e => e.day_number)) : 0

    // Gera calendário se vazio, ou estende quando streak está chegando ao fim do ciclo
    if (!cal || cal.length === 0) {
      await supabase.rpc('generate_streak_calendar', { p_user_id: user!.id })
    } else if (currentStreak + 5 >= maxDay) {
      await supabase.rpc('extend_streak_calendar', { p_user_id: user!.id })
    }

    // Recarrega calendário atualizado
    const { data: calFinal } = await supabase
      .from('streak_calendar')
      .select('day_number, reward_type, reward_amount, claimed')
      .eq('user_id', user!.id)
      .order('day_number', { ascending: true })
    setCalendar(calFinal ?? [])
    setLoading(false)
  }

  async function handleClaim(dayNumber: number) {
    setClaiming(dayNumber)
    const { data, error } = await supabase.rpc('claim_streak_reward', { p_user_id: user!.id, p_day_number: dayNumber })
    // claim_streak_reward retorna TABLE (array) — acessar o primeiro elemento
    const result = Array.isArray(data) ? data[0] : data
    if (error || !result?.success) {
      const msgs: Record<string, string> = { already_claimed: 'Já resgatado hoje.', not_reached: 'Dia ainda não alcançado.', streak_reset: 'Seu streak foi resetado.' }
      setClaimMsg({ day: dayNumber, text: msgs[result?.reason ?? ''] ?? 'Não foi possível resgatar.' })
    } else {
      setCalendar((prev) => prev.map((e) => (e.day_number === dayNumber ? { ...e, claimed: true } : e)))
      const entry = calendar.find((e) => e.day_number === dayNumber)
      if (entry) {
        const cfg = REWARD_CONFIG[entry.reward_type]
        setClaimMsg({ day: dayNumber, text: `+${entry.reward_amount} ${cfg?.label ?? entry.reward_type} adicionado!` })
      }
      // Recarrega dados para refletir desconto do streak e credito do premio
      await loadData()
    }
    setClaiming(null)
    setTimeout(() => setClaimMsg(null), 3000)
  }

  const currentDay = streak?.current_streak ?? 0

  // Ciclo atual: bloco de 30 dias baseado no streak
  const cycleNumber   = Math.floor(currentDay / 30) + 1
  const cycleStart    = (cycleNumber - 1) * 30 + 1
  const cycleEnd      = cycleStart + 29
  const cycleCalendar = calendar.filter(e => e.day_number >= cycleStart && e.day_number <= cycleEnd)

  function canClaim(entry: CalendarEntry) { return entry.day_number <= currentDay && !entry.claimed }
  const phase = getPhaseInfo(currentDay)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Prêmios diários</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Entre todo dia e ganhe prêmios</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.25)', flexShrink: 0 }}>
          <Flame size={13} color="#f97316" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: '#f97316', fontWeight: 700 }}>{loading ? '…' : currentDay} dias</span>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
          <Loader2 size={28} color="rgba(255,255,255,0.20)" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Card de streak */}
          <div style={{ borderRadius: '16px', padding: '20px', backgroundColor: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.20)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame size={32} color="#f97316" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <span style={{ color: phase.color }}>{phase.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: phase.color }}>{phase.label}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                  {currentDay} <span style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontWeight: 400 }}>dias seguidos</span>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>Recorde pessoal: {streak?.longest_streak ?? 0} dias</p>
              </div>
            </div>
            {currentDay > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(249,115,22,0.10)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <AlertTriangle size={12} color="rgba(248,249,250,0.30)" strokeWidth={1.5} />
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>Fique 30 dias sem entrar e o streak reseta para 0</p>
              </div>
            )}
          </div>

          {/* Mensagem de feedback */}
          {claimMsg && (
            <div style={{ borderRadius: '12px', padding: '12px 16px', backgroundColor: 'rgba(184,245,66,0.10)', border: '1px solid rgba(184,245,66,0.30)', color: '#b8f542', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
              {claimMsg.text}
            </div>
          )}

          {/* Calendário */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: 0 }}>
                Ciclo {cycleNumber} — dias {cycleStart} a {cycleEnd}
              </p>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Premios mudam a cada ciclo</span>
            </div>

            {cycleCalendar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Lock size={28} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Continue entrando no app todo dia</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>Seu calendario sera gerado automaticamente</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {cycleCalendar.map((entry) => {
                  const cfg = REWARD_CONFIG[entry.reward_type] ?? REWARD_CONFIG['ticket']
                  const reached = entry.day_number <= currentDay
                  const claimable = canClaim(entry)
                  const isClaiming = claiming === entry.day_number

                  return (
                    <div
                      key={entry.day_number}
                      onClick={() => claimable && !isClaiming && handleClaim(entry.day_number)}
                      style={{
                        position: 'relative', borderRadius: '14px', padding: '12px 8px',
                        border: `1px solid ${claimable ? cfg.border : reached ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)'}`,
                        backgroundColor: entry.claimed ? 'rgba(255,255,255,0.03)' : claimable ? cfg.bg : reached ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        opacity: entry.claimed ? 0.5 : (!reached && !claimable) ? 0.4 : 1,
                        cursor: claimable ? 'pointer' : 'default', transition: 'opacity 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Dia {entry.day_number - cycleStart + 1}</span>

                      {entry.claimed ? (
                        <CheckCircle size={20} color="rgba(255,255,255,0.30)" strokeWidth={1.5} />
                      ) : reached ? (
                        <div style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</div>
                      ) : (
                        <Lock size={16} color="rgba(255,255,255,0.20)" strokeWidth={1.5} />
                      )}

                      {!entry.claimed && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: reached ? cfg.color : 'rgba(255,255,255,0.20)' }}>{entry.reward_amount}x</span>
                      )}

                      {claimable && !isClaiming && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color }}>Resgatar</span>
                      )}

                      {isClaiming && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.50)' }}>
                          <Loader2 size={16} color="#fff" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Motivacao diaria */}
          {(() => {
            const msgs = [
              { min: 0,  max: 1,  text: 'Primeiro passo dado! Volte amanha para manter sua sequencia.', color: 'rgba(248,249,250,0.40)' },
              { min: 2,  max: 3,  text: 'Voce esta construindo um habito! Continue assim.', color: '#3b82f6' },
              { min: 4,  max: 6,  text: 'Quase uma semana! Sua dedicacao esta rendendo frutos.', color: '#3b82f6' },
              { min: 7,  max: 13, text: 'Uma semana completa! Voce esta entrando no ritmo.', color: '#ec4899' },
              { min: 14, max: 20, text: 'Duas semanas! Voce e um usuario dedicado — os melhores premios estao chegando.', color: '#b8f542' },
              { min: 21, max: 29, text: 'Tres semanas seguidas! Poucos chegam ate aqui. Continue!', color: '#8b5cf6' },
              { min: 30, max: 60, text: 'Um mes ou mais! Voce e lendario no MeAndYou. Os premios refletem isso.', color: '#f97316' },
              { min: 61, max: 999, text: 'Nivel maximo desbloqueado. Voce e parte do grupo mais dedicado do app!', color: '#F59E0B' },
            ]
            const msg = msgs.find(m => currentDay >= m.min && currentDay <= m.max) ?? msgs[0]
            return (
              <div style={{ borderRadius: '16px', padding: '16px 18px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: msg.color, flexShrink: 0, marginTop: '5px' }} />
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
              </div>
            )
          })()}

          {/* CTA roleta */}
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.20)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={24} color="#eab308" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--muted)', flex: 1, margin: 0 }}>Use seus tickets na roleta para ganhar ainda mais prêmios!</p>
            <a href="/roleta" style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: 'rgba(234,179,8,0.20)', color: '#eab308', fontSize: '12px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta)' }}>
              Ir à roleta
            </a>
          </div>

        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

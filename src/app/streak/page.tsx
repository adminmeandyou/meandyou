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
    setStreak(st ?? { current_streak: 0, longest_streak: 0, last_login_date: null })
    setCalendar(cal ?? [])
    setLoading(false)
  }

  async function handleClaim(dayNumber: number) {
    setClaiming(dayNumber)
    const { data, error } = await supabase.rpc('claim_streak_reward', { p_user_id: user!.id, p_day_number: dayNumber })
    if (error || !data?.success) {
      const msgs: Record<string, string> = { already_claimed: 'Já resgatado hoje.', not_reached: 'Dia ainda não alcançado.', streak_reset: 'Seu streak foi resetado.' }
      setClaimMsg({ day: dayNumber, text: msgs[data?.reason ?? ''] ?? 'Não foi possível resgatar.' })
    } else {
      setCalendar((prev) => prev.map((e) => (e.day_number === dayNumber ? { ...e, claimed: true } : e)))
      const entry = calendar.find((e) => e.day_number === dayNumber)
      if (entry) {
        const cfg = REWARD_CONFIG[entry.reward_type]
        setClaimMsg({ day: dayNumber, text: `+${entry.reward_amount} ${cfg?.label ?? entry.reward_type} adicionado!` })
      }
    }
    setClaiming(null)
    setTimeout(() => setClaimMsg(null), 3000)
  }

  const currentDay = streak?.current_streak ?? 0
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
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Sequência diária</h1>
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
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>Fique mais de 7 dias sem entrar e o streak reseta para 0</p>
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
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Calendário do mês — 1 prêmio por dia</p>

            {calendar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: '14px' }}>Calendário do mês ainda não gerado. Volte em breve!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {calendar.map((entry) => {
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
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Dia {entry.day_number}</span>

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

          {/* Legenda de fases */}
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Prêmios por fase</p>
            {[
              { range: 'Dias 1–6',   desc: 'Tickets (maioria), item básico ocasional',      color: 'rgba(248,249,250,0.40)' },
              { range: 'Dias 7–13',  desc: 'Mais tickets, primeiros itens especiais',       color: '#3b82f6' },
              { range: 'Dias 14–20', desc: 'Itens médios com mais frequência',              color: '#b8f542' },
              { range: 'Dias 21–29', desc: 'Itens bons aparecem',                           color: '#8b5cf6' },
              { range: 'Dias 30–60', desc: 'Prêmios máximos (até 10 itens do mesmo tipo)', color: '#f97316' },
            ].map((f) => (
              <div key={f.range} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: f.color, minWidth: '72px', flexShrink: 0 }}>{f.range}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{f.desc}</span>
              </div>
            ))}
          </div>

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

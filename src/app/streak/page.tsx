'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Flame, Ticket, Star, Zap, Search, RotateCcw, Ghost,
  Lock, CheckCircle, Loader2, Crown, AlertTriangle, TrendingUp, Sprout, Dumbbell, Heart,
} from 'lucide-react'

const REWARD_CONFIG: Record<string, {
  color: string; bg: string; border: string; label: string; icon: React.ReactNode
}> = {
  ticket:        { color: '#eab308', bg: 'rgba(234,179,8,0.10)',   border: 'rgba(234,179,8,0.30)',   label: 'Ticket',          icon: <Ticket size={18} strokeWidth={1.5} /> },
  supercurtida:  { color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  border: 'rgba(236,72,153,0.30)',  label: 'SuperCurtida',    icon: <Star size={18} strokeWidth={1.5} /> },
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
      await fetch('/api/streak/sincronizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) })
    } else if (currentStreak + 5 >= maxDay) {
      await fetch('/api/streak/sincronizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'extend' }) })
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
    const res = await fetch('/api/streak/resgatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_number: dayNumber }),
    })
    const result = res.ok ? await res.json().catch(() => null) : null
    if (!res.ok || !result?.success) {
      const msgs: Record<string, string> = { already_claimed: 'Já resgatado hoje.', not_reached: 'Dia ainda não alcançado.', streak_reset: 'Seu streak foi resetado.' }
      setClaimMsg({ day: dayNumber, text: msgs[result?.reason ?? ''] ?? 'Não foi possível resgatar.' })
    } else {
      setCalendar((prev) => prev.map((e) => (e.day_number === dayNumber ? { ...e, claimed: true } : e)))
      const entry = calendar.find((e) => e.day_number === dayNumber)
      if (entry) {
        const cfg = REWARD_CONFIG[entry.reward_type]
        const nomeLabel = cfg?.label ?? (entry.reward_type.charAt(0).toUpperCase() + entry.reward_type.slice(1))
        setClaimMsg({ day: dayNumber, text: `+${entry.reward_amount} ${nomeLabel} adicionado!` })
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

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  // Progress bar: show last 7 days or currentDay, max 7
  const progressDays = Math.min(currentDay, 30)
  const progressTotal = Math.max(7, Math.ceil(currentDay / 7) * 7)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'rgba(8,9,14,0.80)', backdropFilter: 'blur(20px)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <button onClick={() => router.back()} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        {/* Logo ME&YOU + ícone loyalty */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(225,29,72,0.12)',
            border: '1px solid rgba(225,29,72,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Heart size={13} color="#E11D48" strokeWidth={2} fill="rgba(225,29,72,0.3)" />
          </div>
          <span style={{
            fontFamily: 'var(--font-fraunces)', fontSize: '17px', fontWeight: 700,
            color: '#F8F9FA', letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            <span style={{ color: '#F8F9FA' }}>ME&amp;</span><span style={{ color: '#E11D48' }}>YOU</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '100px', backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.18)', flexShrink: 0 }}>
          <Flame size={12} color="#E11D48" strokeWidth={1.5} />
          <span style={{ fontSize: '12px', color: '#E11D48', fontWeight: 700 }}>{loading ? '...' : currentDay}d</span>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
          <Loader2 size={28} color="rgba(255,255,255,0.20)" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Hero: contador gigante */}
          <section style={{ textAlign: 'center', paddingBottom: '8px' }}>
            <p style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(248,249,250,0.40)',
              fontFamily: 'var(--font-jakarta)',
              marginBottom: 12,
            }}>
              Sua Jornada
            </p>
            <h1 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 72, fontWeight: 900,
              fontStyle: 'italic',
              color: '#F8F9FA',
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {currentDay} Dias
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.55)', marginTop: 12, letterSpacing: '0.02em', fontFamily: 'var(--font-jakarta)' }}>
              Continue a chama acesa para prêmios exclusivos.
            </p>
            {/* Barra de progresso — segmentos thin */}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 3, height: 3, width: '100%', maxWidth: 300 }}>
                {Array.from({ length: 30 }).map((_, i) => {
                  const filled = i < currentDay
                  return (
                    <div key={i} style={{
                      flex: 1, borderRadius: 9999,
                      backgroundColor: filled ? '#E11D48' : 'rgba(255,255,255,0.10)',
                      transition: 'background-color 0.3s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  )
                })}
              </div>
            </div>
          </section>

          {/* Mensagem de feedback */}
          {claimMsg && (
            <div style={{ borderRadius: '12px', padding: '12px 16px', backgroundColor: 'rgba(184,245,66,0.10)', border: '1px solid rgba(184,245,66,0.30)', color: '#b8f542', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
              {claimMsg.text}
            </div>
          )}

          {/* Secao: Premios */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 22, fontWeight: 700,
                color: '#F8F9FA', margin: 0,
                letterSpacing: '-0.01em',
              }}>
                Prêmios Diários
              </h2>
              <span style={{
                fontSize: 9, fontWeight: 800,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#F59E0B',
                fontFamily: 'var(--font-jakarta)',
                padding: '3px 8px',
                borderRadius: '100px',
                backgroundColor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.20)',
              }}>
                MÊS DE {monthLabel.toUpperCase()}
              </span>
            </div>

            {cycleCalendar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Lock size={28} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Continue entrando no app todo dia</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>Seu calendário será gerado automaticamente</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {cycleCalendar.map((entry) => {
                  const cfg = REWARD_CONFIG[entry.reward_type] ?? REWARD_CONFIG['ticket']
                  const reached = entry.day_number <= currentDay
                  const claimable = canClaim(entry)
                  const isClaiming = claiming === entry.day_number
                  const dayInCycle = entry.day_number - cycleStart + 1
                  const isToday = entry.day_number === currentDay
                  // Premium milestone (day 8, 15, 30)
                  const isMilestone = dayInCycle === 8 || dayInCycle === 15 || dayInCycle === 30

                  const cardBg = isToday
                    ? '#E11D48'
                    : isMilestone && !entry.claimed
                      ? 'linear-gradient(135deg, #ee9800 0%, #B45309 100%)'
                      : entry.claimed
                        ? 'rgba(255,255,255,0.02)'
                        : reached
                          ? cfg.bg
                          : '#0F1117'

                  const cardBorder = isToday
                    ? '1px solid rgba(255,255,255,0.20)'
                    : isMilestone && !entry.claimed
                      ? '1px solid rgba(245,158,11,0.40)'
                      : claimable
                        ? `1px solid ${cfg.border}`
                        : reached
                          ? '1px solid rgba(255,255,255,0.10)'
                          : '1px solid rgba(255,255,255,0.05)'

                  return (
                    <div
                      key={entry.day_number}
                      onClick={() => claimable && !isClaiming && handleClaim(entry.day_number)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: '10px', padding: '10px 8px',
                        border: cardBorder,
                        background: cardBg,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'space-between',
                        opacity: entry.claimed ? 0.5 : (!reached && !claimable) ? 0.4 : 1,
                        cursor: claimable ? 'pointer' : 'default',
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: isToday ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 700, color: isToday || (isMilestone && !entry.claimed) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.40)', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                        {isToday ? 'HOJE' : `${String(dayInCycle).padStart(2, '0')}`}
                      </span>

                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        {entry.claimed ? (
                          <CheckCircle size={isToday ? 24 : 18} color="rgba(255,255,255,0.30)" strokeWidth={1.5} />
                        ) : reached ? (
                          <div style={{ color: isToday || (isMilestone && !entry.claimed) ? '#fff' : cfg.color, display: 'flex' }}>
                            {cfg.icon}
                          </div>
                        ) : (
                          <Lock size={14} color="rgba(255,255,255,0.20)" strokeWidth={1.5} />
                        )}
                      </div>

                      {!entry.claimed && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: isToday || (isMilestone && !entry.claimed) ? 'rgba(255,255,255,0.9)' : reached ? cfg.color : 'rgba(255,255,255,0.20)', textTransform: 'uppercase' }}>
                          {claimable ? 'Coletar' : !reached ? cfg.label : cfg.label}
                        </span>
                      )}

                      {isClaiming && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.50)' }}>
                          <Loader2 size={16} color="#fff" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* CTA: Noir Curator */}
          <div style={{
            borderRadius: '16px', padding: '24px',
            backgroundColor: '#13161F',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Luz de fundo vermelha */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', background: 'radial-gradient(ellipse at top right, rgba(225,29,72,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h3 style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 20, fontWeight: 700,
                color: '#F8F9FA', margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}>
                Desbloqueie o Noir Curator
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.55)', lineHeight: 1.6, margin: '0 0 20px', fontFamily: 'var(--font-jakarta)' }}>
                Mantenha sua sequência por 30 dias para receber o selo vitalício de Curador e acessos antecipados.
              </p>
              <button style={{
                width: '100%', padding: '14px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
                border: 'none', cursor: 'pointer',
                color: '#fff', fontFamily: 'var(--font-jakarta)',
                fontSize: 12, fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(225,29,72,0.30)',
                transition: 'transform 0.15s',
              }}>
                Ativar Lembrete Noturno
              </button>
            </div>
          </div>

          {/* Motivacao diaria */}
          {(() => {
            const msgs = [
              { min: 0,  max: 1,  text: 'Primeiro passo dado! Volte amanhã para manter sua sequência.', color: 'rgba(248,249,250,0.40)' },
              { min: 2,  max: 3,  text: 'Você está construindo um hábito! Continue assim.', color: '#3b82f6' },
              { min: 4,  max: 6,  text: 'Quase uma semana! Sua dedicação está rendendo frutos.', color: '#3b82f6' },
              { min: 7,  max: 13, text: 'Uma semana completa! Você está entrando no ritmo.', color: '#ec4899' },
              { min: 14, max: 20, text: 'Duas semanas! Você é um usuário dedicado, os melhores prêmios estão chegando.', color: '#b8f542' },
              { min: 21, max: 29, text: 'Três semanas seguidas! Poucos chegam até aqui. Continue!', color: '#8b5cf6' },
              { min: 30, max: 60, text: 'Um mês ou mais! Você é lendário no MeAndYou. Os prêmios refletem isso.', color: '#f97316' },
              { min: 61, max: 999, text: 'Nível máximo desbloqueado. Você é parte do grupo mais dedicado do app!', color: '#F59E0B' },
            ]
            const msg = msgs.find(m => currentDay >= m.min && currentDay <= m.max) ?? msgs[0]
            return (
              <div style={{ borderRadius: '14px', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: msg.color, flexShrink: 0, marginTop: '6px' }} />
                <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.45)', margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
              </div>
            )
          })()}

          {/* CTA roleta */}
          <div style={{ borderRadius: '14px', padding: '14px 16px', backgroundColor: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={22} color="#eab308" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.50)', flex: 1, margin: 0 }}>Use seus tickets na roleta para ganhar ainda mais prêmios!</p>
            <a href="/roleta" style={{ padding: '7px 12px', borderRadius: '9999px', backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308', fontSize: '11px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta)' }}>
              Roleta
            </a>
          </div>

        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

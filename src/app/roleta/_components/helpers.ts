import { Ticket, Star, Zap, Search, RotateCcw, Gift, Crown, Trophy, Eye } from 'lucide-react'
import React from 'react'

export const PRIZE_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; glow: string
  icon: React.ReactNode; rarity?: string
}> = {
  fichas:          { label: 'Fichas',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  glow: 'rgba(245,158,11,0.5)',  icon: React.createElement(Ticket, { size: 22, strokeWidth: 1.5 }) },
  supercurtida:    { label: 'SuperCurtida',   color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.35)',  glow: 'rgba(236,72,153,0.5)',  icon: React.createElement(Star, { size: 22, strokeWidth: 1.5 }) },
  boost:           { label: 'Boost',           color: '#E11D48', bg: 'rgba(225,29,72,0.12)',   border: 'rgba(225,29,72,0.35)',   glow: 'rgba(225,29,72,0.5)',   icon: React.createElement(Zap, { size: 22, strokeWidth: 1.5 }) },
  lupa:            { label: 'Lupa',            color: '#ea580c', bg: 'rgba(234,88,12,0.12)',   border: 'rgba(234,88,12,0.35)',   glow: 'rgba(234,88,12,0.5)',   icon: React.createElement(Search, { size: 22, strokeWidth: 1.5 }) },
  rewind:          { label: 'Desfazer',        color: '#be185d', bg: 'rgba(190,24,93,0.12)',   border: 'rgba(190,24,93,0.35)',   glow: 'rgba(190,24,93,0.5)',   icon: React.createElement(RotateCcw, { size: 22, strokeWidth: 1.5 }) },
  ver_quem_curtiu: { label: 'Ver quem curtiu você', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.35)',   glow: 'rgba(244,63,94,0.5)',   icon: React.createElement(Eye, { size: 22, strokeWidth: 1.5 }) },
  invisivel_1d:    { label: 'Invisível 1 dia', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.35)', glow: 'rgba(156,163,175,0.5)', icon: React.createElement(Gift, { size: 22, strokeWidth: 1.5 }) },
  plan_plus_1d:    { label: '1 dia Plus',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.45)',  glow: 'rgba(139,92,246,0.7)',  icon: React.createElement(Crown, { size: 22, strokeWidth: 1.5 }), rarity: 'Raro' },
  plan_black_1d:   { label: '1 dia Black',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.45)',  glow: 'rgba(245,158,11,0.7)',  icon: React.createElement(Trophy, { size: 22, strokeWidth: 1.5 }), rarity: 'Lendário' },
}

export const WHEEL_SEGMENTS = [
  { type: 'fichas',          label: '1 Ficha',      colorA: '#78350f', colorB: '#d97706' },
  { type: 'supercurtida',    label: 'SuperCurtida',    colorA: '#831843', colorB: '#ec4899' },
  { type: 'fichas',          label: '2 Fichas',     colorA: '#92400e', colorB: '#f59e0b' },
  { type: 'lupa',            label: 'Lupa',         colorA: '#7c2d12', colorB: '#ea580c' },
  { type: 'ver_quem_curtiu', label: 'Ver Curtidas', colorA: '#4c0519', colorB: '#F43F5E' },
  { type: 'boost',           label: 'Boost',        colorA: '#7f1d1d', colorB: '#E11D48' },
  { type: 'fichas',          label: '5 Fichas',     colorA: '#78350f', colorB: '#f59e0b' },
  { type: 'rewind',          label: 'Desfazer',     colorA: '#500724', colorB: '#be185d' },
  { type: 'invisivel_1d',    label: 'Invisível',    colorA: '#1f2937', colorB: '#6b7280' },
  { type: 'plan_plus_1d',    label: '1 dia Plus',   colorA: '#2e1065', colorB: '#8b5cf6' },
  { type: 'plan_black_1d',   label: '1 dia Black',  colorA: '#451a03', colorB: '#F59E0B' },
]

export function getSegIdx(rewardType: string, rewardAmount: number): number {
  if (rewardType === 'fichas') {
    if (rewardAmount >= 5) return 6
    if (rewardAmount >= 2) return 2
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

export function playSpinSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const ticks = 12
    for (let i = 0; i < ticks; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = 320 + i * 18
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.06 + 0.01)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.06 + 0.06)
      osc.start(ctx.currentTime + i * 0.06)
      osc.stop(ctx.currentTime + i * 0.06 + 0.07)
    }
  } catch {}
}

export function playWinSound(jackpot = false) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const notes = jackpot
      ? [523, 659, 784, 1047, 1319]
      : [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04)
      gain.gain.linearRampToValueAtTime(0, t + 0.25)
      osc.start(t)
      osc.stop(t + 0.26)
    })
  } catch {}
}

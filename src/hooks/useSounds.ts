'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── Preferência de som (persistida no localStorage) ────────────────────────
const SOUND_PREF_KEY = 'meandyou_sounds_enabled'

function readPref(): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(SOUND_PREF_KEY)
  return v === null ? true : v === '1'
}

function writePref(v: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_PREF_KEY, v ? '1' : '0')
  window.dispatchEvent(new CustomEvent('meandyou-sounds-pref', { detail: v }))
}

export function useSoundPref(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(true)
  useEffect(() => {
    setEnabled(readPref())
    const handler = (e: Event) => setEnabled((e as CustomEvent).detail)
    window.addEventListener('meandyou-sounds-pref', handler)
    return () => window.removeEventListener('meandyou-sounds-pref', handler)
  }, [])
  return [enabled, (v: boolean) => { writePref(v); setEnabled(v) }]
}

// ─── AudioContext singleton (lazy, init no primeiro gesto) ──────────────────
let ctxSingleton: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctxSingleton) return ctxSingleton
  const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const AC = W.AudioContext ?? W.webkitAudioContext
  if (!AC) return null
  try {
    ctxSingleton = new AC()
  } catch {
    return null
  }
  return ctxSingleton
}

type ToneOpts = {
  freq: number
  duration: number // em ms
  type?: OscillatorType
  volume?: number
  attack?: number // ms
  release?: number // ms
  sweepTo?: number // slide para esta frequência
}

function playTone(ctx: AudioContext, opts: ToneOpts, when = 0) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const now = ctx.currentTime + when
  const dur = opts.duration / 1000
  const atk = (opts.attack ?? 5) / 1000
  const rel = (opts.release ?? 40) / 1000
  const vol = opts.volume ?? 0.1

  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, now)
  if (opts.sweepTo !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.sweepTo, now + dur)
  }

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + atk)
  gain.gain.setValueAtTime(vol, now + Math.max(atk, dur - rel))
  gain.gain.linearRampToValueAtTime(0, now + dur)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + dur + 0.02)
}

// ─── Receitas de sons ────────────────────────────────────────────────────────
export type SoundName =
  | 'tap'        // clique discreto
  | 'open'       // abrir modal/sheet
  | 'close'      // fechar modal/sheet (bem leve)
  | 'toggle'     // toggle on/off
  | 'send'       // enviar mensagem
  | 'receive'    // receber mensagem
  | 'like'       // curtir
  | 'superlike'  // superlike
  | 'dislike'    // dislike
  | 'match'      // novo match (arpeggio feliz)
  | 'success'    // sucesso genérico
  | 'error'      // erro
  | 'notification' // notificação chegando
  | 'coin'       // fichas/moedas
  | 'attention'  // chamar atenção — 3 bips

function playRecipe(ctx: AudioContext, name: SoundName) {
  switch (name) {
    case 'tap':
      playTone(ctx, { freq: 820, duration: 35, type: 'sine', volume: 0.05, release: 25 })
      return
    case 'open':
      playTone(ctx, { freq: 440, sweepTo: 660, duration: 90, type: 'sine', volume: 0.07 })
      return
    case 'close':
      playTone(ctx, { freq: 520, sweepTo: 340, duration: 90, type: 'sine', volume: 0.05 })
      return
    case 'toggle':
      playTone(ctx, { freq: 720, duration: 45, type: 'triangle', volume: 0.07 })
      return
    case 'send':
      playTone(ctx, { freq: 720, sweepTo: 880, duration: 90, type: 'sine', volume: 0.08 })
      return
    case 'receive':
      playTone(ctx, { freq: 560, duration: 70, type: 'sine', volume: 0.09 })
      playTone(ctx, { freq: 780, duration: 100, type: 'sine', volume: 0.09 }, 0.06)
      return
    case 'like':
      playTone(ctx, { freq: 660, sweepTo: 880, duration: 130, type: 'triangle', volume: 0.11 })
      return
    case 'superlike':
      playTone(ctx, { freq: 700, duration: 90, type: 'triangle', volume: 0.12 })
      playTone(ctx, { freq: 940, duration: 90, type: 'triangle', volume: 0.12 }, 0.08)
      playTone(ctx, { freq: 1180, duration: 130, type: 'triangle', volume: 0.12 }, 0.16)
      return
    case 'dislike':
      playTone(ctx, { freq: 360, sweepTo: 220, duration: 110, type: 'sine', volume: 0.07 })
      return
    case 'match':
      // Arpeggio feliz: C5 E5 G5 C6
      playTone(ctx, { freq: 523, duration: 110, type: 'triangle', volume: 0.13 })
      playTone(ctx, { freq: 659, duration: 110, type: 'triangle', volume: 0.13 }, 0.10)
      playTone(ctx, { freq: 784, duration: 110, type: 'triangle', volume: 0.13 }, 0.20)
      playTone(ctx, { freq: 1046, duration: 200, type: 'triangle', volume: 0.14 }, 0.30)
      return
    case 'success':
      playTone(ctx, { freq: 660, duration: 80, type: 'triangle', volume: 0.10 })
      playTone(ctx, { freq: 990, duration: 140, type: 'triangle', volume: 0.10 }, 0.08)
      return
    case 'error':
      playTone(ctx, { freq: 240, duration: 90, type: 'square', volume: 0.08 })
      playTone(ctx, { freq: 200, duration: 130, type: 'square', volume: 0.08 }, 0.08)
      return
    case 'notification':
      playTone(ctx, { freq: 880, duration: 70, type: 'triangle', volume: 0.11 })
      playTone(ctx, { freq: 1100, duration: 110, type: 'triangle', volume: 0.11 }, 0.07)
      return
    case 'coin':
      playTone(ctx, { freq: 1320, duration: 60, type: 'triangle', volume: 0.10 })
      playTone(ctx, { freq: 1760, duration: 120, type: 'triangle', volume: 0.10 }, 0.05)
      return
    case 'attention':
      // 3 bips médios bem perceptíveis
      playTone(ctx, { freq: 1000, duration: 120, type: 'square', volume: 0.14 })
      playTone(ctx, { freq: 1000, duration: 120, type: 'square', volume: 0.14 }, 0.20)
      playTone(ctx, { freq: 1000, duration: 120, type: 'square', volume: 0.14 }, 0.40)
      return
  }
}

// ─── Hook público ────────────────────────────────────────────────────────────
export function useSounds() {
  const play = useCallback((name: SoundName) => {
    if (typeof window === 'undefined') return
    if (!readPref()) return
    const ctx = getCtx()
    if (!ctx) return
    // iOS/Chrome: context começa suspenso até primeiro gesto
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    try {
      playRecipe(ctx, name)
    } catch (e) {
      console.warn('sound play failed', e)
    }
  }, [])

  return { play }
}

// Helper fora de hook (para listeners globais sem React context)
export function playSoundDirect(name: SoundName) {
  if (typeof window === 'undefined') return
  if (!readPref()) return
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  try { playRecipe(ctx, name) } catch {}
}

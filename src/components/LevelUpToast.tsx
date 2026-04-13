'use client'

import { useEffect, useRef, useState } from 'react'

interface LevelUpEvent {
  level: number
  tickets: number
}

const DURATION = 5000

function SingleLevelUpToast({ level, tickets, onDismiss }: LevelUpEvent & { onDismiss: () => void }) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    if (navigator.vibrate) navigator.vibrate([20, 40, 80, 40, 20])

    startRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        handleDismiss()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  function handleDismiss() {
    setVisible(false)
    setTimeout(onDismiss, 350)
  }

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '120px'})`,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        width: 'calc(100% - 32px)',
        maxWidth: 390,
        zIndex: 9999,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{
        backgroundColor: '#0F1117',
        border: '1px solid rgba(245,158,11,0.40)',
        borderRadius: 20,
        padding: '18px 20px 14px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.20), 0 0 60px rgba(245,158,11,0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Glow top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Ícone */}
          <div style={{
            width: 64, height: 64, flexShrink: 0,
            borderRadius: 16,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245,158,11,0.30)',
            flexDirection: 'column',
            gap: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', lineHeight: 1, fontFamily: 'var(--font-jakarta)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LVL</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', lineHeight: 1.1, fontFamily: 'var(--font-fraunces)' }}>
              {level}
            </span>
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Subiu de nivel!
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 4px', lineHeight: 1.2 }}>
              Nivel {level} alcancado
            </p>
            {tickets > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#F59E0B',
                backgroundColor: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.40)',
                borderRadius: 100, padding: '2px 8px', display: 'inline-block',
              }}>
                +{tickets} ticket{tickets > 1 ? 's' : ''} ganhos
              </span>
            )}
          </div>

        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.5), #F59E0B)',
            borderRadius: 100,
            transition: 'width 0.1s linear',
          }} />
        </div>

      </div>
    </div>
  )
}

export function LevelUpToast() {
  const [queue, setQueue] = useState<LevelUpEvent[]>([])

  useEffect(() => {
    function onLevelUp(e: Event) {
      const detail = (e as CustomEvent<LevelUpEvent>).detail
      if (!detail?.level) return
      setQueue(prev => [...prev, detail])
    }
    window.addEventListener('xp:levelup', onLevelUp)
    return () => window.removeEventListener('xp:levelup', onLevelUp)
  }, [])

  if (queue.length === 0) return null

  return (
    <SingleLevelUpToast
      level={queue[0].level}
      tickets={queue[0].tickets}
      onDismiss={() => setQueue(prev => prev.slice(1))}
    />
  )
}

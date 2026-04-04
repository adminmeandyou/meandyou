'use client'

import { useEffect, useRef, useState } from 'react'

const RARITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  comum:          { label: 'Comum',          color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  raro:           { label: 'Raro',           color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  super_raro:     { label: 'Super Raro',     color: '#A855F7', bg: 'rgba(168,85,247,0.12)'  },
  epico:          { label: 'Épico',          color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  lendario:       { label: 'Lendário',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  super_lendario: { label: 'Super Lendário', color: '#E11D48', bg: 'rgba(225,29,72,0.12)'   },
}

export interface BadgeData {
  id: string
  name: string
  description: string
  icon_url?: string | null
  rarity: string
}

interface Props {
  badge: BadgeData
  onDismiss: () => void
}

const DURATION = 5000

function SingleBadgeToast({ badge, onDismiss }: Props) {
  const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.comum
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true))

    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 60, 80])

    // Progress bar countdown
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
        border: `1px solid ${rarity.color}40`,
        borderRadius: 20,
        padding: '18px 20px 14px',
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${rarity.color}20, 0 0 60px ${rarity.color}15`,
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Glow top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Badge image */}
          <div style={{
            width: 64, height: 64, flexShrink: 0,
            borderRadius: 16,
            background: rarity.bg,
            border: `1px solid ${rarity.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: `0 0 20px ${rarity.color}30`,
          }}>
            {badge.icon_url
              ? <img src={badge.icon_url} alt={badge.name} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
              : <span style={{ fontSize: 28 }}>🏆</span>
            }
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: rarity.color, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Emblema desbloqueado!
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F8F9FA', margin: '0 0 4px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {badge.name}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 600, color: rarity.color,
              backgroundColor: rarity.bg,
              border: `1px solid ${rarity.color}40`,
              borderRadius: 100, padding: '2px 8px', display: 'inline-block',
            }}>
              {rarity.label}
            </span>
          </div>

        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${rarity.color}80, ${rarity.color})`,
            borderRadius: 100,
            transition: 'width 0.1s linear',
          }} />
        </div>

      </div>
    </div>
  )
}

interface QueueProps {
  queue: BadgeData[]
  onDequeue: () => void
}

export function BadgeUnlockedToast({ queue, onDequeue }: QueueProps) {
  if (queue.length === 0) return null
  return <SingleBadgeToast badge={queue[0]} onDismiss={onDequeue} />
}

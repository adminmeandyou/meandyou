'use client'

import { TrendingUp } from 'lucide-react'

type Props = {
  userXp: number
  userLevel: number
  xpBonusActive: boolean
}

export default function XpBar({ userXp, userLevel, xpBonusActive }: Props) {
  const xpForLevel = (n: number) => n <= 0 ? 0 : Math.round(100 * Math.pow(n, 1.3))
  const MAX_LEVEL = 500
  const levelXpStart = xpForLevel(userLevel)
  const levelXpEnd = xpForLevel(Math.min(userLevel + 1, MAX_LEVEL))
  const progress = userLevel >= MAX_LEVEL ? 100 : Math.round(((userXp - levelXpStart) / (levelXpEnd - levelXpStart)) * 100)

  return (
    <div style={{ margin: '0 20px', padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} color="#10b981" strokeWidth={1.5} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
            Nível {userLevel}{userLevel < 500 ? ` → ${userLevel + 1}` : ' MAX'}
          </span>
          {xpBonusActive && <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', borderRadius: 100, padding: '1px 7px' }}>XP x2</span>}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{userXp.toLocaleString('pt-BR')} XP</span>
      </div>
      <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#10b981', borderRadius: 100, transition: 'width 0.6s ease' }} />
      </div>
      {userLevel < 500 && (
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: '6px 0 0', textAlign: 'right' }}>
          {(levelXpEnd - userXp).toLocaleString('pt-BR')} XP para nível {userLevel + 1}
        </p>
      )}
    </div>
  )
}

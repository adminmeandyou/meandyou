'use client'

import { Flame } from 'lucide-react'

type Props = {
  currentStreak: number
}

export default function StreakBanner({ currentStreak }: Props) {
  if (currentStreak <= 0) return null

  return (
    <div style={{ margin: '8px 20px 0', padding: '11px 16px', backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Flame size={15} color="#F59E0B" strokeWidth={1.5} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{currentStreak} dias seguidos</span>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.40)' }}>streak ativo, mais chances de raros</span>
    </div>
  )
}

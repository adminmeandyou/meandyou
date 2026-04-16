'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export function BoostActiveBanner({ until }: { until: Date }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = until.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [until])
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '8px 14px', flexShrink: 0 }}>
      <Zap size={13} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
      <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Boost ativo: você está em destaque</span>
      <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.70)', marginLeft: 4 }}>{timeLeft}</span>
    </div>
  )
}

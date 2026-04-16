'use client'

import { Clock } from 'lucide-react'

export function BloqueioAviso({ horas, dias }: { horas?: number; dias?: number }) {
  const msg = horas
    ? `Pode editar novamente em ${horas} hora${horas > 1 ? 's' : ''}.`
    : `Pode editar novamente em ${dias} dia${(dias ?? 0) > 1 ? 's' : ''}.`
  return (
    <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Clock size={14} color="#f59e0b" />
      <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>{msg}</p>
    </div>
  )
}

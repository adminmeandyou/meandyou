'use client'

import { PRIZE_CONFIG } from './helpers'

type Props = {
  history: { reward_type: string; reward_amount: number; created_at: string }[]
  formatPrize: (type: string, amount: number) => string
}

export default function HistoryList({ history, formatPrize }: Props) {
  if (history.length === 0) return null

  return (
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>Últimos giros</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {history.map((h, i) => {
          const cfg = PRIZE_CONFIG[h.reward_type] ?? PRIZE_CONFIG['fichas']
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: cfg.color, display: 'flex', flexShrink: 0 }}>{cfg.icon}</div>
              <span style={{ fontSize: '13px', color: 'var(--muted)', flex: 1 }}>{formatPrize(h.reward_type, h.reward_amount)}</span>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.20)' }}>
                {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

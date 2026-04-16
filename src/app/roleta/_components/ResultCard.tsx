'use client'

import { PRIZE_CONFIG } from './helpers'

type SpinResult = { reward_type: string; reward_amount: number; was_jackpot?: boolean }

type Props = {
  result: SpinResult
  formatPrize: (type: string, amount: number) => string
}

export default function ResultCard({ result, formatPrize }: Props) {
  const config = PRIZE_CONFIG[result.reward_type] ?? PRIZE_CONFIG['fichas']

  return (
    <div style={{ width: '100%', borderRadius: '20px', padding: '20px', border: `1px solid ${config.border}`, backgroundColor: config.bg, boxShadow: `0 0 32px ${config.glow}40`, display: 'flex', alignItems: 'center', gap: '16px', animation: 'result-enter 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: config.bg, border: `2px solid ${config.border}`, boxShadow: `0 0 20px ${config.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color, flexShrink: 0 }}>
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        {config.rarity && (
          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: config.color, display: 'block', marginBottom: '4px', textShadow: `0 0 10px ${config.glow}` }}>
            {config.rarity}!
          </span>
        )}
        <p style={{ color: 'var(--text)', fontFamily: 'var(--font-fraunces)', fontSize: '18px', margin: 0, lineHeight: 1.2 }}>
          Você ganhou {formatPrize(result.reward_type, result.reward_amount)}!
        </p>
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '5px 0 0' }}>Adicionado ao seu saldo automaticamente</p>
      </div>
    </div>
  )
}

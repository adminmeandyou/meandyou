'use client'

import { useCountdownStr } from './useCountdownStr'

export function BalanceItem({ icon, label, value, active, suffix, countdown, onActivate, activating }: {
  icon: React.ReactNode
  label: string
  value: number
  active?: boolean
  suffix?: string
  countdown?: string
  onActivate?: () => void
  activating?: boolean
}) {
  const timeLeft = useCountdownStr(countdown)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', borderRadius: '12px', backgroundColor: active ? 'var(--accent-light)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'var(--accent-border)' : 'rgba(255,255,255,0.05)'}` }}>
      <div style={{ marginBottom: '6px' }}>{icon}</div>
      <p style={{ fontSize: '16px', fontWeight: '800', color: active ? 'var(--accent)' : 'var(--text)', margin: 0, lineHeight: 1 }}>
        {value}{suffix && <span style={{ fontSize: '11px', fontWeight: '400', marginLeft: '1px' }}>{suffix}</span>}
      </p>
      <p style={{ fontSize: '10px', color: 'var(--muted)', margin: 0, marginTop: '3px', textAlign: 'center', lineHeight: 1.2 }}>{label}</p>
      {active && timeLeft && (
        <p style={{ fontSize: '9px', color: active ? 'var(--accent)' : '#6b7280', margin: 0, marginTop: '2px', textAlign: 'center', fontWeight: 600, letterSpacing: '0.02em' }}>{timeLeft}</p>
      )}
      {onActivate && !active && value > 0 && (
        <button
          onClick={onActivate}
          disabled={activating}
          style={{ marginTop: '6px', padding: '3px 10px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: '9px', fontWeight: 700, cursor: activating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', opacity: activating ? 0.6 : 1 }}
        >
          {activating ? '...' : 'Ativar'}
        </button>
      )}
    </div>
  )
}

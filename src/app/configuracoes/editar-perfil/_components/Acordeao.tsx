'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

export function Acordeao({ id, titulo, badge, badgeCor, aberto, onToggle, children }: {
  id: string; titulo: string; badge?: string; badgeCor?: string
  aberto: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: aberto ? 'rgba(255,255,255,0.02)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
      >
        <span style={{ color: '#F8F9FA', fontSize: '15px', fontWeight: 600, flex: 1 }}>{titulo}</span>
        {badge && (
          <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: `${badgeCor}18`, color: badgeCor, border: `1px solid ${badgeCor}30` }}>
            {badge}
          </span>
        )}
        {aberto ? <ChevronUp size={16} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.35)" />}
      </button>
      {aberto && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>{children}</div>}
    </div>
  )
}

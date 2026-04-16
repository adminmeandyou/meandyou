'use client'

import { Sparkles, X } from 'lucide-react'

export function IcebreakerPanel({
  icebreakerList,
  onSelect,
  onShuffle,
  onClose,
}: {
  icebreakerList: string[]
  onSelect: (text: string) => void
  onShuffle: () => void
  onClose: () => void
}) {
  return (
    <div style={{
      flexShrink: 0, margin: '0 14px 8px',
      background: 'rgba(15,17,23,0.96)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 16, padding: '14px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Puxando assunto</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onShuffle}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 100,
              background: 'rgba(225,29,72,0.10)',
              border: '1px solid rgba(225,29,72,0.20)',
              cursor: 'pointer', color: 'var(--accent)',
              fontFamily: 'var(--font-jakarta)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em',
            }}
            title="Trocar sugestoes"
          >
            <Sparkles size={10} strokeWidth={2} />
            Trocar
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={13} color="var(--muted)" />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {icebreakerList.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            style={{
              padding: '9px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(248,249,250,0.65)', fontSize: 13,
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-fraunces)', fontStyle: 'italic',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

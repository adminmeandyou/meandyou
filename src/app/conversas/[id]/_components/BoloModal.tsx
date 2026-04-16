'use client'

export function BoloModal({
  otherName,
  onClose,
  onSelect,
}: {
  otherName: string
  onClose: () => void
  onSelect: (opcao: string) => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px', maxWidth: 360, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>O encontro aconteceu?</h3>
          <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: 0, lineHeight: 1.55 }}>Voce aceitou um convite de encontro. Nos conte como foi!</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'incrivel', label: 'Foi incrivel!' },
            { id: 'estranho', label: 'Foi estranho' },
            { id: 'bolo', label: 'Levei um bolo' },
            { id: 'ainda_nao', label: 'Ainda nao aconteceu' },
          ].map(op => (
            <button
              key={op.id}
              onClick={() => onSelect(op.id)}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: op.id === 'bolo' ? '1px solid rgba(225,29,72,0.30)' : '1px solid var(--border)', backgroundColor: op.id === 'bolo' ? 'rgba(225,29,72,0.07)' : 'rgba(255,255,255,0.04)', color: op.id === 'bolo' ? 'var(--accent)' : 'var(--text)', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
            >
              {op.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: 12, padding: '10px', background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Perguntar depois
        </button>
      </div>
    </div>
  )
}

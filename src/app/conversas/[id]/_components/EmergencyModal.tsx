'use client'

import { ShieldAlert } from 'lucide-react'

export function EmergencyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(225,29,72,0.30)', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldAlert size={26} color="#F43F5E" strokeWidth={1.5} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>Você está em perigo?</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
          Esta ação ligará imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.70)' }}>Polícia Militar (190)</strong>. Use apenas em situações de risco real.
        </p>
        <a
          href="tel:190"
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            borderRadius: 12, background: '#E11D48',
            color: '#fff', fontFamily: 'var(--font-jakarta)',
            fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 10,
          }}
        >
          Ligar 190 agora
        </a>
        <button
          onClick={onClose}
          style={{ display: 'block', width: '100%', padding: '12px 0', color: 'var(--muted)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

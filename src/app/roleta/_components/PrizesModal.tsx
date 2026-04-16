'use client'

import { X, TrendingUp } from 'lucide-react'
import { PRIZE_CONFIG } from './helpers'

type Props = {
  onClose: () => void
}

export default function PrizesModal({ onClose }: Props) {
  const commonPrizes = Object.entries(PRIZE_CONFIG).filter(([, cfg]) => !cfg.rarity)
  const rarePrizes = Object.entries(PRIZE_CONFIG).filter(([, cfg]) => cfg.rarity)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', backgroundColor: '#0F1117', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '20px 20px 48px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: 0 }}>Prêmios possíveis</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>
        <div style={{ backgroundColor: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <TrendingUp size={15} color="#E11D48" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.65)', margin: 0, lineHeight: 1.6 }}>
            Quanto mais dias seguidos você entrar no app, maior a chance de sortear prêmios raros e lendários. Mantenha seu streak ativo!
          </p>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(248,249,250,0.35)', margin: '0 0 10px' }}>Comuns</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
          {commonPrizes.map(([type, cfg]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
              <div style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>1 a 5 unidades</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(248,249,250,0.35)', margin: '0 0 10px' }}>Raros e Lendários</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
          {rarePrizes.map(([type, cfg]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
              <div style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{cfg.label}</span>
                <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.rarity}!</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: 'rgba(248,249,250,0.28)', margin: 0, lineHeight: 1.5 }}>
            A Caixa Super Lendária é exclusiva da Loja e não é sorteada na roleta.
          </p>
        </div>
      </div>
    </div>
  )
}

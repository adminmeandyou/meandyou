'use client'

import { Star, X, Loader2 } from 'lucide-react'
import { G, G_SOFT, G_BORDER, BG_CARD, RATING_OPTIONS } from './helpers'

export default function RatingPanel({
  onSubmit,
  onSkip,
  submitting,
  inline,
  withHeader,
  onClose,
}: {
  onSubmit: (key: string) => void
  onSkip: () => void
  submitting: boolean
  inline?: boolean
  withHeader?: boolean
  onClose?: () => void
}) {
  return (
    <div style={inline ? { width: '100%', maxWidth: 360, background: BG_CARD, borderRadius: 20, border: `1px solid ${G_BORDER}`, padding: '24px 20px', marginBottom: 24 } : {}}>
      {withHeader && (
        <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} color={G} strokeWidth={1.5} />
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: inline ? 16 : 18, color: '#fff', fontWeight: 700 }}>
            Como foi essa conversa?
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
        Sua avaliação é anônima. Ajuda outros usuários e melhora o Camarote.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RATING_OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.key}
              onClick={() => onSubmit(opt.key)}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: inline ? 12 : 14,
                padding: inline ? '12px 16px' : '14px 16px', borderRadius: inline ? 12 : 14,
                background: 'rgba(255,255,255,0.03)',
                border: opt.key === 'denuncia' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.07)',
                cursor: submitting ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {!inline && (
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={opt.color} strokeWidth={1.5} />
                </div>
              )}
              {inline && <Icon size={16} color={opt.color} strokeWidth={1.5} />}
              <span style={{ fontSize: inline ? 14 : 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontFamily: 'var(--font-jakarta)', fontWeight: 500 }}>
                {opt.label}
              </span>
              {submitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </div>

      <button
        onClick={onSkip}
        style={{ marginTop: inline ? 12 : 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: inline ? 12 : 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}
      >
        Agora não
      </button>
    </div>
  )
}

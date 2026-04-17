'use client'

import { X, CheckCircle2 } from 'lucide-react'

const RATING_OPTIONS = [
  { id: 'incrivel', label: 'Pessoa incrível', color: '#10b981' },
  { id: 'agradavel', label: 'Conversa agradável', color: '#60a5fa' },
  { id: 'nao_interessei', label: 'Não me interessei', color: 'rgba(248,249,250,0.45)' },
  { id: 'ignorado', label: 'Fui ignorado(a)', color: '#facc15' },
  { id: 'nao_recomendo', label: 'Não recomendo', color: '#fb923c' },
  { id: 'desagradavel', label: 'Pessoa desagradável', color: '#f87171' },
  { id: 'inconveniente', label: 'Inconveniente / desrespeitosa', color: '#ef4444' },
]

export function RatingModal({
  otherName,
  matchId,
  ratingConfirmOpcao,
  setRatingConfirmOpcao,
  onClose,
  onConfirm,
}: {
  otherName: string
  matchId: string
  ratingConfirmOpcao: string | null
  setRatingConfirmOpcao: (v: string | null) => void
  onClose: () => void
  onConfirm: (opcao: string) => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={() => { onClose(); setRatingConfirmOpcao(null) }}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: 0 }}>
            {ratingConfirmOpcao ? 'Confirmar avaliação' : 'Como foi a conversa?'}
          </h3>
          <button onClick={() => { onClose(); setRatingConfirmOpcao(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--muted)" strokeWidth={1.5} />
          </button>
        </div>

        {ratingConfirmOpcao ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 6px' }}>
              Sua avaliação: <strong>{RATING_OPTIONS.find(o => o.id === ratingConfirmOpcao)?.label}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 20px' }}>Essa avaliação é anônima. Você pode alterar depois.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRatingConfirmOpcao(null)}
                style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Voltar
              </button>
              <button
                onClick={() => onConfirm(ratingConfirmOpcao)}
                style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E11D48, #be123c)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Confirmar
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 20px' }}>Avaliação anônima: {otherName} não saberá quem avaliou.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RATING_OPTIONS.map(op => {
                const currentRating = localStorage.getItem(`rating_${matchId}`)
                const isCurrentRating = currentRating === op.id
                return (
                  <button
                    key={op.id}
                    onClick={() => setRatingConfirmOpcao(op.id)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 14,
                      border: isCurrentRating ? `1px solid ${op.color}` : '1px solid var(--border)',
                      backgroundColor: isCurrentRating ? `${op.color}15` : 'rgba(255,255,255,0.04)',
                      color: 'var(--text)', fontSize: 14, fontWeight: 500, textAlign: 'left',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                      fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: op.color, flexShrink: 0 }} />
                    <span style={{ color: op.color, flex: 1 }}>{op.label}</span>
                    {isCurrentRating && <CheckCircle2 size={16} color={op.color} />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

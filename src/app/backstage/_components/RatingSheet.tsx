'use client'

import { useState } from 'react'
import { Star, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BACKSTAGE_RATING_OPTIONS, BG_CARD, G, G_BORDER, isRated } from './helpers'

interface RatingSheetProps {
  ratingFor: { id: string; otherId: string }
  onClose: () => void
  onRated: (requestId: string) => void
}

export default function RatingSheet({ ratingFor, onClose, onRated }: RatingSheetProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  async function submitRating(ratingKey: string) {
    if (!user || submitting) return
    setSubmitting(true)
    try {
      await supabase.from('camarote_ratings').insert({
        request_id: ratingFor.id,
        rater_id:   user.id,
        rated_id:   ratingFor.otherId,
        rating:     ratingKey,
      })
    } catch { /* silencioso */ }
    localStorage.setItem(`camarote_rating_${ratingFor.id}`, ratingKey)
    onRated(ratingFor.id)
    onClose()
    setSubmitting(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: BG_CARD, borderTop: `1px solid ${G_BORDER}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 36px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} color={G} strokeWidth={1.5} />
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', fontWeight: 700 }}>
              Como foi essa conversa?
            </span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
          Sua avaliação é anônima.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BACKSTAGE_RATING_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.key}
                onClick={() => submitRating(opt.key)}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: opt.key === 'denuncia' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.07)', cursor: submitting ? 'default' : 'pointer', textAlign: 'left', width: '100%', opacity: submitting ? 0.5 : 1, fontFamily: 'var(--font-jakarta)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={opt.color} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontWeight: 500 }}>{opt.label}</span>
                {submitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
              </button>
            )
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}>
          Agora não
        </button>
      </div>
    </>
  )
}

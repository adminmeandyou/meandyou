'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Flag, X, ChevronRight, Loader2, CheckCircle, ShieldAlert } from 'lucide-react'

const REASONS = [
  { value: 'fake_profile',  label: 'Perfil falso',         icon: '🎭' },
  { value: 'scam',          label: 'Golpe ou fraude',       icon: '💰' },
  { value: 'harassment',    label: 'Assédio',               icon: '⚠️' },
  { value: 'minor',         label: 'Menor de idade',        icon: '🔞' },
  { value: 'inappropriate', label: 'Conteúdo impróprio',    icon: '🚫' },
]

interface ReportModalProps {
  reportedId: string
  reportedName: string
  onClose: () => void
}

export function ReportModal({ reportedId, reportedName, onClose }: ReportModalProps) {
  const { user } = useAuth()

  const [step, setStep] = useState<'reason' | 'details' | 'success'>('reason')
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const REASON_MAP: Record<string, string> = {
    fake_profile:  'fake',
    scam:          'other',
    harassment:    'harassment',
    minor:         'minor',
    inappropriate: 'inappropriate',
  }

  async function handleSubmit() {
    if (!user || !selectedReason) return
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/denuncias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          reported_user_id: reportedId,
          category: REASON_MAP[selectedReason] ?? 'other',
          description: details.trim() || undefined,
        }),
      })

      setLoading(false)

      if (res.status === 409) {
        setError('Você já denunciou este perfil recentemente.')
        return
      }
      if (!res.ok) {
        setError('Erro ao enviar denúncia. Tente novamente.')
        return
      }

      setStep('success')
    } catch {
      setLoading(false)
      setError('Erro ao enviar denúncia. Tente novamente.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 40px',
          width: '100%', maxWidth: 480,
          animation: 'ui-slide-up 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldAlert size={18} color="var(--accent)" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: 0 }}>
              {step === 'success' ? 'Denúncia enviada' : `Denunciar ${reportedName}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} color="var(--muted)" strokeWidth={1.5} />
          </button>
        </div>

        {/* Step 1: Motivo */}
        {step === 'reason' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 16px', fontFamily: 'var(--font-jakarta)' }}>
              Qual o motivo da denúncia?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 14,
                    border: selectedReason === reason.value
                      ? '1px solid rgba(225,29,72,0.30)'
                      : '1px solid var(--border)',
                    background: selectedReason === reason.value
                      ? 'rgba(225,29,72,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, flex: 1, textAlign: 'left' }}>
                    {reason.label}
                  </span>
                  <ChevronRight size={16} color={selectedReason === reason.value ? 'var(--accent)' : 'var(--muted-2)'} strokeWidth={1.5} />
                </button>
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#F43F5E', textAlign: 'center', margin: '12px 0 0', fontFamily: 'var(--font-jakarta)' }}>{error}</p>
            )}

            <button
              onClick={() => selectedReason && setStep('details')}
              disabled={!selectedReason}
              style={{
                width: '100%', marginTop: 20, padding: '14px',
                borderRadius: 12, border: 'none',
                background: selectedReason
                  ? 'linear-gradient(135deg, #E11D48, #be123c)'
                  : 'rgba(255,255,255,0.06)',
                color: selectedReason ? '#fff' : 'var(--muted-2)',
                fontSize: 14, fontWeight: 700, cursor: selectedReason ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-jakarta)',
                boxShadow: selectedReason ? '0 4px 16px rgba(225,29,72,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Detalhes */}
        {step === 'details' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 16px', fontFamily: 'var(--font-jakarta)' }}>
              Adicione mais detalhes (opcional)
            </p>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              maxLength={500}
              rows={4}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                fontSize: 14, color: 'var(--text)',
                fontFamily: 'var(--font-jakarta)',
                outline: 'none', resize: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.25)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            />
            <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted-2)', margin: '6px 0 0', fontFamily: 'var(--font-jakarta)' }}>
              {details.length}/500
            </p>

            {error && (
              <p style={{ fontSize: 12, color: '#F43F5E', textAlign: 'center', margin: '12px 0 0', fontFamily: 'var(--font-jakarta)' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setStep('reason')}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E11D48, #be123c)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                  boxShadow: '0 4px 16px rgba(225,29,72,0.25)',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <Loader2 size={16} color="#fff" className="animate-spin" /> : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sucesso */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(46,196,160,0.10)', border: '1px solid rgba(46,196,160,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={28} color="var(--green)" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px', fontFamily: 'var(--font-jakarta)' }}>
              Sua denúncia foi recebida e será analisada pela nossa equipe. Obrigado por ajudar a manter o MeAndYou seguro.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                transition: 'background 0.2s',
              }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportButton({ reportedId, reportedName }: { reportedId: string; reportedName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none',
          color: 'var(--muted-2)', fontSize: 13,
          cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
          transition: 'color 0.2s',
        }}
      >
        <Flag size={14} strokeWidth={1.5} />
        Denunciar
      </button>

      {open && (
        <ReportModal
          reportedId={reportedId}
          reportedName={reportedName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

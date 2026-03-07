'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Flag, X, ChevronRight, Loader2, CheckCircle } from 'lucide-react'

const REASONS = [
  { value: 'fake_profile', label: 'Perfil falso' },
  { value: 'scam', label: 'Golpe ou fraude' },
  { value: 'harassment', label: 'Assédio' },
  { value: 'minor', label: 'Menor de idade' },
  { value: 'inappropriate', label: 'Conteúdo impróprio' },
]

interface ReportModalProps {
  reportedId: string
  reportedName: string
  onClose: () => void
}

export function ReportModal({ reportedId, reportedName, onClose }: ReportModalProps) {
  const { user } = useAuth()
  const supabase = createClient()

  const [step, setStep] = useState<'reason' | 'details' | 'success'>('reason')
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!user || !selectedReason) return
    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('create_report', {
      p_reporter_id: user.id,
      p_reported_id: reportedId,
      p_reason: selectedReason,
      p_details: details.trim() || null,
    })

    setLoading(false)

    if (rpcError || !data?.success) {
      if (data?.reason === 'already_reported') {
        setError('Você já denunciou este perfil recentemente.')
      } else {
        setError('Erro ao enviar denúncia. Tente novamente.')
      }
      return
    }

    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#141020] rounded-t-3xl border-t border-white/10 p-6">

        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

        {/* Fechar */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-fraunces text-xl text-white">
            {step === 'success' ? 'Denúncia enviada' : `Denunciar ${reportedName}`}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-white/40 hover:text-white" />
          </button>
        </div>

        {/* Step: Motivo */}
        {step === 'reason' && (
          <div className="space-y-2">
            <p className="text-white/40 text-sm mb-4">Qual o motivo da denúncia?</p>
            {REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition text-sm ${
                  selectedReason === reason.value
                    ? 'bg-red-500/10 border-red-500/30 text-white'
                    : 'bg-white/5 border-white/8 text-white/70 hover:border-white/20'
                }`}
              >
                {reason.label}
                <ChevronRight size={16} className="text-white/30" />
              </button>
            ))}

            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}

            <button
              onClick={() => selectedReason && setStep('details')}
              disabled={!selectedReason}
              className="w-full mt-4 py-3.5 rounded-2xl bg-red-500/80 text-white font-semibold text-sm hover:bg-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step: Detalhes */}
        {step === 'details' && (
          <div>
            <p className="text-white/40 text-sm mb-4">
              Adicione mais detalhes (opcional)
            </p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Descreva o que aconteceu…"
              maxLength={500}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-500/30 transition resize-none"
            />
            <p className="text-right text-white/20 text-xs mt-1">{details.length}/500</p>

            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('reason')}
                className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/60 text-sm hover:text-white transition"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-red-500/80 text-white font-semibold text-sm hover:bg-red-500 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Sucesso */}
        {step === 'success' && (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-[#b8f542] mx-auto mb-4" />
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Sua denúncia foi recebida e será analisada pela nossa equipe. Obrigado por ajudar a manter o MeAndYou seguro.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Botão de denúncia (usado em qualquer perfil) ─────────────────────────────

export function ReportButton({ reportedId, reportedName }: { reportedId: string; reportedName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-white/30 hover:text-red-400 transition text-sm"
      >
        <Flag size={14} />
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
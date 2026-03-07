'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import Image from 'next/image'
import {
  Crown, Lock, MapPin, Heart, Loader2,
  AlertCircle, CheckCircle, ChevronRight, X, ShieldAlert
} from 'lucide-react'

const RESGATE_URL = 'https://pay.cakto.com.br/i73nbfm'

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BackstagePage() {
  const { limits, loading: planLoading } = usePlan()

  if (planLoading) {
    return (
      <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-white/30" />
      </div>
    )
  }

  // Não-Black vê área borrada
  if (!limits.isBlack) {
    return <BackstageBlurred />
  }

  return <BackstageContent />
}

// ─── Área borrada para não-Black ──────────────────────────────────────────────

function BackstageBlurred() {
  const { user } = useAuth()
  const supabase = createClient()
  const [requestSent, setRequestSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function handleRequest() {
    if (!accepted) return
    if (!user) return
    setLoading(true)

    const { data } = await supabase.rpc('create_access_request', {
      p_user_id: user.id,
      p_type: 'backstage',
    })

    setLoading(false)
    if (data?.success || data?.reason === 'already_pending') {
      setRequestSent(true)
      setShowConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta relative overflow-hidden">

      {/* Conteúdo borrado atrás */}
      <div className="filter blur-sm pointer-events-none select-none opacity-40">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <Crown size={20} className="text-[#f5c842]" />
            <h1 className="font-fraunces text-2xl text-white">Backstage</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-white/5 aspect-[3/4]" />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-[#0e0b14]/80 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/30 flex items-center justify-center mb-5">
          <Lock size={28} className="text-[#f5c842]" />
        </div>
        <h2 className="font-fraunces text-2xl text-white text-center mb-2">
          Área exclusiva
        </h2>
        <p className="text-white/40 text-sm text-center leading-relaxed mb-8 max-w-xs">
          O Backstage é exclusivo para assinantes Black. Assine agora ou faça um pedido para ser resgatado por um Black.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3">
          {/* Botão assinar Black */}
          <a
            href="/planos"
            className="w-full py-3.5 rounded-2xl text-center font-bold text-sm transition"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d485)', color: '#1a1a1a' }}
          >
            Assinar Camarote Black — R$ 100/mês
          </a>

          {/* Botão fazer pedido */}
          {requestSent ? (
            <div className="w-full py-3.5 rounded-2xl bg-[#b8f542]/10 border border-[#b8f542]/20 flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-[#b8f542]" />
              <span className="text-[#b8f542] text-sm font-semibold">Pedido enviado!</span>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition"
            >
              Fazer pedido de acesso
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmação do pedido */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141020] rounded-t-3xl border-t border-white/10 p-6">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-fraunces text-xl text-white">Pedido de acesso</h3>
              <button onClick={() => setShowConfirm(false)}>
                <X size={18} className="text-white/40" />
              </button>
            </div>

            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Seu perfil ficará visível para assinantes Black interessados. Se um Black pagar R$ 15, vocês terão acesso ao chat por 30 dias.
            </p>

            {/* Aviso de não reembolso */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 flex gap-2">
              <ShieldAlert size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs leading-relaxed">
                <strong>Sem reembolso:</strong> O pagamento feito pelo assinante Black é imediato e não reembolsável. Ao aceitar, você concorda com estes termos.
              </p>
            </div>

            {/* Checkbox de aceite */}
            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <div
                onClick={() => setAccepted(!accepted)}
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                  accepted ? 'bg-[#b8f542] border-[#b8f542]' : 'border-white/20 bg-white/5'
                }`}
              >
                {accepted && <CheckCircle size={12} className="text-black" />}
              </div>
              <span className="text-white/50 text-xs leading-relaxed">
                Entendo que o pagamento feito pelo assinante Black não será reembolsado em nenhuma hipótese.
              </span>
            </label>

            <button
              onClick={handleRequest}
              disabled={!accepted || loading}
              className="w-full py-3.5 rounded-2xl bg-[#b8f542] text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a8e030] transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Enviar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Conteúdo real do Backstage (só Black vê) ────────────────────────────────

function BackstageContent() {
  const { user } = useAuth()
  const supabase = createClient()

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'essencial' | 'plus'>('all')
  const [rescuing, setRescuing] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<any>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase.rpc('get_available_requests', {
      p_black_user_id: user!.id,
    })
    setRequests(data ?? [])
    setLoading(false)
  }

  function handleRescue(request: any) {
    setConfirmRequest(request)
  }

  function handleCheckout() {
    if (!confirmRequest) return
    // Redireciona para Cakto com o request_id nos metadados via query param
    const url = `${RESGATE_URL}?metadata[request_id]=${confirmRequest.request_id}`
    window.open(url, '_blank')
    setConfirmRequest(null)
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header Backstage */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(180deg, rgba(201,168,76,0.08) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown size={20} className="text-[#f5c842]" />
          <h1 className="font-fraunces text-2xl text-white">Backstage</h1>
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#f5c842]/40 text-[#f5c842] ml-1">
            Camarote
          </span>
        </div>
        <p className="text-white/30 text-sm">Pedidos de acesso disponíveis</p>
      </div>

      {/* Filtros */}
      <div className="px-5 mb-5 flex gap-2">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'essencial', label: 'Pista' },
          { value: 'plus', label: 'VIP' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedFilter(opt.value as any)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              selectedFilter === opt.value
                ? 'bg-[#f5c842] text-black border-[#f5c842] font-semibold'
                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-white/30">
            <Crown size={32} />
            <p className="text-sm text-center">Nenhum pedido disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {requests.map((req) => (
              <RequestCard key={req.request_id} request={req} onRescue={handleRescue} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de resgate */}
      {confirmRequest && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141020] rounded-t-3xl border-t border-[#f5c842]/20 p-6">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="font-fraunces text-xl text-white">Resgatar acesso</h3>
              <button onClick={() => setConfirmRequest(null)}>
                <X size={18} className="text-white/40" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-white/5 border border-white/8">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                {confirmRequest.photo_best ? (
                  <Image src={confirmRequest.photo_best} alt={confirmRequest.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{confirmRequest.name}, {confirmRequest.age}</p>
                <p className="text-white/40 text-xs flex items-center gap-1">
                  <MapPin size={10} />
                  {confirmRequest.city}
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 flex gap-2">
              <ShieldAlert size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs leading-relaxed">
                <strong>Sem reembolso:</strong> Ao pagar R$ 15, o acesso ao chat é imediato e não reembolsável em nenhuma hipótese.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d485)', color: '#1a1a1a' }}
              >
                <Heart size={16} />
                Resgatar por R$ 15 — Super Match imediato
              </button>
              <button
                onClick={() => setConfirmRequest(null)}
                className="w-full py-3 rounded-2xl border border-white/10 text-white/40 text-sm hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card de pedido ───────────────────────────────────────────────────────────

function RequestCard({ request, onRescue }: { request: any; onRescue: (r: any) => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-[#f5c842]/10 aspect-[3/4]">
      {request.photo_best ? (
        <Image src={request.photo_best} alt={request.name} fill className="object-cover" sizes="200px" />
      ) : (
        <div className="absolute inset-0 bg-white/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-fraunces text-sm text-white font-semibold leading-tight">
          {request.name}, {request.age}
        </p>
        <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5 mb-3">
          <MapPin size={9} />
          {request.city}
        </p>
        <button
          onClick={() => onRescue(request)}
          className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d485)', color: '#1a1a1a' }}
        >
          <Crown size={11} />
          Resgatar R$ 15
        </button>
      </div>
    </div>
  )
}
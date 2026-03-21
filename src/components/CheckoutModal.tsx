'use client'

import { useState, useEffect, useCallback, CSSProperties } from 'react'
import { supabase } from '@/app/lib/supabase'
import { X, Copy, Check, Loader2, CreditCard, Smartphone } from 'lucide-react'

export type CheckoutType = 'subscription' | 'fichas' | 'camarote'
export type PaymentCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual'

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  type: CheckoutType
  plan?: string
  amountCents?: number
  description?: string
  metadata?: Record<string, string>
}

const CYCLE_OPTIONS = [
  { value: 'monthly',    label: 'Mensal',     discount: 0,   suffix: '/mes' },
  { value: 'quarterly',  label: 'Trimestral', discount: 10,  suffix: ' total' },
  { value: 'semiannual', label: 'Semestral',  discount: 20,  suffix: ' total' },
  { value: 'annual',     label: 'Anual',      discount: 30,  suffix: ' total', badge: 'Melhor desconto' },
]

const PLAN_MONTHLY: Record<string, number> = { essencial: 9.97, plus: 39.97, black: 99.97 }

function calcPrice(plan: string, cycle: PaymentCycle): number {
  const monthly = PLAN_MONTHLY[plan] ?? 0
  const months = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }[cycle]
  const discount = { monthly: 0, quarterly: 0.10, semiannual: 0.20, annual: 0.30 }[cycle]
  return parseFloat((monthly * months * (1 - discount)).toFixed(2))
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StepperBar({ step, isSubscription }: { step: number; isSubscription: boolean }) {
  const steps = isSubscription
    ? ['Ciclo', 'Pagamento', 'Dados', 'Confirmacao']
    : ['Pagamento', 'Dados', 'Confirmacao']
  const normalizedStep = isSubscription ? step : step - 1
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 20px' }}>
      {steps.map((label, i) => {
        const idx = i + 1
        const active = idx === normalizedStep
        const done = idx < normalizedStep
        return (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 3, borderRadius: 2,
              background: done || active ? '#E11D48' : 'rgba(255,255,255,0.10)',
              transition: 'background 0.3s',
            }} />
            <p style={{
              margin: '4px 0 0', fontSize: 10, textAlign: 'center',
              color: active ? '#F8F9FA' : 'rgba(248,249,250,0.35)',
              fontFamily: 'var(--font-jakarta)',
            }}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function StepCycle({ plan, cycle, setCycle, onNext }: {
  plan: string; cycle: PaymentCycle; setCycle: (c: PaymentCycle) => void; onNext: () => void
}) {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
        Escolha o periodo
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CYCLE_OPTIONS.map(opt => {
          const price = calcPrice(plan, opt.value as PaymentCycle)
          const selected = cycle === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setCycle(opt.value as PaymentCycle)}
              style={{
                background: selected ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected ? '#E11D48' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
                  {opt.label}
                </span>
                {opt.badge && (
                  <span style={{
                    fontSize: 10, background: '#E11D48', color: '#fff',
                    borderRadius: 100, padding: '2px 7px',
                    fontFamily: 'var(--font-jakarta)', fontWeight: 600,
                  }}>{opt.badge}</span>
                )}
                {opt.discount > 0 && !opt.badge && (
                  <span style={{
                    fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981',
                    borderRadius: 100, padding: '2px 7px', fontFamily: 'var(--font-jakarta)',
                  }}>-{opt.discount}%</span>
                )}
              </div>
              <span style={{ fontSize: 14, color: selected ? '#E11D48' : '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 700 }}>
                {formatBRL(price)}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(248,249,250,0.5)' }}>{opt.suffix}</span>
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={onNext}
        style={{
          marginTop: 16, width: '100%', padding: 14, borderRadius: 12,
          background: '#E11D48', border: 'none', color: '#fff', cursor: 'pointer',
          fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
        }}
      >
        Continuar
      </button>
    </div>
  )
}

function StepMethod({ loading, error, amount, onSelect }: {
  loading: boolean; error: string | null; amount: number; onSelect: (m: 'pix' | 'credit_card') => void
}) {
  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
        Como pagar?
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>
        Total: <strong style={{ color: '#F8F9FA' }}>{formatBRL(amount)}</strong>
      </p>
      {error && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#F43F5E', fontFamily: 'var(--font-jakarta)' }}>{error}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          disabled={loading}
          onClick={() => onSelect('pix')}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12, padding: 16, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, opacity: loading ? 0.5 : 1,
          }}
        >
          <Smartphone size={20} strokeWidth={1.5} color="#10b981" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#F8F9FA', fontWeight: 600, fontFamily: 'var(--font-jakarta)' }}>PIX</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>Aprovacao imediata</p>
          </div>
        </button>
        <button
          disabled={loading}
          onClick={() => onSelect('credit_card')}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12, padding: 16, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, opacity: loading ? 0.5 : 1,
          }}
        >
          <CreditCard size={20} strokeWidth={1.5} color="#F8F9FA" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#F8F9FA', fontWeight: 600, fontFamily: 'var(--font-jakarta)' }}>Cartao de credito</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>Visa, Mastercard e outros</p>
          </div>
        </button>
      </div>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Loader2 size={20} strokeWidth={1.5} color="#E11D48" style={{ animation: 'spin 1s linear infinite' } as CSSProperties} />
        </div>
      )}
    </div>
  )
}

function StepPix({ pixData, timeLeft, copied, onCopy }: {
  pixData: { brCode: string; brCodeBase64: string };
  timeLeft: number; copied: boolean; onCopy: () => void
}) {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(248,249,250,0.7)', fontFamily: 'var(--font-jakarta)' }}>
        Escaneie o QR code ou copie o codigo
      </p>
      {pixData.brCodeBase64 && (
        <img
          src={`data:image/png;base64,${pixData.brCodeBase64}`}
          alt="QR Code PIX"
          style={{
            width: 180, height: 180, margin: '0 auto 16px', display: 'block',
            borderRadius: 8, background: '#fff', padding: 8,
          }}
        />
      )}
      <div style={{
        display: 'flex', alignItems: 'center', marginBottom: 12,
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, overflow: 'hidden',
      }}>
        <p style={{
          flex: 1, margin: 0, padding: '10px 12px', fontSize: 11,
          color: 'rgba(248,249,250,0.5)', fontFamily: 'monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{pixData.brCode}</p>
        <button
          onClick={onCopy}
          style={{
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderLeft: '1px solid rgba(255,255,255,0.10)',
            padding: '10px 14px', cursor: 'pointer',
            color: copied ? '#10b981' : '#F8F9FA',
          }}
        >
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
        </button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#E11D48', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
        Expira em {m}:{s}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Loader2 size={14} strokeWidth={1.5} color="rgba(248,249,250,0.4)" style={{ animation: 'spin 1s linear infinite' } as CSSProperties} />
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(248,249,250,0.4)', fontFamily: 'var(--font-jakarta)' }}>
          Aguardando pagamento...
        </p>
      </div>
    </div>
  )
}

function StepCard({ billingUrl }: { billingUrl: string }) {
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(248,249,250,0.7)', fontFamily: 'var(--font-jakarta)' }}>
        Insira os dados do seu cartao
      </p>
      <iframe
        src={billingUrl}
        style={{ width: '100%', height: 420, border: 'none', borderRadius: 12 }}
        title="Pagamento com cartao"
      />
    </div>
  )
}

function StepSuccess({ type, plan, cycle, onClose }: {
  type: string; plan?: string; cycle?: string; onClose: () => void
}) {
  const label = type === 'subscription'
    ? `Plano ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} ativado!`
    : type === 'fichas' ? 'Fichas creditadas!' : 'Acesso ao Camarote ativado!'
  const cycleMap: Record<string, string> = {
    monthly: 'Renovacao mensal automatica.',
    quarterly: 'Acesso por 3 meses.',
    semiannual: 'Acesso por 6 meses.',
    annual: 'Acesso por 12 meses.',
  }
  const sub = type === 'subscription' && cycle ? cycleMap[cycle] : ''
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Check size={24} strokeWidth={1.5} color="#10b981" />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
        Pagamento confirmado!
      </h3>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
        {label}
      </p>
      {sub && (
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>{sub}</p>
      )}
      <button
        onClick={onClose}
        style={{
          width: '100%', padding: 14, borderRadius: 12,
          background: '#E11D48', border: 'none', color: '#fff', cursor: 'pointer',
          fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
        }}
      >
        Continuar
      </button>
    </div>
  )
}

export default function CheckoutModal({
  open, onClose, type, plan, amountCents, description, metadata = {}
}: CheckoutModalProps) {
  const isSubscription = type === 'subscription'
  const [step, setStep] = useState(isSubscription ? 1 : 2)
  const [cycle, setCycle] = useState<PaymentCycle>('monthly')
  const [method, setMethod] = useState<'pix' | 'credit_card' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{ brCode: string; brCodeBase64: string } | null>(null)
  const [billingUrl, setBillingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setStep(isSubscription ? 1 : 2)
      setCycle('monthly')
      setMethod(null)
      setLoading(false)
      setError(null)
      setPaymentId(null)
      setPixData(null)
      setBillingUrl(null)
      setTimeLeft(900)
    }
  }, [open, isSubscription])

  // Timer PIX
  useEffect(() => {
    if (step !== 3 || method !== 'pix' || !pixData) return
    if (timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [step, method, pixData, timeLeft])

  // Polling PIX
  useEffect(() => {
    if (step !== 3 || method !== 'pix' || !paymentId) return
    let active = true
    const poll = async () => {
      if (!active) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const resp = await fetch(`/api/payments/status/${paymentId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
        const json = await resp.json()
        if (json.status === 'paid') {
          setStep(4)
        } else if (json.status === 'expired') {
          setError('PIX expirado. Feche e tente novamente.')
        } else if (active) {
          setTimeout(poll, 3000)
        }
      } catch {
        if (active) setTimeout(poll, 3000)
      }
    }
    const t = setTimeout(poll, 3000)
    return () => { active = false; clearTimeout(t) }
  }, [step, method, paymentId])

  const createPayment = useCallback(async (selectedMethod: 'pix' | 'credit_card') => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const body: Record<string, unknown> = {
        type,
        method: selectedMethod,
        ...(isSubscription ? { plan, cycle } : { amount_override: amountCents }),
        metadata,
      }
      const resp = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      })
      const json = await resp.json()
      if (!json.ok) {
        setError(json.error ?? 'Erro ao iniciar pagamento')
        setLoading(false)
        return
      }
      setPaymentId(json.paymentId)
      if (selectedMethod === 'pix') {
        setPixData({ brCode: json.brCode, brCodeBase64: json.brCodeBase64 })
      } else {
        setBillingUrl(json.billingUrl)
      }
      setStep(3)
    } catch {
      setError('Erro de conexao. Tente novamente.')
    }
    setLoading(false)
  }, [type, isSubscription, plan, cycle, amountCents, metadata])

  const handleMethodSelect = (m: 'pix' | 'credit_card') => {
    setMethod(m)
    createPayment(m)
  }

  const copyPix = () => {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.brCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentAmount = isSubscription && plan
    ? calcPrice(plan, cycle)
    : (amountCents ?? 0) / 100

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0F1117', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>
            {description ?? (isSubscription
              ? `Plano ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''}`
              : type === 'fichas' ? 'Recarga de Fichas' : 'Camarote Black')}
          </p>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.5)', padding: 4 }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <StepperBar step={step} isSubscription={isSubscription} />

        <div style={{ padding: '0 20px 24px' }}>
          {step === 1 && isSubscription && plan && (
            <StepCycle plan={plan} cycle={cycle} setCycle={setCycle} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <StepMethod loading={loading} error={error} amount={currentAmount} onSelect={handleMethodSelect} />
          )}
          {step === 3 && method === 'pix' && pixData && (
            <StepPix pixData={pixData} timeLeft={timeLeft} copied={copied} onCopy={copyPix} />
          )}
          {step === 3 && method === 'credit_card' && billingUrl && (
            <StepCard billingUrl={billingUrl} />
          )}
          {step === 4 && (
            <StepSuccess type={type} plan={plan} cycle={cycle} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

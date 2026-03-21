# AbacatePay Checkout Transparente — Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrar AbacatePay como gateway de pagamentos com checkout transparente (modal inline) para assinaturas recorrentes, recarga de fichas e Camarote Black.

**Architecture:** Modal reutilizavel `<CheckoutModal>` com stepper de 4 passos (ciclo → metodo → pagamento → confirmacao). PIX usa `pixQrCode/create` direto (QR code inline). Cartao usa `billing/create` que abre URL da AbacatePay num iframe dentro do modal. Webhook valida secret via query param e ativa o produto correspondente com idempotencia.

**Tech Stack:** Next.js 14 API Routes, Supabase (service role), AbacatePay REST API v1, React hooks, CSS vars Dark Romantic v2.

**AbacatePay API Base:** `https://api.abacatepay.com/v1`
**Auth:** `Authorization: Bearer <ABACATEPAY_API_KEY>`

**Endpoints usados:**
- `POST /pixQrCode/create` — cria QR code PIX (amount em centavos, retorna brCode + brCodeBase64 + id)
- `GET /pixQrCode/check?id=` — checar status: PENDING | EXPIRED | CANCELLED | PAID | REFUNDED
- `POST /billing/create` — cria cobrança com cartao (retorna url para iframe)
- Webhook POST para nossa rota — payload `{ event, data }` com secret na URL

---

## Task 1: Migration SQL — tabela payments + alteracoes em subscriptions

**Files:**
- Create: `migration_abacatepay.sql`

**Step 1: Escrever o SQL**

```sql
-- 1. Tabela payments
CREATE TABLE IF NOT EXISTS payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('subscription','fichas','camarote')),
  gateway_id   text UNIQUE,
  method       text NOT NULL CHECK (method IN ('pix','credit_card')),
  amount       numeric(10,2) NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  metadata     jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  paid_at      timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- 2. Renomear coluna na tabela subscriptions
ALTER TABLE subscriptions RENAME COLUMN cakto_order_id TO gateway_order_id;

-- 3. Adicionar coluna cycle
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cycle text DEFAULT 'monthly'
  CHECK (cycle IN ('monthly','quarterly','semiannual','annual'));

-- 4. Index para idempotencia no webhook
CREATE INDEX IF NOT EXISTS payments_gateway_id_idx ON payments(gateway_id);
```

**Step 2: Rodar no Supabase**

Acessar Supabase Dashboard > SQL Editor > colar o SQL > Run.
Verificar: tabela `payments` criada, coluna `gateway_order_id` existe em `subscriptions`.

---

## Task 2: Variaveis de ambiente

**Files:**
- Modify: `.env.local`

**Step 1: Adicionar ao .env.local**

```
ABACATEPAY_API_KEY=abc_prod_Ac2G6TyAMEkgystb5dK4wmcm
ABACATEPAY_WEBHOOK_SECRET=meandyou_webhook_abacate_2026
```

Observacao: o webhook secret pode ser qualquer string longa. Anote ele pois precisa cadastrar no painel da AbacatePay.

**Step 2: Configurar no Vercel**

Ir em Vercel Dashboard > Settings > Environment Variables > adicionar as duas variaveis acima para Production.

**Step 3: Cadastrar webhook no painel AbacatePay**

URL a cadastrar:
```
https://www.meandyou.com.br/api/webhooks/abacatepay?secret=meandyou_webhook_abacate_2026
```

---

## Task 3: API route — POST /api/payments/create

Esta rota recebe o pedido do frontend, cria o pagamento na AbacatePay e registra na tabela `payments`.

**Files:**
- Create: `src/app/api/payments/create/route.ts`

**Step 1: Escrever a rota**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ABACATE_BASE = 'https://api.abacatepay.com/v1'
const ABACATE_KEY = process.env.ABACATEPAY_API_KEY!

// Valores em centavos por plano/ciclo
const PRICES: Record<string, Record<string, number>> = {
  essencial: { monthly: 997, quarterly: 2690, semiannual: 4780, annual: 8370 },
  plus:      { monthly: 3997, quarterly: 10790, semiannual: 19180, annual: 33570 },
  black:     { monthly: 9997, quarterly: 26990, semiannual: 47980, annual: 83970 },
}

export async function POST(req: NextRequest) {
  try {
    // Autenticacao
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })

    const body = await req.json()
    const { type, method, plan, cycle = 'monthly', amount_override, metadata = {} } = body

    // Calcula valor
    let amountCents: number
    if (type === 'subscription') {
      amountCents = PRICES[plan]?.[cycle]
      if (!amountCents) return NextResponse.json({ error: 'Plano/ciclo invalido' }, { status: 400 })
    } else {
      // fichas e camarote recebem amount_override em centavos
      if (!amount_override) return NextResponse.json({ error: 'amount_override obrigatorio' }, { status: 400 })
      amountCents = amount_override
    }

    // Busca dados do usuario para AbacatePay
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, cpf')
      .eq('id', user.id)
      .single()

    const customerName = profile?.display_name ?? 'Usuario'

    let gatewayId: string
    let responseData: Record<string, unknown>

    if (method === 'pix') {
      // PIX — checkout transparente
      const pixResp = await fetch(`${ABACATE_BASE}/pixQrCode/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ABACATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountCents,
          expiresIn: 900, // 15 minutos
          description: buildDescription(type, plan, cycle),
          customer: {
            name: customerName,
            email: user.email,
            cellphone: '00000000000', // AbacatePay exige mas nao usa para PIX
            taxId: profile?.cpf ?? '00000000000',
          },
          metadata: { user_id: user.id, type, plan, cycle, ...metadata },
        }),
      })

      const pixData = await pixResp.json()
      if (!pixData.data?.id) {
        console.error('AbacatePay PIX error:', pixData)
        return NextResponse.json({ error: 'Erro ao criar PIX' }, { status: 502 })
      }

      gatewayId = pixData.data.id
      responseData = {
        method: 'pix',
        gatewayId,
        brCode: pixData.data.brCode,
        brCodeBase64: pixData.data.brCodeBase64,
        expiresAt: pixData.data.expiresAt,
      }
    } else {
      // Cartao — billing com URL para iframe
      const billingResp = await fetch(`${ABACATE_BASE}/billing/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ABACATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frequency: type === 'subscription' ? 'MULTIPLE_PAYMENTS' : 'ONE_TIME',
          methods: ['CARD'],
          products: [{
            externalId: `meandyou_${type}_${user.id}`,
            name: buildDescription(type, plan, cycle),
            quantity: 1,
            price: amountCents,
          }],
          returnUrl: 'https://www.meandyou.com.br/planos',
          completionUrl: 'https://www.meandyou.com.br/planos?checkout=success',
          customer: {
            name: customerName,
            email: user.email!,
            cellphone: '00000000000',
            taxId: profile?.cpf ?? '00000000000',
          },
          externalId: `${user.id}_${Date.now()}`,
          metadata: { user_id: user.id, type, plan, cycle, ...metadata },
        }),
      })

      const billingData = await billingResp.json()
      if (!billingData.data?.id) {
        console.error('AbacatePay billing error:', billingData)
        return NextResponse.json({ error: 'Erro ao criar cobranca' }, { status: 502 })
      }

      gatewayId = billingData.data.id
      responseData = {
        method: 'credit_card',
        gatewayId,
        billingUrl: billingData.data.url,
      }
    }

    // Salva pagamento pendente no banco
    const { data: payment, error: dbErr } = await supabase.from('payments').insert({
      user_id: user.id,
      type,
      gateway_id: gatewayId,
      method,
      amount: amountCents / 100,
      status: 'pending',
      metadata: { plan, cycle, ...metadata },
    }).select('id').single()

    if (dbErr) {
      console.error('Erro ao salvar payment:', dbErr)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, paymentId: payment.id, ...responseData })
  } catch (err) {
    console.error('payments/create error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function buildDescription(type: string, plan?: string, cycle?: string): string {
  if (type === 'subscription') return `MeAndYou ${capitalize(plan ?? '')} — ${cycleLabel(cycle ?? '')}`
  if (type === 'fichas') return 'MeAndYou — Recarga de Fichas'
  return 'MeAndYou — Camarote Black'
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function cycleLabel(cycle: string) {
  const map: Record<string, string> = {
    monthly: 'Mensal', quarterly: 'Trimestral',
    semiannual: 'Semestral', annual: 'Anual',
  }
  return map[cycle] ?? cycle
}
```

**Step 2: Testar manualmente**

Apos startar o dev (`npm run dev`), usar o curl ou aguardar o modal para testar.

**Step 3: Commit**

```bash
git add src/app/api/payments/create/route.ts
git commit -m "feat(payments): API route para criar pagamento PIX e cartao AbacatePay"
```

---

## Task 4: API route — GET /api/payments/status/[id]

Usada pelo frontend para polling do PIX (verifica se foi pago a cada 3s).

**Files:**
- Create: `src/app/api/payments/status/[id]/route.ts`

**Step 1: Escrever a rota**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })

    // Busca pagamento do banco (valida que pertence ao usuario)
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status, gateway_id, method, paid_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!payment) return NextResponse.json({ error: 'Pagamento nao encontrado' }, { status: 404 })

    // Se ja confirmado no banco, retorna direto
    if (payment.status === 'paid') {
      return NextResponse.json({ status: 'paid', paidAt: payment.paid_at })
    }

    // Se PIX, consulta AbacatePay
    if (payment.method === 'pix' && payment.gateway_id) {
      const resp = await fetch(
        `https://api.abacatepay.com/v1/pixQrCode/check?id=${payment.gateway_id}`,
        { headers: { 'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}` } }
      )
      const data = await resp.json()
      const abStatus = data.data?.status

      if (abStatus === 'PAID') {
        // Atualiza banco (o webhook fara a ativacao, mas marcamos como pago)
        await supabase
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', params.id)
        return NextResponse.json({ status: 'paid' })
      }

      if (abStatus === 'EXPIRED' || abStatus === 'CANCELLED') {
        await supabase.from('payments').update({ status: 'expired' }).eq('id', params.id)
        return NextResponse.json({ status: 'expired' })
      }
    }

    return NextResponse.json({ status: payment.status })
  } catch (err) {
    console.error('payments/status error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/payments/status/
git commit -m "feat(payments): API route para checar status do pagamento PIX"
```

---

## Task 5: API route — POST /api/webhooks/abacatepay

Recebe confirmacoes da AbacatePay e ativa o produto correspondente.

**Files:**
- Create: `src/app/api/webhooks/abacatepay/route.ts`

**Step 1: Escrever a rota**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Valida secret na URL
    const secret = req.nextUrl.searchParams.get('secret')
    if (secret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event, data } = body

    // So processa eventos de pagamento confirmado
    if (event !== 'billing.paid' && event !== 'pixQrCode.paid') {
      return NextResponse.json({ ok: true })
    }

    const gatewayId = data?.id
    if (!gatewayId) return NextResponse.json({ error: 'id ausente' }, { status: 400 })

    // Idempotencia — busca pagamento pelo gateway_id
    const { data: payment } = await supabase
      .from('payments')
      .select('id, user_id, type, status, metadata')
      .eq('gateway_id', gatewayId)
      .single()

    if (!payment) {
      // Pagamento nao encontrado — pode ser de outro produto, ignora
      return NextResponse.json({ ok: true })
    }

    if (payment.status === 'paid') {
      // Ja processado, responde 200 para AbacatePay nao retentar
      return NextResponse.json({ ok: true })
    }

    // Marca como pago
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)

    const meta = payment.metadata as Record<string, string>

    // Ativa produto conforme tipo
    if (payment.type === 'subscription') {
      await supabase.rpc('activate_subscription', {
        p_user_id: payment.user_id,
        p_plan: meta.plan,
        p_order_id: gatewayId,
      })

      // Ciclos em dias
      const cycleDays: Record<string, number> = {
        monthly: 30, quarterly: 90, semiannual: 180, annual: 365
      }
      const days = cycleDays[meta.cycle] ?? 30
      const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: payment.user_id,
          plan: meta.plan,
          status: 'active',
          cycle: meta.cycle,
          gateway_order_id: gatewayId,
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
        }, { onConflict: 'user_id' })

      // Recompensa indicacao se houver
      try {
        await supabase.rpc('reward_referral', { p_referred_id: payment.user_id })
      } catch { /* ignora se funcao nao existir */ }

    } else if (payment.type === 'fichas') {
      // Credita fichas — quantidade no metadata
      const quantidade = Number(meta.quantidade ?? 0)
      if (quantidade > 0) {
        await supabase.rpc('add_fichas', {
          p_user_id: payment.user_id,
          p_amount: quantidade,
        })
      }

    } else if (payment.type === 'camarote') {
      // Ativa acesso do resgatado por 30 dias
      const resgatadoId = meta.resgatado_id
      if (resgatadoId) {
        await supabase
          .from('profiles')
          .update({
            plan: 'black',
            camarote_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', resgatadoId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('webhook abacatepay error:', err)
    // Retorna 200 para AbacatePay nao retentar indefinidamente
    return NextResponse.json({ ok: true })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/webhooks/abacatepay/
git commit -m "feat(payments): webhook AbacatePay com ativacao de assinatura, fichas e camarote"
```

---

## Task 6: Componente CheckoutModal

Modal reutilizavel com stepper de 4 passos.

**Files:**
- Create: `src/components/CheckoutModal.tsx`

**Step 1: Escrever o componente (parte 1 — tipos e helpers)**

```typescript
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
  plan?: string          // 'essencial' | 'plus' | 'black' (so subscription)
  amountCents?: number   // so fichas e camarote
  description?: string   // titulo do produto
  metadata?: Record<string, string> // dados extras (ex: resgatado_id para camarote)
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
```

**Step 2: Escrever o componente (parte 2 — render)**

Continua no mesmo arquivo:

```typescript
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
  const [pixData, setPixData] = useState<{ brCode: string; brCodeBase64: string; expiresAt: string } | null>(null)
  const [billingUrl, setBillingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15min em segundos

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
      } catch { if (active) setTimeout(poll, 3000) }
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
        type, method: selectedMethod,
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
      if (!json.ok) { setError(json.error ?? 'Erro ao iniciar pagamento'); setLoading(false); return }

      setPaymentId(json.paymentId)
      if (selectedMethod === 'pix') {
        setPixData({ brCode: json.brCode, brCodeBase64: json.brCodeBase64, expiresAt: json.expiresAt })
      } else {
        setBillingUrl(json.billingUrl)
      }
      setStep(3)
    } catch { setError('Erro de conexao. Tente novamente.') }
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

  const formatTimer = () => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
    const s = (timeLeft % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const currentAmount = isSubscription && plan
    ? calcPrice(plan, cycle)
    : (amountCents ?? 0) / 100

  if (!open) return null

  // Backdrop
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
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
            {description ?? (isSubscription ? `Plano ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''}` : type === 'fichas' ? 'Recarga de Fichas' : 'Camarote Black')}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,249,250,0.5)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <StepperBar step={step} isSubscription={isSubscription} />

        {/* Conteudo */}
        <div style={{ padding: '0 20px 24px' }}>
          {step === 1 && isSubscription && plan && (
            <StepCycle
              plan={plan} cycle={cycle} setCycle={setCycle}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepMethod
              loading={loading} error={error}
              amount={currentAmount}
              onSelect={handleMethodSelect}
            />
          )}
          {step === 3 && method === 'pix' && pixData && (
            <StepPix
              pixData={pixData} timeLeft={timeLeft} copied={copied}
              onCopy={copyPix}
            />
          )}
          {step === 3 && method === 'credit_card' && billingUrl && (
            <StepCard billingUrl={billingUrl} />
          )}
          {step === 4 && (
            <StepSuccess
              type={type} plan={plan} cycle={cycle}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sub-componentes ---

function StepperBar({ step, isSubscription }: { step: number; isSubscription: boolean }) {
  const steps = isSubscription ? ['Ciclo', 'Pagamento', 'Dados', 'Confirmacao'] : ['Pagamento', 'Dados', 'Confirmacao']
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
            <p style={{ margin: '4px 0 0', fontSize: 10, color: active ? '#F8F9FA' : 'rgba(248,249,250,0.35)', textAlign: 'center', fontFamily: 'var(--font-jakarta)' }}>
              {label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function StepCycle({ plan, cycle, setCycle, onNext }: { plan: string; cycle: PaymentCycle; setCycle: (c: PaymentCycle) => void; onNext: () => void }) {
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
            <button key={opt.value} onClick={() => setCycle(opt.value as PaymentCycle)} style={{
              background: selected ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected ? '#E11D48' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
                  {opt.label}
                </span>
                {opt.badge && (
                  <span style={{ fontSize: 10, background: '#E11D48', color: '#fff', borderRadius: 100, padding: '2px 7px', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
                    {opt.badge}
                  </span>
                )}
                {opt.discount > 0 && !opt.badge && (
                  <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 100, padding: '2px 7px', fontFamily: 'var(--font-jakarta)' }}>
                    -{opt.discount}%
                  </span>
                )}
              </div>
              <span style={{ fontSize: 14, color: selected ? '#E11D48' : '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 700 }}>
                {formatBRL(price)}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(248,249,250,0.5)' }}>{opt.suffix}</span>
              </span>
            </button>
          )
        })}
      </div>
      <button onClick={onNext} style={{
        marginTop: 16, width: '100%', padding: '14px', borderRadius: 12,
        background: '#E11D48', border: 'none', color: '#fff', cursor: 'pointer',
        fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
      }}>
        Continuar
      </button>
    </div>
  )
}

function StepMethod({ loading, error, amount, onSelect }: { loading: boolean; error: string | null; amount: number; onSelect: (m: 'pix' | 'credit_card') => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
        Como pagar?
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>
        Total: <strong style={{ color: '#F8F9FA' }}>{formatBRL(amount)}</strong>
      </p>
      {error && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#F43F5E', fontFamily: 'var(--font-jakarta)' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button disabled={loading} onClick={() => onSelect('pix')} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12, padding: '16px', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, opacity: loading ? 0.5 : 1,
        }}>
          <Smartphone size={20} color="#10b981" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#F8F9FA', fontWeight: 600, fontFamily: 'var(--font-jakarta)' }}>PIX</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>Aprovacao imediata</p>
          </div>
        </button>
        <button disabled={loading} onClick={() => onSelect('credit_card')} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12, padding: '16px', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, opacity: loading ? 0.5 : 1,
        }}>
          <CreditCard size={20} color="#F8F9FA" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#F8F9FA', fontWeight: 600, fontFamily: 'var(--font-jakarta)' }}>Cartao de credito</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>Visa, Mastercard e outros</p>
          </div>
        </button>
      </div>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Loader2 size={20} color="#E11D48" style={{ animation: 'spin 1s linear infinite' } as CSSProperties} />
        </div>
      )}
    </div>
  )
}

function StepPix({ pixData, timeLeft, copied, onCopy }: { pixData: { brCode: string; brCodeBase64: string }; timeLeft: number; copied: boolean; onCopy: () => void }) {
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
          style={{ width: 180, height: 180, margin: '0 auto 16px', display: 'block', borderRadius: 8, background: '#fff', padding: 8 }}
        />
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12,
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, overflow: 'hidden',
      }}>
        <p style={{ flex: 1, margin: 0, padding: '10px 12px', fontSize: 11, color: 'rgba(248,249,250,0.5)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pixData.brCode}
        </p>
        <button onClick={onCopy} style={{
          background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
          border: 'none', borderLeft: '1px solid rgba(255,255,255,0.10)',
          padding: '10px 14px', cursor: 'pointer', color: copied ? '#10b981' : '#F8F9FA',
        }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#E11D48', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
        Expira em {m}:{s}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        <Loader2 size={14} color="rgba(248,249,250,0.4)" style={{ animation: 'spin 1s linear infinite' } as CSSProperties} />
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

function StepSuccess({ type, plan, cycle, onClose }: { type: string; plan?: string; cycle?: string; onClose: () => void }) {
  const label = type === 'subscription'
    ? `Plano ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} ativado!`
    : type === 'fichas' ? 'Fichas creditadas!' : 'Acesso ao Camarote ativado!'
  const sub = type === 'subscription' && cycle
    ? { monthly: 'Renovacao mensal automatica.', quarterly: 'Acesso por 3 meses.', semiannual: 'Acesso por 6 meses.', annual: 'Acesso por 12 meses.' }[cycle]
    : ''
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Check size={24} color="#10b981" />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
        Pagamento confirmado!
      </h3>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#F8F9FA', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
        {label}
      </p>
      {sub && <p style={{ margin: '0 0 20px', fontSize: 12, color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-jakarta)' }}>{sub}</p>}
      <button onClick={onClose} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        background: '#E11D48', border: 'none', color: '#fff', cursor: 'pointer',
        fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
      }}>
        Continuar
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/CheckoutModal.tsx
git commit -m "feat(payments): componente CheckoutModal com stepper PIX e cartao"
```

---

## Task 7: Atualizar pagina /planos

Substituir links `checkoutUrl` pelo `CheckoutModal`.

**Files:**
- Modify: `src/app/planos/page.tsx`

**Step 1: Ler o arquivo atual primeiro**

```bash
# Verificar imports e onde handleCheckout eh chamada
grep -n "handleCheckout\|checkoutUrl\|import" src/app/planos/page.tsx | head -30
```

**Step 2: Adicionar import e state no topo**

Adicionar ao bloco de imports:
```typescript
import CheckoutModal, { CheckoutType } from '@/components/CheckoutModal'
```

Adicionar dentro do componente `PlanosPage`, junto com os outros states:
```typescript
const [checkoutOpen, setCheckoutOpen] = useState(false)
const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)
```

**Step 3: Substituir a funcao handleCheckout**

Localizar a funcao existente `handleCheckout` e substituir por:
```typescript
function handleCheckout(plan: typeof PLANS[0]) {
  setCheckoutPlan(plan.id)
  setCheckoutOpen(true)
}
```

**Step 4: Adicionar o modal no JSX**

Antes do fechamento do return, adicionar:
```tsx
{checkoutOpen && checkoutPlan && (
  <CheckoutModal
    open={checkoutOpen}
    onClose={() => { setCheckoutOpen(false); setCheckoutPlan(null) }}
    type="subscription"
    plan={checkoutPlan}
  />
)}
```

**Step 5: Commit**

```bash
git add src/app/planos/page.tsx
git commit -m "feat(payments): pagina de planos abre CheckoutModal"
```

---

## Task 8: Atualizar /minha-assinatura

Renomear referencias a `cakto_order_id`.

**Files:**
- Modify: `src/app/minha-assinatura/page.tsx`

**Step 1: Substituir todas as referencias**

```bash
# Ver quantas ocorrencias existem
grep -n "cakto_order_id" src/app/minha-assinatura/page.tsx
```

Substituir no tipo `Subscription`:
```typescript
// DE:
cakto_order_id: string
// PARA:
gateway_order_id: string
```

Substituir no JSX (exibicao do numero do pedido):
```typescript
// DE:
{active.cakto_order_id && ...{active.cakto_order_id}...}
// PARA:
{active.gateway_order_id && ...{active.gateway_order_id}...}
```

Idem para o historico de assinaturas onde aparece `s.cakto_order_id`.

**Step 2: Commit**

```bash
git add src/app/minha-assinatura/page.tsx
git commit -m "fix(payments): renomear cakto_order_id para gateway_order_id"
```

---

## Task 9: Atualizar webhook cakto (arquivo legado)

O arquivo antigo pode ser mantido como stub ou removido.

**Files:**
- Modify: `src/app/api/webhooks/cakto/route.ts`

**Step 1: O arquivo ja eh um stub**

O arquivo ja existe como stub vazio. Nao precisa de alteracao — o novo webhook esta em `/api/webhooks/abacatepay/route.ts`. Pode deixar o arquivo legado como esta.

---

## Task 10: Atualizar cancelamento de assinatura

Implementar chamada a AbacatePay para parar recorrencia.

**Files:**
- Modify: `src/app/api/assinatura/cancelar/route.ts`

**Step 1: Adicionar chamada a AbacatePay**

Localizar o comentario `TODO: chamar API do novo gateway` e substituir a logica por:

```typescript
// Cancela recorrencia na AbacatePay (se tiver gateway_order_id)
const { data: subData } = await supabase
  .from('subscriptions')
  .select('gateway_order_id')
  .eq('id', subscription_id)
  .single()

if (subData?.gateway_order_id) {
  try {
    // AbacatePay v1 nao tem endpoint de cancelamento documentado
    // Registrar para cancelamento manual via admin
    console.log(`Cancelar recorrencia AbacatePay: ${subData.gateway_order_id}`)
  } catch (e) {
    console.error('Erro ao notificar AbacatePay:', e)
    // Nao bloqueia o cancelamento no banco
  }
}
```

Nota: A API v1 da AbacatePay nao documenta endpoint de cancelamento de assinatura recorrente. O cancelamento no banco sera feito normalmente (acesso continua ate ends_at). Para cancelamento da recorrencia, verificar se a v2 ou suporte da AbacatePay oferece endpoint.

**Step 2: Commit**

```bash
git add src/app/api/assinatura/cancelar/route.ts
git commit -m "fix(payments): cancelamento registra gateway_order_id para admin"
```

---

## Task 11: Recarga de fichas na loja

Abrir CheckoutModal ao comprar fichas.

**Files:**
- Modify: `src/app/loja/page.tsx`

**Step 1: Verificar como a loja funciona hoje**

```bash
grep -n "Comprar\|comprar\|StoreBottomSheet\|ticket\|ficha" src/app/loja/page.tsx | head -20
```

**Step 2: Adicionar CheckoutModal**

Adicionar import e state:
```typescript
import CheckoutModal from '@/components/CheckoutModal'
// state:
const [checkoutOpen, setCheckoutOpen] = useState(false)
const [checkoutAmount, setCheckoutAmount] = useState(0)
const [checkoutQtd, setCheckoutQtd] = useState(0)
```

Substituir o handler de compra de fichas para abrir o modal:
```typescript
function handleComprarFichas(amountCents: number, quantidade: number) {
  setCheckoutAmount(amountCents)
  setCheckoutQtd(quantidade)
  setCheckoutOpen(true)
}
```

Adicionar modal no JSX:
```tsx
{checkoutOpen && (
  <CheckoutModal
    open={checkoutOpen}
    onClose={() => setCheckoutOpen(false)}
    type="fichas"
    amountCents={checkoutAmount}
    description={`${checkoutQtd} Fichas`}
    metadata={{ quantidade: String(checkoutQtd) }}
  />
)}
```

**Step 3: Commit**

```bash
git add src/app/loja/page.tsx
git commit -m "feat(payments): loja abre CheckoutModal para compra de fichas"
```

---

## Task 12: Verificacao final e deploy

**Step 1: Checar build**

```bash
npm run build
```

Corrigir qualquer erro de TypeScript antes de continuar.

**Step 2: Verificar variaveis no Vercel**

Confirmar que `ABACATEPAY_API_KEY` e `ABACATEPAY_WEBHOOK_SECRET` estao no Vercel Dashboard > Settings > Environment Variables.

**Step 3: Testar fluxo PIX em dev**

1. Iniciar `npm run dev`
2. Ir em `/planos`
3. Clicar em um plano
4. Selecionar ciclo Mensal, clicar Continuar
5. Selecionar PIX
6. Verificar se QR code aparece
7. Em dev, usar o endpoint de simulacao: `POST https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=<id>`
8. Verificar se modal avanca para Confirmacao

**Step 4: Commit final e push**

```bash
git add -A
git commit -m "feat(payments): integracao AbacatePay completa — PIX, cartao, webhook"
git push
```

---

## Notas importantes

- **CPF:** O campo `cpf` em `profiles` pode nao existir. Se nao existir, usar `00000000000` como placeholder e adicionar campo CPF ao perfil em tarefa futura.
- **add_fichas RPC:** Verificar se a RPC `add_fichas` existe no Supabase. Se nao existir, criar com `UPDATE profiles SET fichas = fichas + p_amount WHERE id = p_user_id`.
- **Camarote Black:** A coluna `camarote_expires_at` em `profiles` pode nao existir. Verificar e adicionar via SQL se necessario: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS camarote_expires_at timestamptz`.
- **Iframe cartao:** Alguns browsers podem bloquear iframe com X-Frame-Options. Se isso ocorrer, substituir o iframe por um link que abre em nova aba: `window.open(billingUrl, '_blank')`.

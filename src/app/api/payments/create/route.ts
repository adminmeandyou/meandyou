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

// Preco fixo do camarote em centavos
const CAMAROTE_PRICE_CENTS = 4990

// Pacotes de fichas: package_id -> { cents, quantidade }
const FICHAS_PACKAGES: Record<string, { cents: number; quantidade: number }> = {
  fichas_50:       { cents: 597,   quantidade: 50   },
  fichas_150:      { cents: 1497,  quantidade: 150  },
  fichas_400:      { cents: 3497,  quantidade: 400  },
  fichas_900:      { cents: 5997,  quantidade: 900  },
  pacote_lendario: { cents: 17997, quantidade: calcPacoteLendarioFichas() },
}

function calcPacoteLendarioFichas(): number {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth()
  const bonusOpcoes = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]
  const bonus = bonusOpcoes[((day * 13) + (month * 7)) % bonusOpcoes.length]
  return Math.round(2700 * (1 + bonus / 100) / 100) * 100
}

export async function POST(req: NextRequest) {
  try {
    // Autenticacao
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })

    const body = await req.json()
    const { type, method, plan, cycle = 'monthly', package_id, resgatado_id } = body

    // Valida inputs basicos
    if (!type || !method) return NextResponse.json({ error: 'type e method sao obrigatorios' }, { status: 400 })
    if (!['subscription', 'fichas', 'camarote'].includes(type)) return NextResponse.json({ error: 'type invalido' }, { status: 400 })
    if (!['pix', 'credit_card'].includes(method)) return NextResponse.json({ error: 'method invalido' }, { status: 400 })

    // Calcula valor
    let amountCents: number
    if (type === 'subscription') {
      amountCents = PRICES[plan]?.[cycle]
      if (!amountCents) return NextResponse.json({ error: 'Plano/ciclo invalido' }, { status: 400 })
    } else if (type === 'fichas') {
      if (!package_id || !FICHAS_PACKAGES[package_id]) {
        return NextResponse.json({ error: 'package_id invalido' }, { status: 400 })
      }
      amountCents = FICHAS_PACKAGES[package_id].cents
    } else if (type === 'camarote') {
      amountCents = CAMAROTE_PRICE_CENTS
    } else {
      return NextResponse.json({ error: 'type invalido' }, { status: 400 })
    }

    // Busca dados do usuario para AbacatePay
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, cpf, phone')
      .eq('id', user.id)
      .single()

    const customerName = profile?.display_name ?? 'Usuario'

    let gatewayId: string
    let responseData: Record<string, unknown>

    if (method === 'pix') {
      const pixResp = await fetch(`${ABACATE_BASE}/pixQrCode/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ABACATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountCents,
          expiresIn: 900,
          description: buildDescription(type, plan, cycle),
          customer: {
            name: customerName,
            email: user.email,
            cellphone: profile?.phone ?? '00000000000',
            taxId: profile?.cpf ?? '00000000000',
          },
          metadata: { user_id: user.id, type, plan, cycle },
        }),
      })

      const pixData = await pixResp.json()
      if (!pixData.data?.id) {
        console.error('AbacatePay PIX error:', pixData?.error ?? pixData?.message ?? 'unknown')
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
            cellphone: profile?.phone ?? '00000000000',
            taxId: profile?.cpf ?? '00000000000',
          },
          externalId: `${user.id}_${Date.now()}`,
          metadata: { user_id: user.id, type, plan, cycle },
        }),
      })

      const billingData = await billingResp.json()
      if (!billingData.data?.id) {
        console.error('AbacatePay billing error:', billingData?.error ?? billingData?.message ?? 'unknown')
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
      metadata: {
        ...(plan ? { plan } : {}),
        ...(cycle ? { cycle } : {}),
        ...(type === 'fichas' && package_id ? { quantidade: String(FICHAS_PACKAGES[package_id].quantidade) } : {}),
        ...(resgatado_id ? { resgatado_id } : {}),
      },
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
  if (type === 'subscription') return `MeAndYou ${capitalize(plan ?? '')} - ${cycleLabel(cycle ?? '')}`
  if (type === 'fichas') return 'MeAndYou - Recarga de Fichas'
  return 'MeAndYou - Camarote Black'
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function cycleLabel(cycle: string) {
  const map: Record<string, string> = {
    monthly: 'Mensal', quarterly: 'Trimestral',
    semiannual: 'Semestral', annual: 'Anual',
  }
  return map[cycle] ?? cycle
}

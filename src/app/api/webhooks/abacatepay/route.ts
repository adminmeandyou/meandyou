import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CYCLE_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, semiannual: 180, annual: 365,
}

// Pacotes de fichas: preco em centavos -> quantidade (deve coincidir com payments/create)
const FICHAS_PACKAGES: Record<number, number> = {
  597:  50,
  1497: 150,
  3497: 400,
  5997: 900,
}

function calcPacoteLendarioFichas(): number {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth()
  const bonusOpcoes = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]
  const bonus = bonusOpcoes[((day * 13) + (month * 7)) % bonusOpcoes.length]
  return Math.round(2700 * (1 + bonus / 100) / 100) * 100
}

function fichasFromAmount(amountReais: number): number {
  const cents = Math.round(amountReais * 100)
  if (cents === 17997) return calcPacoteLendarioFichas()
  return FICHAS_PACKAGES[cents] ?? 0
}

export async function POST(req: NextRequest) {
  try {
    // Valida secret na URL (timing-safe para evitar timing attacks)
    const secret = req.nextUrl.searchParams.get('secret') ?? ''
    const expected = process.env.ABACATEPAY_WEBHOOK_SECRET ?? ''
    const secretBuf = Buffer.from(secret)
    const expectedBuf = Buffer.from(expected)
    if (!expected || secretBuf.byteLength !== expectedBuf.byteLength || !timingSafeEqual(secretBuf, expectedBuf)) {
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
      .select('id, user_id, type, status, amount, metadata')
      .eq('gateway_id', gatewayId)
      .single()

    if (!payment) {
      // Pagamento nao encontrado — pode ser de outro produto, ignora
      return NextResponse.json({ ok: true })
    }

    // Claim atomico: so processa se conseguir mudar de 'pending' para 'paid'
    const { data: claimed } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!claimed) {
      // Outro processo ja processou este webhook
      return NextResponse.json({ ok: true })
    }

    const meta = (payment.metadata ?? {}) as Record<string, string>

    if (payment.type === 'subscription') {
      // Ativa plano via RPC
      try {
        await supabase.rpc('activate_subscription', {
          p_user_id: payment.user_id,
          p_plan: meta.plan,
          p_order_id: gatewayId,
        })
      } catch (e) {
        console.error('activate_subscription error:', e)
      }

      // Upsert na tabela subscriptions
      const days = CYCLE_DAYS[meta.cycle] ?? 30
      const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      try {
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: payment.user_id,
            plan: meta.plan,
            status: 'active',
            cycle: meta.cycle ?? 'monthly',
            gateway_order_id: gatewayId,
            starts_at: new Date().toISOString(),
            ends_at: endsAt,
          }, { onConflict: 'user_id' })
      } catch (e) {
        console.error('subscriptions upsert error:', e)
      }

      // Recompensa indicacao se houver
      try {
        await supabase.rpc('reward_referral', { p_referred_id: payment.user_id })
      } catch { /* ignora se RPC nao existir */ }

    } else if (payment.type === 'fichas') {
      const quantidade = fichasFromAmount(Number(payment.amount))
      if (quantidade > 0) {
        try {
          await supabase.rpc('add_fichas', {
            p_user_id: payment.user_id,
            p_amount: quantidade,
          })
        } catch (e) {
          console.error('add_fichas error — creditar manualmente para user', payment.user_id, ':', e)
        }
      }

    } else if (payment.type === 'camarote') {
      const resgatadoId = meta.resgatado_id
      if (!resgatadoId) {
        console.error('camarote sem resgatado_id no metadata, payment id:', payment.id)
      }
      if (resgatadoId) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const { error: camaroteErr } = await supabase
          .from('profiles')
          .update({ camarote_expires_at: expiresAt })
          .eq('id', resgatadoId)
        if (camaroteErr) {
          console.error('camarote update error:', camaroteErr.message)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('webhook abacatepay error:', err)
    // Retorna 200 para AbacatePay nao retentar indefinidamente em erros do nosso lado
    return NextResponse.json({ ok: true })
  }
}

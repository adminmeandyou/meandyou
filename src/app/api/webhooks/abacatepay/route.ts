import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CYCLE_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, semiannual: 180, annual: 365,
}

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
      // Ja processado — idempotencia
      return NextResponse.json({ ok: true })
    }

    // Marca como pago
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)

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

      // Recompensa indicacao se houver
      try {
        await supabase.rpc('reward_referral', { p_referred_id: payment.user_id })
      } catch { /* ignora se RPC nao existir */ }

    } else if (payment.type === 'fichas') {
      const quantidade = Number(meta.quantidade ?? 0)
      if (quantidade > 0) {
        try {
          await supabase.rpc('add_fichas', {
            p_user_id: payment.user_id,
            p_amount: quantidade,
          })
        } catch (e) {
          console.error('add_fichas error:', e)
          // Fallback: update direto na tabela profiles
          await supabase.rpc('increment_fichas', { p_user_id: payment.user_id, p_qty: quantidade })
            .catch(() => console.error('increment_fichas fallback tambem falhou'))
        }
      }

    } else if (payment.type === 'camarote') {
      const resgatadoId = meta.resgatado_id
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

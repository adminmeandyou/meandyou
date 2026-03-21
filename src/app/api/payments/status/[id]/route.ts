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

    // Busca pagamento (valida que pertence ao usuario)
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

    if (payment.status === 'expired' || payment.status === 'failed') {
      return NextResponse.json({ status: payment.status })
    }

    // Se PIX pendente, consulta AbacatePay
    if (payment.method === 'pix' && payment.gateway_id) {
      const resp = await fetch(
        `https://api.abacatepay.com/v1/pixQrCode/check?id=${payment.gateway_id}`,
        { headers: { 'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}` } }
      )
      const data = await resp.json()
      const abStatus = data.data?.status

      if (abStatus === 'PAID') {
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

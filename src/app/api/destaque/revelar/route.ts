import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createServerClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { target_id } = await req.json()
    if (typeof target_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(target_id)) {
      return NextResponse.json({ error: 'target_id invalido' }, { status: 400 })
    }

    // Desconta 1 lupa com compare-and-swap (antes chamava a RPC use_lupa, que não existe
    // no banco — o botão "Revelar" sempre dava erro 500).
    const supabaseAdmin = createAdminClient()
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const { data: saldo } = await supabaseAdmin
        .from('user_lupas')
        .select('amount')
        .eq('user_id', user.id)
        .maybeSingle()
      const atual = saldo?.amount ?? 0
      if (atual <= 0) {
        return NextResponse.json({ error: 'Sem lupas disponíveis' }, { status: 402 })
      }
      const { data: atualizado, error } = await supabaseAdmin
        .from('user_lupas')
        .update({ amount: atual - 1 })
        .eq('user_id', user.id)
        .eq('amount', atual)
        .select('amount')
      if (error) {
        console.error('[destaque/revelar] erro ao descontar lupa:', error)
        return NextResponse.json({ error: 'Erro ao revelar' }, { status: 500 })
      }
      if (atualizado && atualizado.length > 0) {
        return NextResponse.json({ ok: true, lupas: atualizado[0].amount })
      }
      // outro pedido mudou o saldo no meio — tenta de novo com o valor novo
    }
    return NextResponse.json({ error: 'Tente novamente' }, { status: 409 })
  } catch (err) {
    console.error('[destaque/revelar] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

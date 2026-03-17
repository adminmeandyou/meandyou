import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Valida sessão
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const { subscription_id } = await req.json()
    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id obrigatório' }, { status: 400 })
    }

    // Verifica que a assinatura pertence ao usuário e está ativa
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, status, user_id')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single()

    if (subErr || !sub) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    if (sub.status !== 'active') {
      return NextResponse.json({ error: 'Assinatura não está ativa' }, { status: 400 })
    }

    // TODO: chamar API da Cakto para parar a recorrência antes de atualizar o banco.
    // Sem isso, o usuário cancela no app mas pode ser cobrado no próximo ciclo.
    // Verificar com suporte Cakto o endpoint de cancelamento de recorrência.
    console.warn(`Cancelamento de assinatura ${subscription_id} — integração Cakto pendente, recorrência pode continuar`)

    // Cancela no banco — acesso continua até ends_at; pg_cron faz o downgrade ao expirar
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription_id)

    if (updateErr) {
      console.error('Erro ao cancelar assinatura:', updateErr)
      return NextResponse.json({ error: 'Erro ao cancelar' }, { status: 500 })
    }

    // Cria solicitação de cancelamento para processamento manual no admin
    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, ends_at')
        .eq('id', subscription_id)
        .single()

      await supabase.from('cancellation_requests').insert({
        user_id: user.id,
        subscription_id,
        plan: subData?.plan ?? 'desconhecido',
        status: 'pending',
      })
    } catch (e) {
      console.error('Erro ao registrar cancelamento:', e)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Cancelar assinatura error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

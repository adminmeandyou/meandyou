// src/app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — salvar subscription de Web Push do dispositivo
export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { endpoint, p256dh, auth } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Dados de subscription inválidos' }, { status: 400 })
    }

    // Upsert — mesmo dispositivo não duplica
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_id:  user.id,
          endpoint,
          p256dh,
          auth,
        },
        { onConflict: 'endpoint' }
      )

    if (error) {
      console.error('Erro ao salvar subscription push:', error)
      return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erro em push/subscribe:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remover subscription (usuário desativou notificações)
export async function DELETE(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { endpoint } = await req.json()

    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erro em push/subscribe DELETE:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

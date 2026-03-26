import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarPushParaUsuario } from '@/lib/push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    const { toUserId } = await req.json()
    if (!toUserId) return NextResponse.json({ error: 'toUserId obrigatório' }, { status: 400 })

    const { data: fromProfile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const fromName = fromProfile?.name ?? 'Alguem'

    await enviarPushParaUsuario({
      targetUserId: toUserId,
      type: 'superlike',
      title: 'Voce recebeu um SuperLike!',
      body: `${fromName} te deu um SuperLike. Que tal dar uma olhada?`,
      fromUserId: user.id,
      data: { fromUserId: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em superlike-notify:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

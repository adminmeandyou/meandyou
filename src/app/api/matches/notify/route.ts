// src/app/api/matches/notify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewMatchEmail } from '@/app/lib/email'
import { enviarPushParaUsuario } from '@/app/api/push/send/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — disparado pelo frontend após detectar match
// Body: { fromUserId, toUserId }
// Auth: Bearer <access_token> do usuário autenticado
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { fromUserId, toUserId } = await req.json()
    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Garante que o chamador é o fromUser
    if (user.id !== fromUserId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar dados de ambos em paralelo
    const [fromAuthRes, toAuthRes, fromProfileRes, toProfileRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(fromUserId),
      supabaseAdmin.auth.admin.getUserById(toUserId),
      supabaseAdmin.from('profiles').select('name').eq('id', fromUserId).single(),
      supabaseAdmin.from('profiles').select('name').eq('id', toUserId).single(),
    ])

    const fromEmail = fromAuthRes.data.user?.email
    const toEmail   = toAuthRes.data.user?.email
    const fromName  = fromProfileRes.data?.name ?? 'Alguém'
    const toName    = toProfileRes.data?.name   ?? 'Alguém'

    // E-mails para ambos
    await Promise.allSettled([
      fromEmail ? sendNewMatchEmail(fromEmail, fromName, toName) : Promise.resolve(),
      toEmail   ? sendNewMatchEmail(toEmail,   toName,  fromName) : Promise.resolve(),
    ])

    // Push + notificação no banco para ambos
    await Promise.allSettled([
      enviarPushParaUsuario({
        targetUserId: fromUserId,
        type:         'match',
        title:        'É um Match! 🎉',
        body:         `Você e ${toName} se curtiram. Inicie a conversa!`,
        fromUserId:   toUserId,
      }),
      enviarPushParaUsuario({
        targetUserId: toUserId,
        type:         'match',
        title:        'É um Match! 🎉',
        body:         `Você e ${fromName} se curtiram. Inicie a conversa!`,
        fromUserId:   fromUserId,
      }),
    ])

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erro em matches/notify:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

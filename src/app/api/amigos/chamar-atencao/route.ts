// src/app/api/amigos/chamar-atencao/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Limite: 1 chamada por amizade por hora
const COOLDOWN_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { friendshipId } = await req.json()
  if (!friendshipId) return NextResponse.json({ error: 'friendshipId obrigatório' }, { status: 400 })

  const { data: friendship } = await supabaseAdmin
    .from('friendships')
    .select('id, requester_id, receiver_id, status')
    .eq('id', friendshipId)
    .single()

  if (!friendship || friendship.status !== 'accepted') {
    return NextResponse.json({ error: 'Amizade não encontrada' }, { status: 404 })
  }
  if (friendship.requester_id !== user.id && friendship.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const otherId = friendship.requester_id === user.id ? friendship.receiver_id : friendship.requester_id

  // Checar cooldown: última notificação de nudge dessa amizade nos últimos 60min
  const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString()
  const { data: recent } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', otherId)
    .eq('from_user_id', user.id)
    .eq('type', 'friend_nudge')
    .gte('created_at', cutoff)
    .limit(1)

  if (recent && recent.length > 0) {
    return NextResponse.json({ error: 'Aguarde 1 hora para chamar a atenção novamente' }, { status: 429 })
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('name').eq('id', user.id).single()
  const nome = profile?.name ?? 'Seu amigo'

  // Notificação no banco
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: otherId,
      from_user_id: user.id,
      type: 'friend_nudge',
      read: false,
      data: { friendship_id: friendshipId, url: `/amigos/chat/${friendshipId}` },
    })
  } catch { /* silencioso */ }

  // Push
  try {
    const { enviarPushParaUsuario } = await import('@/lib/push')
    await enviarPushParaUsuario({
      targetUserId: otherId,
      type: 'friend_nudge',
      title: `${nome} chamou sua atenção! 👋`,
      body: 'Toca aqui para responder',
      data: { url: `/amigos/chat/${friendshipId}` },
      fromUserId: user.id,
    })
  } catch { /* silencioso */ }

  return NextResponse.json({ ok: true })
}

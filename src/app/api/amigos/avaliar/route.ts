// src/app/api/amigos/avaliar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { friendshipId, rating, comment } = await req.json()
  if (!friendshipId || !rating) return NextResponse.json({ error: 'Parâmetros obrigatórios' }, { status: 400 })
  if (comment != null && (typeof comment !== 'string' || comment.length > 300)) {
    return NextResponse.json({ error: 'Comentário inválido (máx. 300 caracteres)' }, { status: 400 })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating deve ser 1-5' }, { status: 400 })

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

  // Upsert: cada usuário avalia uma amizade uma vez (pode atualizar)
  const { error } = await supabaseAdmin
    .from('friend_ratings')
    .upsert({
      friendship_id: friendshipId,
      rater_id: user.id,
      rated_id: otherId,
      rating,
      comment: comment?.trim() || null,
    }, { onConflict: 'friendship_id,rater_id' })

  if (error) return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

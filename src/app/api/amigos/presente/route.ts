// src/app/api/amigos/presente/route.ts
// Envia um item da loja para um amigo (debita do remetente, credita no destinatário)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type GiftType = 'supercurtida' | 'lupa' | 'ticket' | 'boost' | 'rewind'

const GIFT_TABLE: Record<GiftType, string> = {
  supercurtida: 'user_superlikes',
  lupa:         'user_lupas',
  ticket:       'user_tickets',
  boost:        'user_boosts',
  rewind:       'user_rewinds',
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { friendshipId, itemType, amount, message } = await req.json()

  if (!friendshipId || !itemType || !amount) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 })
  }
  if (!GIFT_TABLE[itemType as GiftType]) {
    return NextResponse.json({ error: 'Tipo de presente inválido' }, { status: 400 })
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 30) {
    return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 })
  }

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
  const table = GIFT_TABLE[itemType as GiftType]

  // Debitar do remetente com trava otimista: o update só pega se o saldo
  // ainda for o mesmo que lemos (evita gastar o mesmo saldo em requisições paralelas)
  const { data: senderBalance } = await supabaseAdmin
    .from(table)
    .select('amount')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!senderBalance || senderBalance.amount < amount) {
    return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
  }

  const { data: debited, error: debitErr } = await supabaseAdmin
    .from(table)
    .update({ amount: senderBalance.amount - amount })
    .eq('user_id', user.id)
    .eq('amount', senderBalance.amount)
    .select('user_id')

  if (debitErr) return NextResponse.json({ error: 'Erro ao debitar saldo' }, { status: 500 })
  if (!debited || debited.length === 0) {
    return NextResponse.json({ error: 'Saldo alterado, tente novamente' }, { status: 409 })
  }

  // Creditar no destinatário (RPC atômica: INSERT ... ON CONFLICT DO UPDATE)
  const { error: creditErr } = await supabaseAdmin.rpc('increment_user_balance', {
    p_table: table, p_user_id: otherId, p_amount: amount,
  })
  if (creditErr) {
    // Devolve ao remetente para não sumir com o saldo
    await supabaseAdmin.rpc('increment_user_balance', { p_table: table, p_user_id: user.id, p_amount: amount })
    return NextResponse.json({ error: 'Erro ao enviar presente' }, { status: 500 })
  }

  // Registrar presente
  const { data: senderProfile } = await supabaseAdmin.from('profiles').select('name').eq('id', user.id).single()
  const nome = senderProfile?.name ?? 'Seu amigo'

  try {
    await supabaseAdmin.from('friend_gifts').insert({
      friendship_id: friendshipId,
      sender_id: user.id,
      receiver_id: otherId,
      item_type: itemType,
      item_amount: amount,
      message: message?.trim() || null,
    })
  } catch { /* silencioso */ }

  // Notificação no banco
  const itemLabels: Record<string, string> = {
    supercurtida: 'SuperCurtida',
    lupa: 'Lupa',
    ticket: 'Ticket',
    boost: 'Boost',
    rewind: 'Desfazer Curtida',
  }
  const label = `${amount}x ${itemLabels[itemType] ?? itemType}`

  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: otherId,
      from_user_id: user.id,
      type: 'friend_gift',
      read: false,
      data: { friendship_id: friendshipId, item_type: itemType, amount, url: `/amigos/chat/${friendshipId}` },
    })
  } catch { /* silencioso */ }

  // Push
  try {
    const { enviarPushParaUsuario } = await import('@/lib/push')
    await enviarPushParaUsuario({
      targetUserId: otherId,
      type: 'friend_gift',
      title: `${nome} te enviou um presente! 🎁`,
      body: `Você ganhou ${label}`,
      data: { url: `/amigos/chat/${friendshipId}` },
      fromUserId: user.id,
    })
  } catch { /* silencioso */ }

  return NextResponse.json({ ok: true })
}

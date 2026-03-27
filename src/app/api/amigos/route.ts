// src/app/api/amigos/route.ts
// Sistema de amigos (M4)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/amigos — enviar pedido de amizade
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { receiverId } = await req.json()
  if (!receiverId) return NextResponse.json({ error: 'receiverId obrigatorio' }, { status: 400 })
  if (receiverId === user.id) return NextResponse.json({ error: 'Voce nao pode se adicionar' }, { status: 400 })

  // Verificar se ja existe pedido (em qualquer direcao)
  const { data: existing } = await supabaseAdmin
    .from('friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .single()

  if (existing) {
    if (existing.status === 'accepted') {
      return NextResponse.json({ error: 'Voces ja sao amigos' }, { status: 409 })
    }
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Pedido ja enviado' }, { status: 409 })
    }
  }

  const { error } = await supabaseAdmin
    .from('friendships')
    .insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' })

  if (error) return NextResponse.json({ error: 'Erro ao enviar pedido' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// PATCH /api/amigos — aceitar, recusar ou remover amizade
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { friendshipId, action } = await req.json()
  if (!friendshipId || !action) return NextResponse.json({ error: 'Params obrigatorios' }, { status: 400 })

  const { data: friendship } = await supabaseAdmin
    .from('friendships')
    .select('id, requester_id, receiver_id, status')
    .eq('id', friendshipId)
    .single()

  if (!friendship) return NextResponse.json({ error: 'Amizade nao encontrada' }, { status: 404 })

  if (action === 'accept') {
    if (friendship.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }
    await supabaseAdmin.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'decline') {
    if (friendship.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }
    await supabaseAdmin.from('friendships').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', friendshipId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'remove') {
    if (friendship.requester_id !== user.id && friendship.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }
    await supabaseAdmin.from('friendships').delete().eq('id', friendshipId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acao invalida' }, { status: 400 })
}

// GET /api/amigos — listar amigos e pedidos pendentes
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: friendships } = await supabaseAdmin
    .from('friendships')
    .select('id, requester_id, receiver_id, status, created_at, updated_at')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .neq('status', 'declined')
    .order('updated_at', { ascending: false })

  if (!friendships || friendships.length === 0) return NextResponse.json({ friends: [], pending: [] })

  // Coletar todos os IDs de amigos e buscar em uma unica query
  const otherIds = friendships.map(f =>
    f.requester_id === user.id ? f.receiver_id : f.requester_id
  )

  const { data: profiles } = await supabaseAdmin
    .from('public_profiles')
    .select('id, name, photo_best, city, plan, last_seen')
    .in('id', otherIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const enriched = friendships.map(f => {
    const otherId = f.requester_id === user.id ? f.receiver_id : f.requester_id
    return { ...f, other: profileMap.get(otherId) ?? null }
  })

  const friends = enriched.filter(f => f.status === 'accepted')
  const pending = enriched.filter(f => f.status === 'pending')

  return NextResponse.json({ friends, pending })
}

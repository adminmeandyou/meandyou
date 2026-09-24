// src/app/api/amigos/chat/[friendshipId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { moderateContent, getModerationMessage, containsSensitiveData } from '@/app/lib/moderation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET — listar mensagens da amizade (últimas 60, ordem cronológica)
export async function GET(req: NextRequest, { params }: { params: Promise<{ friendshipId: string }> }) {
  const { friendshipId } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verificar que o user faz parte dessa amizade
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

  // Mensagens dos últimos 30 dias em ordem cronológica
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: messages } = await supabaseAdmin
    .from('friend_messages')
    .select('id, sender_id, content, created_at')
    .eq('friendship_id', friendshipId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ messages: messages ?? [] })
}

// POST — enviar mensagem
export async function POST(req: NextRequest, { params }: { params: Promise<{ friendshipId: string }> }) {
  const { friendshipId } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { content } = await req.json()
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Máximo 500 caracteres' }, { status: 400 })
  }

  const mod = moderateContent(content.trim())
  if (mod.blocked) {
    if (mod.critical) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.meandyou.com.br'}/api/salas/alertar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palavras: mod.matchedWords, contexto: 'amigos', userId: user.id }),
      }).catch(() => {})
    }
    return NextResponse.json({ error: getModerationMessage(mod) }, { status: 422 })
  }
  if (containsSensitiveData(content)) {
    return NextResponse.json(
      { error: 'Por segurança, não compartilhe dados pessoais como CPF, cartão ou telefone no chat.' },
      { status: 422 }
    )
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

  const { data: msg, error } = await supabaseAdmin
    .from('friend_messages')
    .insert({ friendship_id: friendshipId, sender_id: user.id, content: content.trim() })
    .select('id, sender_id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })

  // Push para o outro
  const otherId = friendship.requester_id === user.id ? friendship.receiver_id : friendship.requester_id
  try {
    const { enviarPushParaUsuario } = await import('@/lib/push')
    const { data: profile } = await supabaseAdmin.from('profiles').select('name').eq('id', user.id).single()
    await enviarPushParaUsuario({
      targetUserId: otherId,
      type: 'friend_message',
      title: profile?.name ?? 'Amigo',
      body: content.trim().slice(0, 80),
      data: { url: `/amigos/chat/${friendshipId}` },
      fromUserId: user.id,
    })
  } catch { /* silencioso */ }

  return NextResponse.json({ ok: true, message: msg })
}

// src/app/api/salas/entrar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PREFIXOS = [
  'Morango', 'Queijo', 'Chocolate', 'Amendoim', 'Pipoca', 'Sorvete', 'Melao',
  'Abacate', 'Limao', 'Manga', 'Caju', 'Tigre', 'Leao', 'Panda', 'Lobo',
  'Raposa', 'Falcao', 'Aguia', 'Nuvem', 'Brisa', 'Estrela', 'Luna', 'Raio',
  'Coral', 'Cetim', 'Veludo', 'Safira', 'Rubi', 'Topazio', 'Ametista',
]
const SUFIXOS = Array.from({ length: 28 }, (_, i) => String(18 + i)) // 18-45

function generateNickname(): string {
  const pref = PREFIXOS[Math.floor(Math.random() * PREFIXOS.length)]
  const suf  = SUFIXOS[Math.floor(Math.random() * SUFIXOS.length)]
  return `${pref}${suf}`
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { roomId, nickname: customNickname } = await req.json()
  if (!roomId) return NextResponse.json({ error: 'roomId obrigatorio' }, { status: 400 })

  // Buscar sala
  const { data: room, error: roomErr } = await supabaseAdmin
    .from('chat_rooms')
    .select('id, name, type, max_members, is_active')
    .eq('id', roomId)
    .single()

  if (roomErr || !room) return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 })
  if (!room.is_active) return NextResponse.json({ error: 'Sala inativa' }, { status: 400 })

  // Buscar plano do usuario
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'essencial'

  // Verificar acesso por tipo de sala
  if (room.type === 'black' && plan !== 'black') {
    return NextResponse.json({ error: 'Sala exclusiva para plano Black' }, { status: 403 })
  }
  if ((room.type === 'public' || room.type === 'private') && plan === 'essencial') {
    return NextResponse.json({ error: 'Salas disponiveis a partir do plano Plus' }, { status: 403 })
  }

  // Verificar se ja esta na sala
  const { data: existing } = await supabaseAdmin
    .from('room_members')
    .select('nickname')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, nickname: existing.nickname, alreadyIn: true })
  }

  // Limpar membros fantasmas (sem heartbeat ha mais de 2 minutos)
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  await supabaseAdmin
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .lt('last_heartbeat', cutoff)

  // Verificar capacidade
  const { count } = await supabaseAdmin
    .from('room_members')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)

  if ((count ?? 0) >= room.max_members) {
    return NextResponse.json({ error: 'Sala cheia' }, { status: 409 })
  }

  // Gerar ou usar nickname
  const nickname = customNickname?.trim() || generateNickname()

  // Inserir membro com heartbeat inicial
  const { error: insertErr } = await supabaseAdmin
    .from('room_members')
    .insert({ room_id: roomId, user_id: user.id, nickname, last_heartbeat: new Date().toISOString() })

  if (insertErr) {
    return NextResponse.json({ error: 'Erro ao entrar na sala' }, { status: 500 })
  }

  // Mensagem de sistema
  try {
    await supabaseAdmin.from('room_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      nickname: 'Sistema',
      content: `${nickname} entrou na sala`,
      is_system: true,
    })
  } catch { /* silencioso */ }

  return NextResponse.json({ ok: true, nickname })
}

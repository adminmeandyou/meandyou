// src/app/api/salas/entrar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { awardBadges } from '@/lib/badges'

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

  // Verificar acesso por tipo de sala
  const { data: room, error: roomErr } = await supabaseAdmin
    .from('chat_rooms')
    .select('type, is_active')
    .eq('id', roomId)
    .single()

  if (roomErr || !room) return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 })
  if (!room.is_active) return NextResponse.json({ error: 'Sala inativa' }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'essencial'

  if (room.type === 'black' && plan !== 'black') {
    return NextResponse.json({ error: 'Sala exclusiva para plano Black' }, { status: 403 })
  }
  if ((room.type === 'public' || room.type === 'private') && plan === 'essencial') {
    return NextResponse.json({ error: 'Salas disponiveis a partir do plano Plus' }, { status: 403 })
  }

  const nickname = customNickname?.trim() || generateNickname()

  // Entrada atomica: lock de capacidade, limpeza de fantasmas e INSERT em uma unica transacao SQL.
  // Resolve race condition onde multiplos usuarios entram simultaneamente e ultrapassam max_members.
  const { data: result, error: rpcErr } = await supabaseAdmin.rpc('entrar_sala', {
    p_room_id:  roomId,
    p_user_id:  user.id,
    p_nickname: nickname,
  })

  if (rpcErr) {
    console.error('[salas/entrar] rpc error:', rpcErr)
    return NextResponse.json({ error: 'Erro ao entrar na sala' }, { status: 500 })
  }

  const res = result as { status: string; nickname?: string }

  if (res.status === 'sala_nao_encontrada') {
    return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 })
  }
  if (res.status === 'sala_cheia') {
    return NextResponse.json({ error: 'Sala cheia' }, { status: 409 })
  }
  if (res.status === 'ja_membro') {
    return NextResponse.json({ ok: true, nickname: res.nickname, alreadyIn: true })
  }

  // Mensagem de sistema
  try {
    await supabaseAdmin.from('room_messages').insert({
      room_id:   roomId,
      sender_id: user.id,
      nickname:  'Sistema',
      content:   `${res.nickname} entrou na sala`,
      is_system: true,
    })
  } catch { /* silencioso */ }

  // Verifica emblemas Social I-VI (salas únicas visitadas) — fire-and-forget
  awardBadges(user.id, 'sala_unique_gte').catch(() => {})

  return NextResponse.json({ ok: true, nickname: res.nickname })
}

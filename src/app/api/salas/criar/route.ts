// src/app/api/salas/criar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { moderateRoomName } from '@/app/lib/moderation'

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
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  // Verificar plano (Plus/Black para criar salas privadas)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'essencial'
  if (plan === 'essencial') {
    return NextResponse.json({ error: 'Apenas assinantes Plus ou Black podem criar salas' }, { status: 403 })
  }

  const { name, description, emoji, maxMembers } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 })
  if (name.trim().length > 40) return NextResponse.json({ error: 'Nome muito longo (max 40 chars)' }, { status: 400 })

  // Moderar nome
  const mod = moderateRoomName(name)
  if (mod.blocked) {
    return NextResponse.json({ error: 'Nome da sala contem conteudo nao permitido' }, { status: 422 })
  }

  const max = Math.min(Math.max(2, maxMembers ?? 10), 10) // 2-10 para salas privadas

  const { data: room, error } = await supabaseAdmin
    .from('chat_rooms')
    .insert({
      name: name.trim(),
      type: 'private',
      description: description?.trim() ?? null,
      emoji: emoji ?? '🔒',
      max_members: max,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !room) {
    return NextResponse.json({ error: 'Erro ao criar sala' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, roomId: room.id })
}

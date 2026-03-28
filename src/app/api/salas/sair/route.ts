// src/app/api/salas/sair/route.ts
// Chamado via sendBeacon ao fechar aba ou navegar fora da sala
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { roomId, userId, nickname } = await req.json()
    if (!roomId || !userId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se ainda e membro (evita duplicar mensagem se ja saiu)
    const { data: member } = await supabaseAdmin
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return NextResponse.json({ ok: true, alreadyLeft: true })
    }

    // Mensagem de sistema
    if (nickname) {
      await supabaseAdmin.from('room_messages').insert({
        room_id: roomId,
        sender_id: userId,
        nickname: 'Sistema',
        content: `${nickname} saiu da sala`,
        is_system: true,
      })
    }

    // Remover membro
    await supabaseAdmin
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

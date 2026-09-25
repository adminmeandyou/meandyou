// src/app/api/salas/sair/route.ts
// Chamado via sendBeacon ao fechar aba ou navegar fora da sala
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Usuário vem da sessão (sendBeacon envia os cookies) — antes vinha do body e
    // qualquer um podia tirar outra pessoa da sala e postar mensagem de "Sistema"
    const sessionClient = await createServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const userId = user.id

    const { roomId } = await req.json()
    if (!roomId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se ainda e membro (evita duplicar mensagem se ja saiu)
    const { data: member } = await supabaseAdmin
      .from('room_members')
      .select('user_id, nickname')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return NextResponse.json({ ok: true, alreadyLeft: true })
    }

    // Mensagem de sistema (apelido do registro de membro, não do body)
    const nickname = member.nickname
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

// src/app/api/notificacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — buscar notificações do usuário autenticado
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: notificacoes, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type, read, created_at, data, from_user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
    }

    // Contar não lidas
    const naoLidas = (notificacoes ?? []).filter(n => !n.read).length

    return NextResponse.json({ notificacoes: notificacoes ?? [], nao_lidas: naoLidas })

  } catch (err) {
    console.error('Erro em GET /notificacoes:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH — marcar todas como lidas
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erro em PATCH /notificacoes:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

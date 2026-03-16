import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { data: sessoes } = await supabaseAdmin
      .from('user_sessions')
      .select('id, ip, user_agent, device_info, created_at, last_active_at')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('last_active_at', { ascending: false })

    return NextResponse.json({ sessoes: sessoes ?? [] })
  } catch (err) {
    console.error('Erro ao listar sessões:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

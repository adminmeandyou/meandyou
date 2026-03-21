import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Valida sessao do usuario
    const sessionClient = await createServerClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Chama spin_roleta com service_role para poder escrever nas tabelas com RLS
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.rpc('spin_roleta', { p_user_id: user.id })

    if (error) {
      console.error('[roleta/girar] rpc error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Sem resultado' }, { status: 500 })
    }

    const prize = Array.isArray(data) ? data[0] : data
    if (!prize?.reward_type) {
      console.error('[roleta/girar] reward_type ausente:', data)
      return NextResponse.json({ error: 'Premio invalido' }, { status: 500 })
    }

    return NextResponse.json(prize)
  } catch (err) {
    console.error('[roleta/girar] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

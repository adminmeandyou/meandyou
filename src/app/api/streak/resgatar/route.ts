import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createServerClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { day_number } = await req.json()
    if (typeof day_number !== 'number') {
      return NextResponse.json({ error: 'day_number inválido' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.rpc('claim_streak_reward', {
      p_user_id: user.id,
      p_day_number: day_number,
    })

    if (error) {
      console.error('[streak/resgatar] rpc error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = Array.isArray(data) ? data[0] : data
    return NextResponse.json(result ?? { success: false, reason: 'sem_resultado' })
  } catch (err) {
    console.error('[streak/resgatar] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

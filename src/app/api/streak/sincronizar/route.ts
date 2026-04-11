import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'
import { awardBadges } from '@/lib/badges'

export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createServerClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action } = await req.json()
    if (action !== 'generate' && action !== 'extend') {
      return NextResponse.json({ error: 'action inválido' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const rpcName = action === 'generate' ? 'generate_streak_calendar' : 'extend_streak_calendar'
    const { error } = await supabaseAdmin.rpc(rpcName, { p_user_id: user.id })

    if (error) {
      console.error(`[streak/sincronizar] ${rpcName} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verifica emblemas de streak (Pontual → Patrimônio)
    awardBadges(user.id, ['streak_gte', 'streak_longest_gte']).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[streak/sincronizar] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

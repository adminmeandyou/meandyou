import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Autenticar via JWT do header
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  // Verificar plano do usuário no banco (não confiar no cliente)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isBlack = profile?.plan === 'black'

  // Black: limite de 2 boosts simultâneos — validação server-side
  if (isBlack) {
    const { data: activeBoosts } = await supabaseAdmin
      .from('user_boosts')
      .select('active_until')
      .eq('user_id', user.id)
      .gt('active_until', new Date().toISOString())

    if ((activeBoosts?.length ?? 0) >= 2) {
      return NextResponse.json({ success: false, reason: 'max_simultaneous' })
    }
  }

  const { data, error } = await supabaseAdmin.rpc('activate_boost', { p_user_id: user.id })
  if (error) {
    console.error('Erro ao ativar boost:', error)
    return NextResponse.json({ error: 'Erro ao ativar boost' }, { status: 500 })
  }

  // XP: boost ativado
  void supabaseAdmin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'boost_activated', p_base_xp: 20 }).then(() => {})

  return NextResponse.json(data)
}

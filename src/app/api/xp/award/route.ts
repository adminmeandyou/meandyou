import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mapa de XP base por tipo de evento
const XP_TABLE: Record<string, number> = {
  // Ações cotidianas
  like:                  5,
  dislike:               1,
  superlike:             15,
  message_sent:          3,
  spin_roleta:           10,
  login_streak:          10,
  streak_claim:          15,
  room_joined:           5,
  boost_activated:       20,
  // Ações sociais
  match:                 25,
  first_match:           100,
  video_call:            30,
  meeting_registered:    50,
  // Perfil e crescimento
  photo_added:           10,
  profile_complete:      150,
  onboarding_complete:   100,
  identity_verified:     200,
  invite_friend:         100,
  // Loja
  purchase:              50,
  caixa_surpresa:        15,
  caixa_lendaria:        100,
  // Emblemas por raridade
  badge_comum:           25,
  badge_incomum:         75,
  badge_raro:            200,
  badge_lendario:        500,
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { event_type } = await req.json()
    if (!event_type || !XP_TABLE[event_type]) {
      return NextResponse.json({ error: 'event_type inválido' }, { status: 400 })
    }

    const baseXp = XP_TABLE[event_type]

    // Verifica se bonus de XP esta ativo e aplica multiplicador 2x
    const { data: profileBonus } = await supabase
      .from('profiles')
      .select('xp_bonus_until')
      .eq('id', user.id)
      .single()
    const bonusAtivo = profileBonus?.xp_bonus_until && new Date(profileBonus.xp_bonus_until) > new Date()
    const finalXp = bonusAtivo ? baseXp * 2 : baseXp

    const { data: rpcResult, error } = await supabase.rpc('award_xp', {
      p_user_id:    user.id,
      p_event_type: event_type,
      p_base_xp:    finalXp,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // award_xp retorna objeto com xp_awarded, level_up, tickets_ganhos
    const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult

    // Buscar dados atualizados
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, xp_level, xp_bonus_until')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      xp_awarded: result?.xp_awarded ?? finalXp,
      xp_total: profile?.xp ?? 0,
      xp_level: profile?.xp_level ?? 0,
      level_up: result?.level_up ?? false,
      tickets_ganhos: result?.tickets_ganhos ?? 0,
    })
  } catch (e) {
    console.error('[XP Award]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

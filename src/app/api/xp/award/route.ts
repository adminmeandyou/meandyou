import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mapa de XP base por tipo de evento
const XP_TABLE: Record<string, number> = {
  like:              5,
  dislike:           1,
  superlike:         15,
  match:             25,
  message_sent:      3,
  profile_complete:  150,
  photo_added:       10,
  purchase:          50,
  spin_roleta:       5,
  login_streak:      10,
  invite_friend:     100,
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event_type } = await req.json()
    if (!event_type || !XP_TABLE[event_type]) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    const baseXp = XP_TABLE[event_type]
    const { data: xpAwarded, error } = await supabase.rpc('award_xp', {
      p_user_id:    user.id,
      p_event_type: event_type,
      p_base_xp:    baseXp,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar dados atualizados
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, xp_level, xp_bonus_until')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      xp_awarded: xpAwarded,
      xp_total: profile?.xp ?? 0,
      xp_level: profile?.xp_level ?? 0,
    })
  } catch (e) {
    console.error('[XP Award]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

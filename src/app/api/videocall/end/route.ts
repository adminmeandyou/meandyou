import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { awardBadges } from '@/lib/badges'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { matchId, durationSeconds } = await req.json()
    if (!matchId) return NextResponse.json({ error: 'matchId obrigatório' }, { status: 400 })

    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()

    if (!match || (match.user1 !== user.id && match.user2 !== user.id)) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 403 })
    }

    const duracaoMinutos = Math.ceil((durationSeconds ?? 0) / 60)

    if (duracaoMinutos > 0) {
      await Promise.all([
        supabaseAdmin.rpc('register_video_minutes', {
          p_user_id: match.user1,
          p_match_id: matchId,
          p_minutes: duracaoMinutos,
        }),
        supabaseAdmin.rpc('register_video_minutes', {
          p_user_id: match.user2,
          p_match_id: matchId,
          p_minutes: duracaoMinutos,
        }),
      ])
    }

    awardBadges(match.user1, ['video_calls_gte', 'video_minutes_gte']).catch(() => {})
    awardBadges(match.user2, ['video_calls_gte', 'video_minutes_gte']).catch(() => {})

    void supabaseAdmin.rpc('award_xp', { p_user_id: match.user1, p_event_type: 'video_call', p_base_xp: 30 }).then(() => {})
    void supabaseAdmin.rpc('award_xp', { p_user_id: match.user2, p_event_type: 'video_call', p_base_xp: 30 }).then(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao finalizar videocall:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

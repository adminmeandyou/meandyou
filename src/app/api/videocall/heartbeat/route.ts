import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITE_VIDEO: Record<string, number> = {
  essencial: 60,
  plus:      300,
  black:     600,
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { matchId } = await req.json()
    if (!matchId) return NextResponse.json({ error: 'matchId obrigatório' }, { status: 400 })

    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()

    if (!match || (match.user1 !== user.id && match.user2 !== user.id)) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 403 })
    }

    await supabaseAdmin.rpc('register_video_minutes', {
      p_user_id:  user.id,
      p_match_id: matchId,
      p_minutes:  1,
    })

    const [profileResult, minutesResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('plan').eq('id', user.id).single(),
      supabaseAdmin
        .from('video_minutes')
        .select('minutes')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle(),
    ])

    const plano = profileResult.data?.plan ?? 'essencial'
    const minutosUsados = minutesResult.data?.minutes ?? 0
    const limiteMinutos = LIMITE_VIDEO[plano] ?? 60
    const minutosRestantes = Math.max(limiteMinutos - minutosUsados, 0)

    return NextResponse.json({
      remaining_minutes: minutosRestantes,
      plan: plano,
      daily_limit: limiteMinutos,
      limit_reached: minutosRestantes <= 0,
    })
  } catch (err) {
    console.error('Erro no heartbeat videocall:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

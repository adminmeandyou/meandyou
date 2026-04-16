import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITE_VIDEO: Record<string, number> = {
  essencial: 45,
  plus:      120,
  black:     300,
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
      .select('user1, user2, status')
      .eq('id', matchId)
      .single()

    if (!match || (match.user1 !== user.id && match.user2 !== user.id)) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 403 })
    }

    if (match.status !== 'active') {
      return NextResponse.json({ error: 'Match inativo' }, { status: 403 })
    }

    const [profileResult, minutesResult, extraResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('plan').eq('id', user.id).single(),
      supabaseAdmin
        .from('video_minutes')
        .select('minutes')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle(),
      supabaseAdmin.from('user_video_extra').select('amount').eq('user_id', user.id).maybeSingle(),
    ])

    const plano = profileResult.data?.plan ?? 'essencial'
    const minutosUsados = minutesResult.data?.minutes ?? 0
    const limiteMinutos = LIMITE_VIDEO[plano] ?? 45
    const extraMinutos = extraResult.data?.amount ?? 0
    const totalDisponivel = limiteMinutos + extraMinutos
    const minutosRestantes = Math.max(totalDisponivel - minutosUsados, 0)

    if (minutosRestantes <= 0) {
      return NextResponse.json({
        error: 'Você atingiu seu tempo de Live hoje',
        limit_reached: true,
        plan: plano,
        extra_minutes: extraMinutos,
      }, { status: 403 })
    }

    return NextResponse.json({
      remaining_minutes: minutosRestantes,
      plan: plano,
      daily_limit: limiteMinutos,
      extra_minutes: extraMinutos,
    })
  } catch (err) {
    console.error('Erro ao verificar limites de vídeo:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

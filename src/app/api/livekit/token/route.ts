// src/app/api/livekit/token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Limites diários por plano (em minutos)
const LIMITE_VIDEO: Record<string, number> = {
  essencial: 60,
  plus:      300,
  black:     600,
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar via Bearer token
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await req.json()
    if (!matchId) {
      return NextResponse.json({ error: 'matchId obrigatório' }, { status: 400 })
    }

    // 2. Verificar se o usuário faz parte do match e está ativo
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

    // 3. Buscar plano e minutos já usados hoje
    const [profileResult, minutesResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('video_minutes')
        .select('minutes')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single(),
    ])

    const plano = profileResult.data?.plan ?? 'essencial'
    const minutosUsados = minutesResult.data?.minutes ?? 0
    const limiteMinutos = LIMITE_VIDEO[plano] ?? 60
    const minutosRestantes = Math.max(limiteMinutos - minutosUsados, 0)

    if (minutosRestantes <= 0) {
      return NextResponse.json({
        error: `Você atingiu o limite diário de ${limiteMinutos} minutos do plano ${plano}. Faça upgrade para continuar.`,
        limit_reached: true,
      }, { status: 403 })
    }

    // 4. Gerar token LiveKit
    // Nome da sala inclui matchId para o webhook conseguir identificar o match
    const roomName = `match-${matchId}`

    const lkToken = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: user.id,
        ttl: '2h',
      }
    )

    lkToken.addGrant({
      room:         roomName,
      roomJoin:     true,
      canPublish:   true,
      canSubscribe: true,
    })

    const jwt = await lkToken.toJwt()

    return NextResponse.json({
      token:             jwt,
      room:              roomName,
      livekit_url:       process.env.NEXT_PUBLIC_LIVEKIT_URL,
      remaining_minutes: minutosRestantes,
    })

  } catch (err) {
    console.error('Erro ao gerar token LiveKit:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

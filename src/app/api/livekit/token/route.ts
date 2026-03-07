// src/app/api/livekit/token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await req.json()

    if (!matchId) {
      return NextResponse.json({ error: 'matchId obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário faz parte do match
    const { data: match } = await supabase
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

    // Verificar limite de minutos
    const { data: limitData } = await supabase.rpc('check_video_limit', {
      p_user_id: user.id,
    })

    if (!limitData.allowed) {
      return NextResponse.json({
        error: `Você atingiu o limite diário de ${limitData.limit_minutes} minutos do plano ${limitData.plan}.`,
        limit_reached: true,
      }, { status: 403 })
    }

    // Gerar token LiveKit
    const apiKey = process.env.LIVEKIT_API_KEY!
    const apiSecret = process.env.LIVEKIT_API_SECRET!
    const roomName = `match-${matchId}`

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      ttl: '2h',
    })

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const jwt = await token.toJwt()

    return NextResponse.json({
      token: jwt,
      room: roomName,
      remaining_minutes: limitData.remaining_minutes,
      livekit_url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    })
  } catch (err) {
    console.error('Erro ao gerar token LiveKit:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
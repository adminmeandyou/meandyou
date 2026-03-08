// src/app/api/webhooks/livekit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WebhookReceiver } from 'livekit-server-sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
)

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const authorization = req.headers.get('authorization') ?? ''

    // 1. Validar assinatura LiveKit — obrigatório
    let event
    try {
      event = await receiver.receive(rawBody, authorization)
    } catch (err) {
      console.warn('LiveKit webhook: assinatura inválida', err)
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const eventType = event.event

    // 2. Só processa fim de sala ou saída de participante
    if (eventType !== 'room_finished' && eventType !== 'participant_left') {
      return NextResponse.json({ received: true })
    }

    // 3. Extrair matchId e userId do nome da sala
    // Padrão do nome da sala: "match-{matchId}-{userId}"
    const roomName: string = event.room?.name ?? ''
    const parts = roomName.split('-')

    // room_finished: calcula tempo total da sala
    if (eventType === 'room_finished') {
      const room = event.room
      if (!room) return NextResponse.json({ received: true })

      // matchId está no nome da sala: "match-{matchId}"
      // ou pode ter userId também: "match-{matchId}-{userId1}-{userId2}"
      const matchId = parts[1]
      if (!matchId) return NextResponse.json({ received: true })

      const createdAt = room.creationTime ?? 0 // Unix timestamp em segundos
      const now = Math.floor(Date.now() / 1000)
      const duracaoSegundos = now - createdAt
      const duracaoMinutos = Math.ceil(duracaoSegundos / 60)

      if (duracaoMinutos <= 0) return NextResponse.json({ received: true })

      // Buscar os dois participantes do match para debitar minutos de ambos
      const { data: matchData } = await supabaseAdmin
        .from('matches')
        .select('user1, user2')
        .eq('id', matchId)
        .single()

      if (!matchData) {
        console.warn(`LiveKit: match ${matchId} não encontrado`)
        return NextResponse.json({ received: true })
      }

      // Debitar minutos de ambos os participantes
      await Promise.all([
        supabaseAdmin.rpc('register_video_minutes', {
          p_user_id:  matchData.user1,
          p_match_id: matchId,
          p_minutes:  duracaoMinutos,
        }),
        supabaseAdmin.rpc('register_video_minutes', {
          p_user_id:  matchData.user2,
          p_match_id: matchId,
          p_minutes:  duracaoMinutos,
        }),
      ])

      console.log(`Videochamada finalizada — match ${matchId}, ${duracaoMinutos} min`)
      return NextResponse.json({ success: true })
    }

    // participant_left: apenas loga, não debita (room_finished é a fonte de verdade)
    if (eventType === 'participant_left') {
      const participantId = event.participant?.identity ?? 'desconhecido'
      console.log(`Participante saiu da sala ${roomName}: ${participantId}`)
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Erro no webhook LiveKit:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

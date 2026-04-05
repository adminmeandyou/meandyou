// POST /api/badges/trigger
// Dispara verificação de emblemas para um usuário alvo com base em um gatilho específico.
// Usado quando um evento acontece para outro usuário (ex: alguém recebeu um like).
// Body: { targetUserId: string, trigger: BadgeTrigger }

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { awardBadges, type BadgeTrigger } from '@/lib/badges'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Valida sessão do chamador (deve estar logado, mas não precisa ser admin)
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { targetUserId, trigger } = await req.json()
    if (!targetUserId || !trigger) return NextResponse.json({ error: 'targetUserId e trigger obrigatórios' }, { status: 400 })

    // Dispara em background — retorna imediatamente (aceita string ou array)
    const triggers = Array.isArray(trigger) ? trigger : [trigger]
    awardBadges(targetUserId, triggers as BadgeTrigger[]).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // nunca falha visivelmente — é fire-and-forget
  }
}

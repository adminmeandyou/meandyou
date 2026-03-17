import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Salva um registro de segurança privado no banco
// Body: { matchId: string, matchName: string, local: string, meetingDate: string }
export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { matchId, matchName, local, meetingDate } = body

  if (!local || !meetingDate) {
    return NextResponse.json({ error: 'local e meetingDate são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('safety_records')
    .insert({
      user_id: user.id,
      match_id: matchId ?? null,
      match_name: matchName ?? null,
      local: local.trim(),
      meeting_date: meetingDate,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Concede badge "seguranca" ao usar o recurso pela primeira vez
  await supabase
    .from('user_badges')
    .upsert({ user_id: user.id, badge_id: 'seguranca' }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

  return NextResponse.json({ ok: true, id: data.id })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Salva um registro de segurança privado no banco
// Body: { matchId: string, matchName: string, local: string, meetingDate: string }
export async function POST(req: Request) {
  const supabase = await createClient()

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

  // Concede badge de segurança ao usar o recurso pela primeira vez
  const { data: badgeSeguranca } = await supabase
    .from('badges')
    .select('id')
    .ilike('name', '%segurança%')
    .limit(1)
    .maybeSingle()
  if (badgeSeguranca?.id) {
    await supabase
      .from('user_badges')
      .upsert({ user_id: user.id, badge_id: badgeSeguranca.id }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ ok: true, id: data.id })
}

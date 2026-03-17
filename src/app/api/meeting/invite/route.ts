import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cria um convite de encontro estruturado
// Body: { matchId, receiverId, local, meetingDate }
export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { matchId, receiverId, local, meetingDate } = body

  if (!matchId || !receiverId || !local || !meetingDate) {
    return NextResponse.json({ error: 'Campos obrigatórios: matchId, receiverId, local, meetingDate' }, { status: 400 })
  }

  // Verifica se o match pertence ao usuário
  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .or(`user1.eq.${user.id},user2.eq.${user.id}`)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
  }

  // Cancela convites pendentes anteriores deste proposer neste match
  await supabase
    .from('meeting_invites')
    .update({ status: 'cancelled' })
    .eq('match_id', matchId)
    .eq('proposer_id', user.id)
    .eq('status', 'pending')

  const { data, error } = await supabase
    .from('meeting_invites')
    .insert({
      match_id: matchId,
      proposer_id: user.id,
      receiver_id: receiverId,
      local: local.trim(),
      meeting_date: meetingDate,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inviteId: data.id })
}

// Responde a um convite (aceitar, recusar, reagendar)
// Body: { inviteId, action: 'accepted' | 'declined' | 'rescheduled', rescheduleNote? }
export async function PATCH(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { inviteId, action, rescheduleNote } = body

  if (!inviteId || !action) {
    return NextResponse.json({ error: 'inviteId e action são obrigatórios' }, { status: 400 })
  }

  if (!['accepted', 'declined', 'rescheduled'].includes(action)) {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  }

  // Verifica que o usuário é o receiver
  const { data: invite } = await supabase
    .from('meeting_invites')
    .select('id, receiver_id, status')
    .eq('id', inviteId)
    .single()

  if (!invite || invite.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Convite já foi respondido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('meeting_invites')
    .update({
      status: action,
      reschedule_note: rescheduleNote ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

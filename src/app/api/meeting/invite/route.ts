import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lista todos os encontros do usuário logado (como proposer ou receiver)
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca convites onde o usuario é proposer ou receiver
  const { data, error } = await supabase
    .from('meeting_invites')
    .select('*')
    .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Busca profiles dos envolvidos
  const userIds = new Set<string>()
  for (const inv of data ?? []) {
    userIds.add(inv.proposer_id)
    userIds.add(inv.receiver_id)
  }
  userIds.delete(user.id)

  let profiles: Record<string, { name: string; photo_best: string | null }> = {}
  if (userIds.size > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, name, photo_best')
      .in('id', Array.from(userIds))

    if (profs) {
      for (const p of profs) {
        profiles[p.id] = { name: p.name, photo_best: p.photo_best }
      }
    }
  }

  // Enriquece com dados do outro usuario
  const enriched = (data ?? []).map(inv => {
    const otherId = inv.proposer_id === user.id ? inv.receiver_id : inv.proposer_id
    const other = profiles[otherId] ?? { name: 'Alguém', photo_best: null }
    return {
      ...inv,
      other_id: otherId,
      other_name: other.name,
      other_photo: other.photo_best,
      is_proposer: inv.proposer_id === user.id,
    }
  })

  return NextResponse.json({ invites: enriched, userId: user.id })
}

// Cria um convite de encontro estruturado
// Body: { matchId, receiverId, local, meetingDate }
export async function POST(req: Request) {
  const supabase = await createClient()

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

  // Verifica se já existe um encontro ativo (pending ou accepted) neste match
  const { data: activeInvite } = await supabase
    .from('meeting_invites')
    .select('id, status')
    .eq('match_id', matchId)
    .in('status', ['pending', 'accepted'])
    .limit(1)
    .maybeSingle()

  if (activeInvite) {
    const msg = activeInvite.status === 'pending'
      ? 'Já existe um convite pendente com essa pessoa. Cancele ou aguarde a resposta antes de criar outro.'
      : 'Já existe um encontro confirmado com essa pessoa. Cancele ou conclua antes de criar outro.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

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

// Responde/gerencia um convite
// Body: { inviteId, action: 'accepted' | 'declined' | 'rescheduled' | 'cancelled', rescheduleNote?, newDate?, newLocal? }
export async function PATCH(req: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { inviteId, action, rescheduleNote, newDate, newLocal } = body

  if (!inviteId || !action) {
    return NextResponse.json({ error: 'inviteId e action são obrigatórios' }, { status: 400 })
  }

  if (!['accepted', 'declined', 'rescheduled', 'cancelled'].includes(action)) {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  }

  // Busca o convite
  const { data: invite } = await supabase
    .from('meeting_invites')
    .select('id, proposer_id, receiver_id, status')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
  }

  // Verifica permissão
  const isProposer = invite.proposer_id === user.id
  const isReceiver = invite.receiver_id === user.id

  if (!isProposer && !isReceiver) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Cancelar: ambos podem cancelar qualquer convite ativo
  if (action === 'cancelled') {
    if (!['pending', 'accepted'].includes(invite.status)) {
      return NextResponse.json({ error: 'Convite não pode ser cancelado' }, { status: 400 })
    }
    const { error } = await supabase
      .from('meeting_invites')
      .update({ status: 'cancelled', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Aceitar/recusar: somente o receiver pode
  if ((action === 'accepted' || action === 'declined') && !isReceiver) {
    return NextResponse.json({ error: 'Apenas o convidado pode aceitar ou recusar' }, { status: 403 })
  }

  if ((action === 'accepted' || action === 'declined') && invite.status !== 'pending') {
    return NextResponse.json({ error: 'Convite já foi respondido' }, { status: 400 })
  }

  // Reagendar: ambos podem pedir reagendamento
  if (action === 'rescheduled') {
    if (!['pending', 'accepted'].includes(invite.status)) {
      return NextResponse.json({ error: 'Convite não pode ser reagendado' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status: 'rescheduled',
      reschedule_note: rescheduleNote ?? null,
      responded_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('meeting_invites')
      .update(updateData)
      .eq('id', inviteId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Se informou nova data/local, cria um novo convite automaticamente
    if (newDate || newLocal) {
      const { data: original } = await supabase
        .from('meeting_invites')
        .select('match_id, local, meeting_date, proposer_id, receiver_id')
        .eq('id', inviteId)
        .single()

      if (original) {
        // Quem reagenda vira o novo proposer, o outro vira receiver
        const newReceiverId = user.id === original.proposer_id ? original.receiver_id : original.proposer_id

        await supabase
          .from('meeting_invites')
          .insert({
            match_id: original.match_id,
            proposer_id: user.id,
            receiver_id: newReceiverId,
            local: (newLocal ?? original.local).trim(),
            meeting_date: newDate ?? original.meeting_date,
          })
      }
    }

    return NextResponse.json({ ok: true })
  }

  // Aceitar ou recusar
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

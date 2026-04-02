// POST /api/badges/auto-award
// Concede um emblema a todos os usuários que atendem à condição.
// Chamado pelo painel admin ao clicar "Aplicar agora".

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verificar autorizacao — apenas admin ou staff
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user: caller } } = await supabase.auth.getUser(token)
  if (!caller) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', caller.id).single()
  const { data: staff } = await supabase.from('staff_members').select('id').eq('user_id', caller.id).single()
  if (profile?.role !== 'admin' && !staff) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { data: badge } = await supabase
    .from('badges')
    .select('id, condition_type, condition_value, condition_extra, user_cohort')
    .eq('id', body.badgeId)
    .single()

  if (!badge) return NextResponse.json({ error: 'Emblema não encontrado' }, { status: 404 })

  let userIds: string[] = []
  const count: number = badge.condition_value?.count ?? 1

  switch (badge.condition_type) {

    case 'on_join': {
      const { data } = await supabase.from('profiles').select('id')
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }

    case 'early_adopter': {
      const refDate = badge.condition_extra?.reference_date ?? badge.condition_value?.date ?? '2025-12-31'
      const { data } = await supabase.from('profiles').select('id, created_at').lte('created_at', refDate)
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }

    case 'on_verify': {
      const { data } = await supabase.from('users').select('id').eq('verified', true)
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }

    case 'profile_complete': {
      const { data } = await supabase.from('profiles').select('id, photo_face, bio').not('photo_face', 'is', null).not('bio', 'is', null)
      userIds = (data ?? []).filter((r: any) => r.bio?.length >= 30).map((r: any) => r.id)
      break
    }

    case 'invited_gte': {
      let rpcData: any = null
      try { const { data } = await supabase.rpc('get_users_with_referrals', { min_count: count }); rpcData = data } catch {}
      if (rpcData) {
        userIds = (rpcData ?? []).map((r: any) => r.user_id)
      } else {
        // fallback: manual count via referrals table
        const { data: refs } = await supabase.from('referrals').select('referrer_id')
        const counts: Record<string, number> = {}
        for (const r of refs ?? []) { counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1 }
        userIds = Object.entries(counts).filter(([, c]) => c >= count).map(([uid]) => uid)
      }
      break
    }

    case 'likes_received_gte': {
      // target_id = quem recebeu o like
      const { data } = await supabase.rpc('get_users_likes_received', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'likes_sent_gte': {
      // user_id = quem enviou o like
      const { data } = await supabase.rpc('get_users_likes_sent', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'messages_sent_gte': {
      const { data } = await supabase.rpc('get_users_messages_sent', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'messages_received_gte': {
      const { data } = await supabase.rpc('get_users_messages_received', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'messages_total_gte': {
      const { data } = await supabase.rpc('get_users_messages_total', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'matches_gte': {
      const { data } = await supabase.rpc('get_users_matches', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'streak_gte': {
      const { data } = await supabase.from('daily_streaks').select('user_id, current_streak').gte('current_streak', count)
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'streak_longest_gte': {
      const { data } = await supabase.from('daily_streaks').select('user_id, longest_streak').gte('longest_streak', count)
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'video_calls_gte': {
      const { data } = await supabase.rpc('get_users_video_calls', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'video_minutes_gte': {
      const { data } = await supabase.rpc('get_users_video_minutes', { min_minutes: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }

    case 'store_purchase':
    case 'store_spent_gte':
    case 'store_item': {
      // Compras de itens não têm tabela de histórico no momento — concessão manual necessária
      return NextResponse.json({ ok: true, awarded: 0, note: 'Compras de loja requerem concessão manual até que store_orders seja implementado.' })
    }

    case 'meetup_scheduled': {
      // Meetups são armazenados localmente (localStorage) por design do app — não é possível conceder em lote
      return NextResponse.json({ ok: true, awarded: 0, note: 'Encontros são armazenados localmente — concessão manual necessária.' })
    }

    case 'photos_gte': {
      const photoColumns = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
      const { data } = await supabase.from('profiles').select('id, ' + photoColumns.join(', '))
      userIds = (data ?? []).filter((r: any) => {
        const filled = photoColumns.filter(col => r[col] != null).length
        return filled >= count
      }).map((r: any) => r.id)
      break
    }

    case 'plan_active': {
      const { data } = await supabase.from('profiles').select('id, plan').in('plan', ['plus', 'black'])
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }

    case 'plan_black': {
      const { data } = await supabase.from('profiles').select('id').eq('plan', 'black')
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }

    case 'took_bolo': {
      const { data } = await supabase.from('bolo_reports').select('user_id')
      userIds = [...new Set((data ?? []).map((r: any) => r.user_id))]
      break
    }

    case 'manual':
    default:
      return NextResponse.json({ ok: true, awarded: 0, note: 'Concessão manual — nenhum usuário processado.' })
  }

  // Aplicar filtro de coorte (novo/antigo/todos)
  if (userIds.length > 0 && badge.user_cohort && badge.user_cohort !== 'all') {
    const refDate = badge.condition_extra?.reference_date
    if (refDate) {
      const { data: usersData } = await supabase.from('users').select('id, created_at').in('id', userIds)
      if (badge.user_cohort === 'new') {
        userIds = (usersData ?? []).filter((u: any) => new Date(u.created_at) >= new Date(refDate)).map((u: any) => u.id)
      } else if (badge.user_cohort === 'old') {
        userIds = (usersData ?? []).filter((u: any) => new Date(u.created_at) < new Date(refDate)).map((u: any) => u.id)
      }
    }
  }

  if (userIds.length === 0) return NextResponse.json({ ok: true, awarded: 0 })

  const rows = userIds.map(uid => ({ user_id: uid, badge_id: badge.id }))
  const { error } = await supabase
    .from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, awarded: userIds.length })
}

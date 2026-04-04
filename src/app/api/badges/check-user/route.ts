// POST /api/badges/check-user
// Verifica todos os badges ativos para o usuário autenticado.
// Concede automaticamente os que ele ainda não tem mas já merece.
// Retorna a lista dos badges recém-concedidos (para mostrar notificação).

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function meetsCondition(
  userId: string,
  conditionType: string,
  conditionValue: any,
  conditionExtra: any,
  profileData: any,
): Promise<boolean> {
  const count: number = conditionValue?.count ?? 1

  try {
    switch (conditionType) {

      case 'on_join':
        return true

      case 'on_verify': {
        const { data } = await supabase.from('users').select('verified').eq('id', userId).single()
        return data?.verified === true
      }

      case 'profile_complete': {
        return !!(profileData?.photo_face && profileData?.bio && profileData.bio.length >= 30)
      }

      case 'early_adopter': {
        const refDate = conditionExtra?.reference_date ?? conditionValue?.date
        if (!refDate) return false
        return profileData?.created_at ? new Date(profileData.created_at) <= new Date(refDate) : false
      }

      case 'photos_gte': {
        const cols = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
        const filled = cols.filter(c => profileData?.[c] != null).length
        return filled >= count
      }

      case 'plan_active': {
        return ['plus', 'black'].includes(profileData?.plan ?? '')
      }

      case 'plan_black': {
        return profileData?.plan === 'black'
      }

      case 'matches_gte': {
        const { count: c } = await supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'matched')
        return (c ?? 0) >= count
      }

      case 'likes_received_gte': {
        const { count: c } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('target_id', userId)
        return (c ?? 0) >= count
      }

      case 'likes_sent_gte': {
        const { count: c } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        return (c ?? 0) >= count
      }

      case 'messages_sent_gte': {
        const { count: c } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', userId)
        return (c ?? 0) >= count
      }

      case 'messages_received_gte': {
        const { count: c } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', userId)
        return (c ?? 0) >= count
      }

      case 'messages_total_gte': {
        const [{ count: sent }, { count: recv }] = await Promise.all([
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', userId),
        ])
        return ((sent ?? 0) + (recv ?? 0)) >= count
      }

      case 'streak_gte': {
        const { data } = await supabase.from('daily_streaks').select('current_streak').eq('user_id', userId).single()
        return (data?.current_streak ?? 0) >= count
      }

      case 'streak_longest_gte': {
        const { data } = await supabase.from('daily_streaks').select('longest_streak').eq('user_id', userId).single()
        return (data?.longest_streak ?? 0) >= count
      }

      case 'invited_gte': {
        const { count: c } = await supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', userId)
        return (c ?? 0) >= count
      }

      case 'video_calls_gte': {
        const { count: c } = await supabase
          .from('video_call_logs')
          .select('id', { count: 'exact', head: true })
          .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        return (c ?? 0) >= count
      }

      case 'video_minutes_gte': {
        const { data } = await supabase
          .from('video_call_logs')
          .select('duration_seconds')
          .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        const totalMinutes = (data ?? []).reduce((sum: number, r: any) => sum + (r.duration_seconds ?? 0), 0) / 60
        return totalMinutes >= count
      }

      case 'took_bolo': {
        const { count: c } = await supabase
          .from('bolo_reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        return (c ?? 0) >= 1
      }

      // Compras de loja e encontros não têm tabela — concessão manual pelo admin
      case 'store_purchase':
      case 'store_spent_gte':
      case 'store_item':
      case 'meetup_scheduled':
      case 'manual':
        return false

      default:
        return false
    }
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

  // Busca todos os badges ativos que o usuário ainda não tem
  const [{ data: allBadges }, { data: userBadges }, { data: profile }] = await Promise.all([
    supabase.from('badges').select('*').eq('is_active', true).eq('is_published', true),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const owned = new Set((userBadges ?? []).map((b: any) => b.badge_id))
  const toCheck = (allBadges ?? []).filter((b: any) => !owned.has(b.id))

  if (toCheck.length === 0) return NextResponse.json({ awarded: [] })

  const newlyAwarded: any[] = []

  for (const badge of toCheck) {
    const qualifies = await meetsCondition(user.id, badge.condition_type, badge.condition_value, badge.condition_extra, profile)
    if (qualifies) {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badge.id })
        .select()
        .single()
      if (!error) newlyAwarded.push(badge)
    }
  }

  return NextResponse.json({ awarded: newlyAwarded })
}

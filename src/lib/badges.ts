// src/lib/badges.ts
// Concessão automática de emblemas — chamada em pontos-chave do sistema.
// Princípio: a condição foi true agora? Concede na hora. Sem timer, sem manual.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos de condição que devem ser verificados por evento
export type BadgeTrigger =
  | 'on_join'
  | 'on_verify'
  | 'profile_complete'
  | 'photos_gte'
  | 'matches_gte'
  | 'likes_received_gte'
  | 'likes_sent_gte'
  | 'messages_sent_gte'
  | 'messages_total_gte'
  | 'sala_unique_gte'
  | 'invited_gte'
  | 'video_calls_gte'
  | 'video_minutes_gte'
  | 'streak_gte'
  | 'streak_longest_gte'
  | 'took_bolo'
  | 'early_adopter'
  | 'plan_black'

// Verifica se o usuário atende a condição de um badge específico
async function meetsCondition(
  userId: string,
  conditionType: string,
  conditionValue: any,
  conditionExtra: any,
  profile: any,
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

      case 'profile_complete':
        return !!(profile?.photo_face && profile?.bio && profile.bio.length >= 30)

      case 'early_adopter': {
        const refDate = conditionExtra?.reference_date ?? conditionValue?.date
        if (!refDate) return false
        return profile?.created_at ? new Date(profile.created_at) <= new Date(refDate) : false
      }

      case 'photos_gte': {
        const cols = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
        return cols.filter(c => profile?.[c] != null).length >= count
      }

      case 'plan_black':
        return profile?.plan === 'black'

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

      case 'messages_total_gte': {
        const { data: userMatchIds } = await supabase
          .from('matches')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'matched')
        const mids = (userMatchIds ?? []).map((m: any) => m.id)
        if (mids.length === 0) return false
        const { count: c } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('match_id', mids)
        return (c ?? 0) >= count
      }

      case 'sala_unique_gte': {
        const { data } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', userId)
        const unique = new Set((data ?? []).map((r: any) => r.room_id)).size
        return unique >= count
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
        const total = (data ?? []).reduce((s: number, r: any) => s + (r.duration_seconds ?? 0), 0) / 60
        return total >= count
      }

      case 'took_bolo': {
        const { count: c } = await supabase
          .from('bolo_reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        return (c ?? 0) >= 1
      }

      default:
        return false
    }
  } catch {
    return false
  }
}

// Concede emblemas elegíveis para o usuário com base no(s) tipo(s) de gatilho.
// Retorna os badges recém-concedidos (para notificação, se quiser).
export async function awardBadges(userId: string, triggers: BadgeTrigger | BadgeTrigger[]): Promise<any[]> {
  const triggerSet = Array.isArray(triggers) ? triggers : [triggers]

  // Busca badges ativos dos tipos relevantes que o usuário ainda não tem
  const [{ data: candidates }, { data: owned }, { data: profile }] = await Promise.all([
    supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .eq('is_published', true)
      .in('condition_type', triggerSet),
    supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(r => r.data),
  ])

  if (!candidates || candidates.length === 0) return []

  const ownedIds = new Set((owned ?? []).map((b: any) => b.badge_id))
  const toCheck = candidates.filter((b: any) => !ownedIds.has(b.id))

  // Usuário já tem todos os badges desse tipo — nada a fazer
  if (toCheck.length === 0) return []

  const awarded: any[] = []

  // Mapa de raridade → { event_type, base_xp }
  const RARITY_XP: Record<string, { event: string; xp: number }> = {
    comum:    { event: 'badge_comum',    xp: 25  },
    incomum:  { event: 'badge_incomum',  xp: 75  },
    raro:     { event: 'badge_raro',     xp: 200 },
    lendario: { event: 'badge_lendario', xp: 500 },
  }

  for (const badge of toCheck) {
    const qualifies = await meetsCondition(userId, badge.condition_type, badge.condition_value, badge.condition_extra, profile)
    if (qualifies) {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badge.id })
      if (!error) {
        awarded.push(badge)
        // XP pelo emblema (fire-and-forget por raridade)
        const rarity: string = badge.rarity?.toLowerCase?.() ?? 'comum'
        const { event: xpEvent, xp: xpBase } = RARITY_XP[rarity] ?? RARITY_XP['comum']
        void supabase.rpc('award_xp', { p_user_id: userId, p_event_type: xpEvent, p_base_xp: xpBase }).then(() => {})
      }
    }
  }

  return awarded
}

// Revoga emblemas revogáveis que o usuário não merece mais.
// Usado quando o plano expira ou é rebaixado.
const REVOCABLE_CONDITIONS: BadgeTrigger[] = ['plan_black']

export async function revokeBadges(userId: string, triggers: BadgeTrigger | BadgeTrigger[]): Promise<void> {
  const triggerSet = (Array.isArray(triggers) ? triggers : [triggers])
    .filter(t => REVOCABLE_CONDITIONS.includes(t))

  if (triggerSet.length === 0) return

  const { data: badges } = await supabase
    .from('badges')
    .select('id')
    .in('condition_type', triggerSet)

  if (!badges || badges.length === 0) return

  const badgeIds = badges.map((b: any) => b.id)

  await supabase
    .from('user_badges')
    .delete()
    .eq('user_id', userId)
    .in('badge_id', badgeIds)
}

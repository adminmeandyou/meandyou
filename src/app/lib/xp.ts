// Helper para conceder XP ao usuário — fire-and-forget, nunca quebra a UX
import { supabase } from './supabase'

const XP_TABLE: Record<string, number> = {
  like:             5,
  dislike:          1,
  superlike:        15,
  match:            25,
  message_sent:     3,
  profile_complete: 150,
  photo_added:      10,
  purchase:         50,
  spin_roleta:      5,
  login_streak:     10,
  invite_friend:    100,
}

export function awardXp(userId: string, eventType: string): void {
  const baseXp = XP_TABLE[eventType]
  if (!baseXp || !userId) return
  supabase.rpc('award_xp', {
    p_user_id:    userId,
    p_event_type: eventType,
    p_base_xp:    baseXp,
  }).then(() => {}).catch(() => {})
}

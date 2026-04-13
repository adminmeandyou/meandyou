// Helper para conceder XP ao usuário — fire-and-forget via API server-side, nunca quebra a UX
import { supabase } from './supabase'

export function awardXp(userId: string, eventType: string): void {
  if (!eventType || !userId) return

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.access_token) return
    fetch('/api/xp/award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event_type: eventType }),
    })
      .then(res => res.json())
      .then(data => {
        if (data?.level_up && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('xp:levelup', {
            detail: {
              level:   data.xp_level   ?? 0,
              tickets: data.tickets_ganhos ?? 0,
            },
          }))
        }
      })
      .catch(() => {})
  }).catch(() => {})
}

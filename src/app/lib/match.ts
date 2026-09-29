import { supabase } from '@/app/lib/supabase'

// Avisa a outra pessoa quando uma curtida vira match (notificação no app + push).
// O Descobrir já fazia isso; as outras telas de curtir criavam o match em silêncio.
export async function avisarMatch(fromUserId: string, toUserId: string) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return
  fetch('/api/matches/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fromUserId, toUserId }),
  }).catch(() => {})
}

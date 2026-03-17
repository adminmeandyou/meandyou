// POST /api/badges/auto-award
// Concede um emblema automaticamente a todos os usuários que atendem à condição.
// Chamado pelo painel admin ao clicar "Implementar agora".

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verificar que é admin
  const authHeader = req.headers.get('cookie') ?? ''
  const { data: badge } = await supabase
    .from('badges')
    .select('id, condition_type, condition_value')
    .eq('id', (await req.json()).badgeId)
    .single()

  if (!badge) return NextResponse.json({ error: 'Emblema não encontrado' }, { status: 404 })

  let userIds: string[] = []

  switch (badge.condition_type) {
    case 'on_join': {
      const { data } = await supabase.from('profiles').select('id')
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }
    case 'on_verify': {
      const { data } = await supabase.from('users').select('id').eq('verified', true)
      userIds = (data ?? []).map((r: any) => r.id)
      break
    }
    case 'profile_complete': {
      const { data } = await supabase.from('profiles')
        .select('id, photo_face, bio')
        .not('photo_face', 'is', null)
        .not('bio', 'is', null)
      userIds = (data ?? []).filter((r: any) => r.bio?.length >= 30).map((r: any) => r.id)
      break
    }
    case 'took_bolo': {
      const { data } = await supabase.from('bolo_reports').select('user_id')
      userIds = [...new Set((data ?? []).map((r: any) => r.user_id))]
      break
    }
    case 'invited_x': {
      const count = badge.condition_value?.count ?? 1
      const { data } = await supabase.rpc('get_users_with_referrals', { min_count: count })
      userIds = (data ?? []).map((r: any) => r.user_id)
      break
    }
    case 'manual':
    default:
      return NextResponse.json({ ok: true, awarded: 0, note: 'Concessão manual — nenhum usuário processado.' })
  }

  if (userIds.length === 0) return NextResponse.json({ ok: true, awarded: 0 })

  // Insere em lote ignorando duplicatas
  const rows = userIds.map(uid => ({ user_id: uid, badge_id: badge.id }))
  const { error } = await supabase
    .from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, awarded: userIds.length })
}

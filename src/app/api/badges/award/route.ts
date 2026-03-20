import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Concede um badge ao usuário autenticado
// Body: { badgeId: string, expiresAt?: string }
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { badgeId, expiresAt } = body

  if (!badgeId || typeof badgeId !== 'string') {
    return NextResponse.json({ error: 'badgeId obrigatório' }, { status: 400 })
  }

  // Verifica se e admin ou staff (somente eles podem conceder badges)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabase.from('staff_members').select('id').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && !staff) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Verifica se o badge existe
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('id', badgeId)
    .single()

  if (!badge) {
    return NextResponse.json({ error: 'Badge não encontrado' }, { status: 404 })
  }

  // Concede o badge (ignora se já tem)
  const { error } = await supabase
    .from('user_badges')
    .upsert({
      user_id: user.id,
      badge_id: badgeId,
      expires_at: expiresAt ?? null,
    }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

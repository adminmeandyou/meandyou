import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/cron/expire-subscriptions
// Chamado diariamente por cron externo (cron-job.org ou Vercel Cron)
// Protegido por CRON_SECRET no header Authorization
//
// O que faz:
// 1. Busca assinaturas que venceram (ends_at < agora, status = active ou cancelled)
// 2. Faz downgrade do plano para 'essencial' no profiles
// 3. Revoga o emblema Elite Black de quem era Black
// 4. Marca a subscription como 'expired'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Busca assinaturas vencidas ainda não expiradas
  const { data: expired, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan')
    .lt('ends_at', now)
    .in('status', ['active', 'cancelled'])

  if (fetchErr) {
    console.error('[cron] expire-subscriptions fetch error:', fetchErr.message)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  const blackUserIds = expired.filter(s => s.plan === 'black').map(s => s.user_id)
  const allUserIds = expired.map(s => s.user_id)
  const subIds = expired.map(s => s.id)

  // 1. Downgrade plano para 'essencial'
  const { error: planErr } = await supabase
    .from('profiles')
    .update({ plan: 'essencial' })
    .in('id', allUserIds)

  if (planErr) {
    console.error('[cron] expire-subscriptions plan downgrade error:', planErr.message)
  }

  // 2. Revoga Elite Black de quem era Black
  if (blackUserIds.length > 0) {
    const { data: badge } = await supabase
      .from('badges')
      .select('id')
      .eq('condition_type', 'plan_black')
      .single()

    if (badge) {
      const { error: revokeErr } = await supabase
        .from('user_badges')
        .delete()
        .eq('badge_id', badge.id)
        .in('user_id', blackUserIds)

      if (revokeErr) {
        console.error('[cron] expire-subscriptions badge revoke error:', revokeErr.message)
      }
    }
  }

  // 3. Marca subscriptions como expired
  const { error: statusErr } = await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .in('id', subIds)

  if (statusErr) {
    console.error('[cron] expire-subscriptions status update error:', statusErr.message)
  }

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    blackRevoked: blackUserIds.length,
  })
}

// Vercel Cron usa GET — POST mantido para compatibilidade com cron externo
export const GET = run
export const POST = run

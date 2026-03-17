import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo Supabase Scheduled Webhooks ou cron externo (cron-job.org)
// Protegido por CRON_SECRET no header Authorization
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET ?? ''

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Notifica matches que vão expirar em 24h (antes de deletar)
  const { error: notifyErr } = await supabase.rpc('notify_expiring_matches')
  if (notifyErr) {
    console.error('[cron] notify_expiring_matches error:', notifyErr.message)
  }

  // Expira matches antigos
  const { error: expireErr } = await supabase.rpc('expire_matches')
  if (expireErr) {
    console.error('[cron] expire_matches error:', expireErr.message)
    return NextResponse.json({ error: expireErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}

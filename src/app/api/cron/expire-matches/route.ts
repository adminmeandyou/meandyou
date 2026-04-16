import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Chamado pelo Vercel Cron (GET) ou cron externo (POST)
// Protegido por CRON_SECRET no header Authorization
async function run(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Notifica matches que vão expirar em 24h (antes de deletar)
  const { error: notifyErr } = await supabase.rpc('notify_expiring_matches')
  if (notifyErr) {
    console.error('[cron] notify_expiring_matches error:', notifyErr.message)
  }

  // Expira matches antigos (amigos sao protegidos)
  const { error: expireErr } = await supabase.rpc('expire_matches')
  if (expireErr) {
    console.error('[cron] expire_matches error:', expireErr.message)
    return NextResponse.json({ error: expireErr.message }, { status: 500 })
  }

  // Limpa mensagens com mais de 30 dias (mantem ultimas 50 por conversa)
  const { data: deletedCount, error: cleanupErr } = await supabase.rpc('cleanup_old_messages')
  if (cleanupErr) {
    console.error('[cron] cleanup_old_messages error:', cleanupErr.message)
  } else if (deletedCount && deletedCount > 0) {
    console.log(`[cron] ${deletedCount} mensagens antigas removidas`)
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}

export const GET = run
export const POST = run

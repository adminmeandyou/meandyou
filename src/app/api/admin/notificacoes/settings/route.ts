// src/app/api/admin/notificacoes/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('notification_settings')
    .select('*')
    .order('evento')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const { evento, canal, ativo, webhook_url, dias_inatividade } = await req.json()

  const { error } = await supabaseAdmin
    .from('notification_settings')
    .upsert(
      { evento, canal, ativo, webhook_url, dias_inatividade, updated_at: new Date().toISOString() },
      { onConflict: 'evento,canal' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

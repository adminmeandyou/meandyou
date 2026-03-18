// src/app/api/admin/marketing/historico/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('marketing_campaigns')
    .select('id, titulo, segmento, total_destinatarios, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// src/app/api/admin/bugs/[id]/recusar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('bug_reports')
    .update({ status: 'recusado', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

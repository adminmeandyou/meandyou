// src/app/api/admin/bugs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pendente'

  let query = supabaseAdmin
    .from('bug_reports')
    .select(`
      id, descricao, screenshot_url, status, created_at, reviewed_at,
      user:user_id (id, name, email, plan)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// src/app/api/admin/bugs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && !staff) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
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

// src/app/api/admin/bugs/[id]/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && !staff) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { data: report } = await supabaseAdmin
    .from('bug_reports')
    .select('user_id, status')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'Report não encontrado' }, { status: 404 })
  if (report.status !== 'pendente') return NextResponse.json({ error: 'Report já foi revisado' }, { status: 400 })

  // Creditar 5 fichas ao usuário
  try {
    await supabaseAdmin.rpc('credit_fichas', { p_user_id: report.user_id, p_amount: 5 })
  } catch (e) {
    console.error('Erro ao creditar fichas:', e)
  }

  const { error } = await supabaseAdmin
    .from('bug_reports')
    .update({ status: 'verificado', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

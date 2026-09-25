// src/app/api/admin/acao/route.ts
// Ações de moderação (banir, desbanir, resolver denúncia). As RPCs admin_* eram chamadas
// direto do navegador e executavam para QUALQUER usuário logado. Agora só o servidor chama
// (execute revogado em migration_seguranca_admin.sql), depois de checar admin/equipe,
// e o p_admin_id é sempre o usuário da sessão (antes vinha do cliente).
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f-]{36}$/i

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).maybeSingle()
    if (profile?.role !== 'admin' && !staff) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { acao, userId, motivo, reportId, resultado } = await req.json()

    let rpc: { error: { message: string } | null }
    if (acao === 'banir') {
      if (!UUID.test(String(userId))) return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
      if (userId === user.id) return NextResponse.json({ error: 'Não é possível banir a si mesmo' }, { status: 400 })
      rpc = await supabaseAdmin.rpc('admin_ban_user', {
        p_user_id: userId,
        p_reason: String(motivo ?? '').slice(0, 500),
        p_admin_id: user.id,
      })
    } else if (acao === 'desbanir') {
      if (!UUID.test(String(userId))) return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
      rpc = await supabaseAdmin.rpc('admin_unban_user', { p_user_id: userId })
    } else if (acao === 'resolver_denuncia') {
      if (!UUID.test(String(reportId))) return NextResponse.json({ error: 'reportId inválido' }, { status: 400 })
      if (resultado !== 'resolved' && resultado !== 'ignored') return NextResponse.json({ error: 'resultado inválido' }, { status: 400 })
      rpc = await supabaseAdmin.rpc('admin_resolve_report', {
        p_report_id: reportId,
        p_action: resultado,
        p_admin_id: user.id,
      })
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    if (rpc.error) {
      console.error('[admin/acao]', acao, rpc.error.message)
      return NextResponse.json({ error: 'Erro ao executar ação' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/acao]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

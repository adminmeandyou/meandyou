import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return user
  return null
}

export async function GET(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'config') {
    const { data, error } = await supabaseAdmin
      .from('site_config')
      .select('*')
      .eq('id', 1)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (type === 'landing') {
    const { data, error } = await supabaseAdmin
      .from('landing_content')
      .select('id, secao, chave, valor, tipo, pagina, ordem, updated_at')
      .order('pagina', { ascending: true })
      .order('secao', { ascending: true })
      .order('ordem', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'type inválido (use config ou landing)' }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const body = await req.json()
  const { type } = body

  if (type === 'config') {
    const { patch } = body
    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'patch obrigatório' }, { status: 400 })
    }

    const permitidos = [
      'modo_site', 'lancamento_ativo', 'lancamento_inicio', 'lancamento_fim',
      'lancamento_desconto_pct', 'gate_ativo', 'gate_senha', 'gate_titulo', 'gate_mensagem',
      'obrigado_titulo', 'obrigado_mensagem', 'obrigado_msg_essencial',
      'obrigado_msg_plus', 'obrigado_msg_black',
      'preco_essencial', 'preco_plus', 'preco_black',
    ]
    const update: Record<string, unknown> = {}
    for (const k of Object.keys(patch)) {
      if (permitidos.includes(k)) update[k] = patch[k]
    }
    update.updated_at = new Date().toISOString()
    update.updated_by = admin.id

    const { error } = await supabaseAdmin.from('site_config').update(update).eq('id', 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'landing') {
    const { id, valor } = body
    if (!id || typeof valor !== 'string') {
      return NextResponse.json({ error: 'id e valor obrigatórios' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('landing_content')
      .update({ valor })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 })
}

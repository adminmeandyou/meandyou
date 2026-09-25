// src/app/api/admin/usuarios/export/route.ts
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

  const plano = searchParams.get('plano')
  const status = searchParams.get('status')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  const formato = searchParams.get('formato') ?? 'csv'

  let query = supabaseAdmin
    .from('profiles')
    .select('id, name, plan, banned, verified, deleted_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (plano && plano !== 'todos') query = query.eq('plan', plano)
  if (status === 'banidos')         query = query.eq('banned', true)
  if (status === 'ativos')          query = query.eq('banned', false).is('deleted_at', null)
  if (status === 'excluidos')       query = query.not('deleted_at', 'is', null)
  if (status === 'nao_verificados') query = query.eq('verified', false).eq('banned', false)
  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim)    query = query.lte('created_at', dataFim + 'T23:59:59Z')

  const { data: users, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = (users ?? []).map((u: any) => u.id)
  // email/cpf/telefone ficam em `users` (não em profiles); payments.amount está em reais.
  // Busca em lotes para não estourar o tamanho da URL do filtro `in`.
  const totalGastoPorUser: Record<string, number> = {}
  const contatoPorUser: Record<string, { email: string | null; cpf: string | null; phone: string | null }> = {}
  for (let i = 0; i < userIds.length; i += 300) {
    const lote = userIds.slice(i, i + 300)
    const [{ data: contatos }, { data: pagamentos }] = await Promise.all([
      supabaseAdmin.from('users').select('id, email, cpf, phone').in('id', lote),
      supabaseAdmin.from('payments').select('user_id, amount').in('user_id', lote).eq('status', 'paid'),
    ])
    for (const c of contatos ?? []) contatoPorUser[c.id] = { email: c.email, cpf: c.cpf, phone: c.phone }
    for (const p of pagamentos ?? []) {
      totalGastoPorUser[p.user_id] = (totalGastoPorUser[p.user_id] ?? 0) + Math.round(Number(p.amount ?? 0) * 100)
    }
  }
  for (const u of (users ?? []) as Record<string, unknown>[]) Object.assign(u, contatoPorUser[u.id as string] ?? {})

  // Evita CSV/formula injection: valores que começam com = + - @ viram texto no Excel
  const seguro = (v: unknown) => {
    const t = String(v ?? '').replace(/[\t\r\n]+/g, ' ')
    return /^[=+\-@]/.test(t) ? `'${t}` : t
  }

  function getStatus(u: any) {
    if (u.banned) return 'banido'
    if (u.deleted_at) return 'excluido'
    if (!u.verified) return 'pendente'
    return 'ativo'
  }

  const rows = (users ?? []).map((u: any) => ({
    nome: u.name ?? '',
    email: u.email ?? '',
    cpf: u.cpf ?? '',
    telefone: u.phone ?? '',
    plano: u.plan ?? 'sem plano',
    status: getStatus(u),
    data_cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
    total_gasto_rs: ((totalGastoPorUser[u.id] ?? 0) / 100).toFixed(2),
  }))

  const headers = ['Nome', 'Email', 'CPF', 'Telefone', 'Plano', 'Status', 'Data Cadastro', 'Total Gasto (R$)']
  const keys: (keyof typeof rows[0])[] = ['nome', 'email', 'cpf', 'telefone', 'plano', 'status', 'data_cadastro', 'total_gasto_rs']

  let content: string
  let contentType: string
  let filename: string

  if (formato === 'txt') {
    const separator = '\t'
    content = [headers.join(separator), ...rows.map(r => keys.map(k => seguro(r[k])).join(separator))].join('\n')
    contentType = 'text/plain; charset=utf-8'
    filename = `usuarios_${new Date().toISOString().slice(0,10)}.txt`
  } else {
    content = [
      headers.join(','),
      ...rows.map(r => keys.map(k => `"${seguro(r[k]).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    contentType = 'text/csv; charset=utf-8'
    filename = `usuarios_${new Date().toISOString().slice(0,10)}.csv`
  }

  return new NextResponse('\uFEFF' + content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// src/app/api/admin/consulta/route.ts
// Proxy de leitura das views de admin. As views (admin_users, admin_metrics...) eram
// legíveis por QUALQUER usuário logado direto do navegador; agora o acesso direto é
// revogado (migration_seguranca_admin.sql) e o painel lê por aqui, após checar admin/equipe.
// Usado pelo helper src/lib/adminView.ts, que imita a sintaxe encadeada do supabase-js.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const FONTES = new Set(['admin_users', 'admin_metrics', 'admin_revenue', 'admin_signups_daily'])
const OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'not', 'or', 'order', 'limit', 'single'])
const COLUNA = /^[a-z_][a-z0-9_]*$/

type Op = [string, ...unknown[]]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).maybeSingle()
    if (profile?.role !== 'admin' && !staff) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { fonte, ops } = await req.json() as { fonte: string; ops: Op[] }
    if (!FONTES.has(fonte) || !Array.isArray(ops) || ops.length > 30) {
      return NextResponse.json({ error: 'Consulta inválida' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabaseAdmin.from(fonte).select('*')
    let single = false
    for (const [op, ...args] of ops) {
      if (!OPS.has(op)) return NextResponse.json({ error: `Operação não permitida: ${op}` }, { status: 400 })
      if (['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'not', 'order'].includes(op) && !COLUNA.test(String(args[0]))) {
        return NextResponse.json({ error: 'Coluna inválida' }, { status: 400 })
      }
      if (op === 'single') { single = true; continue }
      if (op === 'limit') { q = q.limit(Math.min(Number(args[0]) || 100, 1000)); continue }
      if (op === 'or' && typeof args[0] !== 'string') return NextResponse.json({ error: 'Filtro inválido' }, { status: 400 })
      q = q[op](...args)
    }

    const { data, error } = single ? await q.single() : await q
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 200 })
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[admin/consulta]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

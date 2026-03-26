import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'

type BalanceTable = 'user_tickets' | 'user_superlikes' | 'user_boosts' | 'user_lupas' | 'user_rewinds' | 'user_fichas'

async function addBalance(admin: ReturnType<typeof createAdminClient>, table: BalanceTable, user_id: string, amount: number) {
  const { data } = await admin.from(table).select('amount').eq('user_id', user_id).single()
  if (data) {
    return admin.from(table).update({ amount: data.amount + amount, updated_at: new Date().toISOString() }).eq('user_id', user_id)
  } else {
    return admin.from(table).insert({ user_id, amount, updated_at: new Date().toISOString() })
  }
}

export async function POST(req: NextRequest) {
  const sessionClient = await createServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { user_id, fichas, tickets, superlikes, boosts, lupas, rewinds } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatorio' }, { status: 400 })

  function parseQty(val: unknown): number | null {
    const n = Math.floor(Number(val))
    return Number.isFinite(n) && n >= 1 && n <= 99999 ? n : null
  }

  const admin = createAdminClient()
  const ops: Promise<any>[] = []

  if (fichas     != null) { const q = parseQty(fichas);     if (!q) return NextResponse.json({ error: 'fichas invalido (1-99999)'     }, { status: 400 }); ops.push(addBalance(admin, 'user_fichas',     user_id, q)) }
  if (tickets    != null) { const q = parseQty(tickets);    if (!q) return NextResponse.json({ error: 'tickets invalido (1-99999)'    }, { status: 400 }); ops.push(addBalance(admin, 'user_tickets',    user_id, q)) }
  if (superlikes != null) { const q = parseQty(superlikes); if (!q) return NextResponse.json({ error: 'superlikes invalido (1-99999)' }, { status: 400 }); ops.push(addBalance(admin, 'user_superlikes', user_id, q)) }
  if (boosts     != null) { const q = parseQty(boosts);     if (!q) return NextResponse.json({ error: 'boosts invalido (1-99999)'     }, { status: 400 }); ops.push(addBalance(admin, 'user_boosts',     user_id, q)) }
  if (lupas      != null) { const q = parseQty(lupas);      if (!q) return NextResponse.json({ error: 'lupas invalido (1-99999)'      }, { status: 400 }); ops.push(addBalance(admin, 'user_lupas',      user_id, q)) }
  if (rewinds    != null) { const q = parseQty(rewinds);    if (!q) return NextResponse.json({ error: 'rewinds invalido (1-99999)'    }, { status: 400 }); ops.push(addBalance(admin, 'user_rewinds',    user_id, q)) }

  if (ops.length === 0) return NextResponse.json({ error: 'Nenhum valor informado' }, { status: 400 })

  const results = await Promise.all(ops)
  const erro = results.find(r => r.error)
  if (erro) return NextResponse.json({ error: erro.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

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

  const admin = createAdminClient()
  const ops: Promise<any>[] = []

  if (fichas)     ops.push(addBalance(admin, 'user_fichas',     user_id, Number(fichas)))
  if (tickets)    ops.push(addBalance(admin, 'user_tickets',    user_id, Number(tickets)))
  if (superlikes) ops.push(addBalance(admin, 'user_superlikes', user_id, Number(superlikes)))
  if (boosts)     ops.push(addBalance(admin, 'user_boosts',     user_id, Number(boosts)))
  if (lupas)      ops.push(addBalance(admin, 'user_lupas',      user_id, Number(lupas)))
  if (rewinds)    ops.push(addBalance(admin, 'user_rewinds',    user_id, Number(rewinds)))

  if (ops.length === 0) return NextResponse.json({ error: 'Nenhum valor informado' }, { status: 400 })

  const results = await Promise.all(ops)
  const erro = results.find(r => r.error)
  if (erro) return NextResponse.json({ error: erro.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

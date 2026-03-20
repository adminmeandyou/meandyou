// src/app/api/admin/badges/route.ts
// CRUD de emblemas via service role — bypassa RLS da tabela badges
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && !staff) return null

  return user
}

// POST — criar emblema
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const payload = await req.json()
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('badges')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH — editar emblema
export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('badges')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE — excluir emblema
export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabaseAdmin = createAdminClient()

  await supabaseAdmin.from('user_badges').delete().eq('badge_id', id)
  const { error } = await supabaseAdmin.from('badges').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

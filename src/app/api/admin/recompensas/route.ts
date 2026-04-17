import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return user
  const { data: staff } = await supabase.from('staff_members').select('role').eq('user_id', user.id).eq('active', true).single()
  if (!staff?.role) return null
  return user
}

// GET — busca roleta_prizes e streak_calendar_template
export async function GET(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'roleta' | 'calendario'

  if (type === 'roleta') {
    const { data, error } = await supabaseAdmin
      .from('roleta_prizes')
      .select('id, reward_type, reward_amount, weight, active')
      .order('weight', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (type === 'calendario') {
    const { data, error } = await supabaseAdmin
      .from('streak_calendar_template')
      .select('day_number, reward_type, reward_amount')
      .order('day_number', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 })
}

// POST — cria novo prêmio na roleta
export async function POST(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const body = await req.json()
  const { type, reward_type, reward_amount, weight } = body

  if (type !== 'roleta') return NextResponse.json({ error: 'type inválido' }, { status: 400 })
  if (!reward_type || !reward_amount || !weight) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('roleta_prizes')
    .insert({ reward_type, reward_amount: Number(reward_amount), weight: Number(weight), active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PUT — atualiza prêmio existente (roleta ou calendário)
export async function PUT(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const body = await req.json()
  const { type } = body

  if (type === 'roleta') {
    const { id, reward_type, reward_amount, weight, active } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('roleta_prizes')
      .update({ reward_type, reward_amount: Number(reward_amount), weight: Number(weight), active })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'calendario') {
    const { day_number, reward_type, reward_amount } = body
    if (!day_number) return NextResponse.json({ error: 'day_number obrigatorio' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('streak_calendar_template')
      .upsert({ day_number: Number(day_number), reward_type, reward_amount: Number(reward_amount) }, { onConflict: 'day_number' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 })
}

// DELETE — remove prêmio da roleta
export async function DELETE(req: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabaseAdmin.from('roleta_prizes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

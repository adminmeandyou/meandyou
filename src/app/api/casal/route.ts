// src/app/api/casal/route.ts
// Gerencia perfil de casal para assinantes Black (M3)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/casal — retorna o perfil de casal ativo do usuario
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('couple_profiles')
    .select('id, user1_id, user2_id, status, invite_token, created_at, activated_at')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .not('status', 'eq', 'dissolved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ couple: null })

  // Buscar dados dos parceiros
  const partnerId = data.user1_id === user.id ? data.user2_id : data.user1_id
  const { data: partner } = await supabaseAdmin
    .from('public_profiles')
    .select('id, name, photo_best, plan')
    .eq('id', partnerId)
    .single()

  return NextResponse.json({ couple: { ...data, partner } })
}

// POST /api/casal — criar convite de casal
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  // Verificar plano Black
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'black') {
    return NextResponse.json({ error: 'Perfil de casal exclusivo para o plano Black' }, { status: 403 })
  }

  // Verificar se ja tem um casal ativo
  const { data: existing } = await supabaseAdmin
    .from('couple_profiles')
    .select('id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .not('status', 'eq', 'dissolved')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Voce ja tem um perfil de casal ativo' }, { status: 409 })
  }

  // Criar convite
  const { data: couple, error } = await supabaseAdmin
    .from('couple_profiles')
    .insert({ user1_id: user.id, status: 'pending' })
    .select('id, invite_token')
    .single()

  if (error || !couple) {
    return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 })
  }

  const inviteUrl = `https://www.meandyou.com.br/casal/aceitar?token=${couple.invite_token}`
  return NextResponse.json({ ok: true, inviteUrl, coupleId: couple.id })
}

// PATCH /api/casal — aceitar convite ou dissolver casal
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { action, token, coupleId } = await req.json()

  if (action === 'accept' && token) {
    const { data: couple } = await supabaseAdmin
      .from('couple_profiles')
      .select('id, user1_id, status')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single()

    if (!couple) return NextResponse.json({ error: 'Convite invalido ou expirado' }, { status: 404 })
    if (couple.user1_id === user.id) return NextResponse.json({ error: 'Voce nao pode aceitar seu proprio convite' }, { status: 400 })

    await supabaseAdmin.from('couple_profiles').update({
      user2_id: user.id,
      status: 'active',
      activated_at: new Date().toISOString(),
    }).eq('id', couple.id)

    // Atualizar couple_id em ambos os perfis
    await supabaseAdmin.from('profiles').update({ couple_id: couple.id }).eq('id', couple.user1_id)
    await supabaseAdmin.from('profiles').update({ couple_id: couple.id }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  }

  if (action === 'dissolve' && coupleId) {
    const { data: couple } = await supabaseAdmin
      .from('couple_profiles')
      .select('user1_id, user2_id')
      .eq('id', coupleId)
      .single()

    if (!couple) return NextResponse.json({ error: 'Casal nao encontrado' }, { status: 404 })
    if (couple.user1_id !== user.id && couple.user2_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    await supabaseAdmin.from('couple_profiles').update({ status: 'dissolved' }).eq('id', coupleId)
    await supabaseAdmin.from('profiles').update({ couple_id: null }).eq('id', couple.user1_id)
    if (couple.user2_id) {
      await supabaseAdmin.from('profiles').update({ couple_id: null }).eq('id', couple.user2_id)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acao invalida' }, { status: 400 })
}

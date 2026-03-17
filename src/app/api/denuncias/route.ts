import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_CATEGORIES = ['fake', 'inappropriate', 'harassment', 'spam', 'minor', 'other']

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const { reported_user_id, category, description } = await req.json()

    if (!reported_user_id || !category) {
      return NextResponse.json({ error: 'reported_user_id e category são obrigatórios' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 })
    }

    if (reported_user_id === user.id) {
      return NextResponse.json({ error: 'Não é possível denunciar a si mesmo' }, { status: 400 })
    }

    const { error: insertErr } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: reported_user_id,
      reason: category,
      details: description?.slice(0, 500) ?? null,
      status: 'pending',
    })

    if (insertErr) {
      console.error('Erro ao registrar denúncia:', insertErr)
      return NextResponse.json({ error: 'Erro ao registrar denúncia' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/denuncias error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

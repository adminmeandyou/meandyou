import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })

    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
    if (data.used) return NextResponse.json({ error: 'usado' }, { status: 400 })
    if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'expirado' }, { status: 400 })

    return NextResponse.json({ ok: true, userId: data.user_id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
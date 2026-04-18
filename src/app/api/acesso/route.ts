import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const COOKIE = 'may_gate'

export async function POST(req: NextRequest) {
  const { senha } = await req.json()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_config')
    .select('gate_ativo, gate_senha')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Configuracao indisponivel' }, { status: 500 })
  }

  if (!data.gate_ativo) {
    return NextResponse.json({ error: 'Gate inativo' }, { status: 404 })
  }

  if (!data.gate_senha || senha !== data.gate_senha) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, data.gate_senha, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  })
  return res
}

import { NextRequest, NextResponse } from 'next/server'

const SENHA = 'inativo123'
const COOKIE = 'may_gate'

export async function POST(req: NextRequest) {
  const { senha } = await req.json()

  if (senha !== SENHA) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, SENHA, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  })
  return res
}

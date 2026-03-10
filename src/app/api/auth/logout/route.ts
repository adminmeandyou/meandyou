import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })

  // Limpa os cookies de sessão do Supabase manualmente
  res.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' })
  res.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' })

  return res
}

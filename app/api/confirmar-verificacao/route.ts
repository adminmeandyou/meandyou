import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json()
    if (!token || !userId) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    // Valida o token novamente
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    if (tokenData.used) return NextResponse.json({ error: 'Token já utilizado' }, { status: 400 })
    if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Token expirado' }, { status: 400 })

    // Marca token como usado
    await supabase.from('verification_tokens').update({ used: true }).eq('token', token)

    // Marca usuário como verificado
    await supabase.from('users').update({ verified: true }).eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
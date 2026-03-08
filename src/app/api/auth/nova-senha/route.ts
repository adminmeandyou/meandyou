import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token, senha } = await req.json()
    if (!token || !senha) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    // Busca o token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    if (tokenData.used) return NextResponse.json({ error: 'Token já utilizado' }, { status: 400 })
    if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Token expirado' }, { status: 400 })

    // Atualiza a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: senha }
    )

    if (updateError) return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })

    // Marca token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
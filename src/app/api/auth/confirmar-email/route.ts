import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 400 })
    }

    // Buscar token válido e não utilizado
    const { data: tokenData, error: tokenErr } = await supabaseAdmin
      .from('email_change_tokens')
      .select('id, user_id, novo_email, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenErr || !tokenData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (tokenData.used_at) {
      return NextResponse.json({ error: 'Token já utilizado' }, { status: 400 })
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    // Atualizar email no Supabase Auth
    const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { email: tokenData.novo_email }
    )

    if (updateAuthErr) {
      console.error('Erro ao atualizar email no auth:', updateAuthErr)
      return NextResponse.json({ error: 'Erro ao atualizar email' }, { status: 500 })
    }

    // Atualizar na tabela users
    await supabaseAdmin
      .from('users')
      .update({ email: tokenData.novo_email })
      .eq('id', tokenData.user_id)

    // Marcar token como usado
    await supabaseAdmin
      .from('email_change_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao confirmar email:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

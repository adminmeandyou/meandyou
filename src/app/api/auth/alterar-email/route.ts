import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { sendEmailChangeConfirmEmail } from '@/app/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const { novo_email } = await req.json()
    if (!novo_email || !novo_email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    if (novo_email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'O novo email deve ser diferente do atual' }, { status: 400 })
    }

    // Verificar se o novo email já está em uso
    const { data: emailExiste } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', novo_email.toLowerCase())
      .maybeSingle()

    if (emailExiste) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 })
    }

    // Invalidar tokens anteriores deste usuário
    await supabaseAdmin
      .from('email_change_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('used_at', null)

    // Gerar novo token (30 minutos de validade)
    const changeToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { error: insertErr } = await supabaseAdmin
      .from('email_change_tokens')
      .insert({
        user_id: user.id,
        novo_email: novo_email.toLowerCase(),
        token: changeToken,
        expires_at: expiresAt,
      })

    if (insertErr) {
      console.error('Erro ao criar token de alteração:', insertErr)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Buscar nome do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    const nome = profile?.name?.split(' ')[0] ?? 'Usuário'

    await sendEmailChangeConfirmEmail(novo_email.toLowerCase(), nome, changeToken)

    return NextResponse.json({ success: true, message: 'Email de confirmação enviado' })
  } catch (err) {
    console.error('Erro ao alterar email:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

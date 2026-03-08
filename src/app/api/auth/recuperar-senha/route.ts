import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      // Retornamos sempre 200 por segurança — nunca revelamos se o e-mail existe
      return NextResponse.json({ ok: true })
    }

    // 1. Buscar usuário na tabela users (não listUsers — evita paginação)
    const { data: userRow } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Mesmo sem encontrar, retornamos 200 (não revelamos se existe)
    if (!userRow) {
      return NextResponse.json({ ok: true })
    }

    // 2. Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    // 3. Salvar token no banco (invalidando tokens anteriores desse usuário)
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', userRow.id)
      .eq('used', false)

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userRow.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (insertError) {
      console.error('Erro ao criar token de recuperação:', insertError)
      return NextResponse.json({ ok: true }) // Ainda retorna 200 por segurança
    }

    // 4. Montar link com domínio correto
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meandyou.com.br'
    const link = `${appUrl}/nova-senha?token=${token}`

    // 5. Enviar e-mail via Resend
    await resend.emails.send({
      from: 'MeAndYou <noreply@meandyou.com.br>',
      to: email,
      subject: '🔐 Redefinir sua senha — MeAndYou',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8faf9;">
          <h1 style="font-size: 28px; color: #111a17; margin-bottom: 4px;">
            MeAnd<span style="color: #2ec4a0;">You</span>
          </h1>
          <p style="color: #7a9189; font-size: 13px; margin-bottom: 32px;">Redefinição de senha</p>

          <p style="font-size: 16px; color: #111a17;">Olá! 👋</p>
          <p style="font-size: 15px; color: #444; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta no MeAndYou.
            Clique no botão abaixo para criar uma nova senha.
          </p>

          <div style="background: #fff; border: 1px solid #e0ebe8; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="font-size: 13px; color: #7a9189; margin-bottom: 16px;">⏱️ Link válido por <strong>30 minutos</strong></p>
            <a href="${link}"
               style="display: inline-block; background: #2ec4a0; color: #fff; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 100px; text-decoration: none;">
              🔐 Redefinir minha senha
            </a>
          </div>

          <p style="font-size: 13px; color: #7a9189; line-height: 1.6;">
            Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha continua a mesma.
          </p>
          <p style="font-size: 12px; color: #aaa; margin-top: 16px;">
            Por segurança, nunca compartilhe este link com ninguém.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em recuperar-senha:', err)
    // Sempre 200 — nunca revela se e-mail existe ou não
    return NextResponse.json({ ok: true })
  }
}

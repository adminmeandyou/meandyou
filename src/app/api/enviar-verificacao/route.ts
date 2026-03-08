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
    const { userId, email, nome } = await req.json()
    if (!userId || !email) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const { error } = await supabase.from('verification_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })
    if (error) return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/verificacao?token=${token}`

    await resend.emails.send({
      from: 'MeAndYou <noreply@meandyou.com.br>',
      to: email,
      subject: '📱 Verifique sua identidade no MeAndYou',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8faf9;">
          <h1 style="font-size: 28px; color: #111a17; margin-bottom: 4px;">
            MeAnd<span style="color: #2ec4a0;">You</span>
          </h1>
          <p style="color: #7a9189; font-size: 13px; margin-bottom: 32px;">Verificação de identidade</p>

          <p style="font-size: 16px; color: #111a17;">Olá${nome ? ', ' + nome : ''}! 👋</p>
          <p style="font-size: 15px; color: #444; line-height: 1.6;">
            Seu perfil está quase pronto! O último passo é verificar sua identidade pelo celular.
            Isso garante que todos os perfis na plataforma são de pessoas reais.
          </p>

          <div style="background: #fff; border: 1px solid #e0ebe8; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="font-size: 13px; color: #7a9189; margin-bottom: 16px;">⏱️ Link válido por <strong>30 minutos</strong></p>
            <a href="${link}" style="display: inline-block; background: #2ec4a0; color: #fff; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 100px; text-decoration: none;">
              📱 Verificar identidade
            </a>
            <p style="font-size: 12px; color: #7a9189; margin-top: 16px;">Abra este link no seu celular</p>
          </div>

          <p style="font-size: 13px; color: #7a9189; line-height: 1.6;">
            Se você não criou uma conta no MeAndYou, ignore este email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

Só mudou uma linha:
```
from: 'MeAndYou <noreply@meandyou.com.br>'
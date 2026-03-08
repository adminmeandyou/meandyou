import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email, senha, nomeCompleto, nomeExibicao, telefone, refCode } = await req.json()

    if (!email || !senha || !nomeCompleto || !nomeExibicao || !telefone) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome_completo: nomeCompleto,
        nome_exibicao: nomeExibicao,
        telefone,
      },
    })

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Este email já está cadastrado.'
        : error.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = data.user.id

    // Atualiza tabela users
    await supabase.from('users').update({
      phone: telefone,
      nome_completo: nomeCompleto,
    }).eq('id', userId)

    // Vincula indicação se veio de referral
    if (refCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode)
        .single()

      if (referrer && referrer.id !== userId) {
        await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', userId)
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: userId,
          status: 'pending',
        })
      }
    }

    // Envia email de boas-vindas via Resend
    await resend.emails.send({
      from: 'MeAndYou <noreply@meandyou.com.br>',
      to: email,
      subject: '💚 Bem-vindo(a) ao MeAndYou!',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8faf9;">
          <h1 style="font-size: 28px; color: #111a17; margin-bottom: 4px;">
            MeAnd<span style="color: #2ec4a0;">You</span>
          </h1>
          <p style="color: #7a9189; font-size: 13px; margin-bottom: 32px;">Conexões reais</p>

          <p style="font-size: 16px; color: #111a17;">Olá, <strong>${nomeExibicao}</strong>! 👋</p>
          <p style="font-size: 15px; color: #444; line-height: 1.6;">
            Sua conta foi criada com sucesso! O próximo passo é completar seu perfil
            e verificar sua identidade para começar a usar o app.
          </p>

          <div style="background: #fff; border: 1px solid #e0ebe8; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/perfil" style="display: inline-block; background: #2ec4a0; color: #fff; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 100px; text-decoration: none;">
              💚 Completar meu perfil
            </a>
          </div>

          <p style="font-size: 13px; color: #7a9189; line-height: 1.6;">
            Se você não criou uma conta no MeAndYou, ignore este email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
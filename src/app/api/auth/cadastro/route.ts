// src/app/api/auth/cadastro/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, senha, nomeCompleto, nomeExibicao, telefone, cpf, refCode, cfToken } = await req.json()

    if (!email || !senha || !nomeCompleto || !nomeExibicao || !telefone || !cpf) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    // Verificar Cloudflare Turnstile (se configurado)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret) {
      if (!cfToken) {
        return NextResponse.json({ error: 'Verificação de segurança necessária' }, { status: 400 })
      }
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret:   turnstileSecret,
          response: cfToken,
          remoteip: req.headers.get('x-forwarded-for') ?? undefined,
        }),
      })
      const turnstileData = await turnstileRes.json()
      if (!turnstileData.success) {
        return NextResponse.json({ error: 'Verificação de segurança falhou. Tente novamente.' }, { status: 400 })
      }
    }

    // 1. Verificar CPF duplicado — 1 conta por CPF
    const { data: cpfExistente } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', cpf)
      .single()

    if (cpfExistente) {
      return NextResponse.json(
        { error: 'Já existe uma conta cadastrada com este CPF.' },
        { status: 400 }
      )
    }

    // 2. Criar usuário no Supabase Auth
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

    // 3. Atualizar tabela users com CPF e telefone
    await supabase.from('users').update({
      phone: telefone,
      nome_completo: nomeCompleto,
      cpf,
    }).eq('id', userId)

    // 4. Inicializar saldos zerados
    const saldoResults = await Promise.allSettled([
      supabase.from('user_tickets').insert({ user_id: userId, amount: 0 }),
      supabase.from('user_lupas').insert({ user_id: userId, amount: 0 }),
      supabase.from('user_superlikes').insert({ user_id: userId, amount: 0 }),
      supabase.from('user_boosts').insert({ user_id: userId, amount: 0 }),
      supabase.from('user_rewinds').insert({ user_id: userId, amount: 0 }),
      supabase.from('daily_streaks').insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_login_date: null,
      }),
    ])
    saldoResults.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`Inicializar saldo[${i}] error:`, r.reason)
    })

    // 5. Vincular indicação se veio de referral
    if (refCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode)
        .single()

      if (referrer && referrer.id !== userId) {
        await supabase.from('profiles')
          .update({ referred_by: referrer.id })
          .eq('id', userId)

        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: userId,
          status: 'pending',
        })

        // Novo usuário indicado ganha 3 tickets de boas-vindas
        await supabase.from('user_tickets')
          .update({ amount: 3 })
          .eq('user_id', userId)
      }
    }

    // 6. Email de boas-vindas via lib/email.ts
    await sendWelcomeEmail(email, nomeExibicao)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// src/app/api/auth/cadastro/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function validarCPF(cpf: string): boolean {
  // Remove pontuação
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11) return false
  // Rejeita sequências iguais (000...000, 111...111 etc.)
  if (/^(\d)\1{10}$/.test(c)) return false
  // Valida primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(c[9])) return false
  // Valida segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(c[10])
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha, nomeCompleto, nomeExibicao, telefone, cpf, refCode, cfToken } = await req.json()

    if (!email || !senha || !nomeCompleto || !nomeExibicao || !telefone || !cpf) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    if (nomeExibicao.trim().length < 2) {
      return NextResponse.json({ error: 'O nome na plataforma deve ter pelo menos 2 caracteres' }, { status: 400 })
    }

    if (!validarCPF(cpf)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    // Verificar Cloudflare Turnstile (se configurado)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (!turnstileSecret && process.env.NODE_ENV === 'production') {
      console.warn('[cadastro] ATENÇÃO: TURNSTILE_SECRET_KEY não configurado em produção — captcha desabilitado!')
    }
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
    // O trigger handle_new_user cria a linha em public.users logo após o insert em auth.users.
    // Aguardamos até 5 tentativas × 500ms (2,5s). Se ainda assim falhar, fazemos upsert direto
    // para garantir que o CPF não se perca — o trigger vai ignorar o insert posterior via ON CONFLICT.
    let cpfSalvo = false
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ phone: telefone, nome_completo: nomeCompleto, cpf })
        .eq('id', userId)
        .select('id')
        .single()
      if (updatedUser) { cpfSalvo = true; break }
      await new Promise(r => setTimeout(r, 500))
    }
    if (!cpfSalvo) {
      // Fallback: upsert direto — garante o CPF mesmo se o trigger ainda não criou a linha
      console.warn('Trigger lento — usando upsert direto para userId:', userId)
      try {
        await supabase.from('users').upsert(
          { id: userId, email, phone: telefone, nome_completo: nomeCompleto, cpf, verified: false, banned: false },
          { onConflict: 'id' }
        )
        cpfSalvo = true
      } catch (upsertErr) {
        console.error('Upsert de fallback falhou para userId:', userId, upsertErr)
      }
    }

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
        // ✅ CORREÇÃO: retry no update de profiles.referred_by — mesmo race condition do trigger
        for (let tentativa = 0; tentativa < 3; tentativa++) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', userId)
            .select('id')
            .single()
          if (updatedProfile) break
          await new Promise(r => setTimeout(r, 300))
        }

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

    // 6. Email de boas-vindas via lib/email.ts (fire-and-forget — não bloqueia resposta)
    sendWelcomeEmail(email, nomeExibicao).catch(err =>
      console.error('[cadastro] Falha ao enviar email de boas-vindas:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

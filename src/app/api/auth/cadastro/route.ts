// src/app/api/auth/cadastro/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendInstitutionalEmail } from '@/app/lib/email'
import { randomUUID } from 'crypto'

const APP_URL = 'https://www.meandyou.com.br'

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
      const m = error.message.toLowerCase()
      const msg = (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists') || m.includes('user already'))
        ? 'Este email já está cadastrado.'
        : error.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = data.user.id

    // Helper: desfaz o usuário do Auth se algo falhar (evita conta fantasma)
    async function rollback(motivo: string) {
      console.error(`[cadastro] rollback — ${motivo}`)
      try { await supabase.auth.admin.deleteUser(userId) } catch (e) {
        console.error('[cadastro] falha ao deletar usuário no rollback:', e)
      }
    }

    // 3. Atualizar tabela users com CPF e telefone
    // O trigger handle_new_user cria a linha em public.users logo após o insert em auth.users.
    // Aguardamos até 5 tentativas × 500ms (2,5s). Se ainda assim falhar, fazemos upsert direto.
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
      // Fallback: upsert direto
      console.warn('Trigger lento — usando upsert direto para userId:', userId)
      const { error: upsertErr } = await supabase.from('users').upsert(
        { id: userId, email, phone: telefone, nome_completo: nomeCompleto, cpf, verified: false, banned: false },
        { onConflict: 'id' }
      )
      if (upsertErr) {
        await rollback('upsert de users falhou: ' + upsertErr.message)
        return NextResponse.json({ error: 'Erro ao salvar dados. Tente novamente.' }, { status: 500 })
      }
      cpfSalvo = true
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

    // 6. Gerar token de verificação de email (expira em 30 min)
    const verifyToken = randomUUID()
    const verifyExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Salvar token e marcar email como não verificado
    await supabase.from('users').update({
      email_verified: false,
      email_verify_token: verifyToken,
      email_verify_token_expires_at: verifyExpiresAt,
    }).eq('id', userId)

    // Inicializar campos de progresso do cadastro no profile
    for (let t = 0; t < 3; t++) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({
          reg_credentials_set:    true,
          reg_email_verified:     false,
          reg_document_verified:  true,  // CPF validado algoritmicamente acima
          reg_facial_verified:    false,
          reg_name_confirmed:     true,
          reg_username_confirmed: true,
          reg_invite_provided:    !!refCode,
          reg_invite_code:        refCode || null,
          onboarding_completed:   false,
        })
        .eq('id', userId)
        .select('id')
        .single()
      if (updated) break
      await new Promise(r => setTimeout(r, 400))
    }

    // Enviar email de verificação (fire-and-forget)
    const verifyLink = `${APP_URL}/verificar-email?token=${verifyToken}`
    sendInstitutionalEmail(
      email,
      nomeExibicao,
      'Confirme seu email - MeAndYou',
      'Confirme seu email',
      'Para acessar o MeAndYou, precisamos confirmar seu endereço de email. Clique no botão abaixo — o link expira em 30 minutos.',
      'Verificar email',
      verifyLink
    ).catch(err => console.error('[cadastro] Falha ao enviar email de verificacao:', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

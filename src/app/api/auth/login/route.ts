// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    // 1. Verificar rate limiting
    const { data: limitData } = await supabaseAdmin.rpc('check_login_attempts', {
      p_email: email,
    })

    if (limitData?.blocked) {
      const blockedUntil = new Date(limitData.blocked_until)
      const minutesLeft = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)

      return NextResponse.json({
        error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`,
        blocked: true,
      }, { status: 429 })
    }

    // 2. Tentar login
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    // 3. Registrar tentativa
    await supabaseAdmin.rpc('register_login_attempt', {
      p_email: email,
      p_ip: ip,
      p_success: !authError,
    })

    if (authError) {
      const remainingAttempts = 3 - (limitData?.attempts ?? 0) - 1
      return NextResponse.json({
        error: remainingAttempts > 0
          ? `Email ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).`
          : 'Conta bloqueada temporariamente por 15 minutos.',
        remaining_attempts: Math.max(remainingAttempts, 0),
      }, { status: 401 })
    }

    // 4. Verificar se está banido
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('banned')
      .eq('id', authData.user.id)
      .single()

    if (userRow?.banned) {
      return NextResponse.json({
        error: 'Sua conta foi suspensa. Entre em contato com o suporte.',
        banned: true,
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      session: authData.session,
      user: authData.user,
    })

  } catch (err) {
    console.error('Erro no login:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
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

    // 1. Rate limit
    const { data: limitData } = await supabaseAdmin.rpc('check_login_attempts', {
      p_email: email,
    })

    if (limitData?.blocked) {
      const minutesLeft = Math.ceil(
        (new Date(limitData.blocked_until).getTime() - Date.now()) / 60000
      )
      return NextResponse.json({
        error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`,
        blocked: true,
      }, { status: 429 })
    }

    // 2. Login
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

    const userId = authData.user.id

    // 4. Verificar banimento
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('banned, verified')
      .eq('id', userId)
      .single()

    if (userRow?.banned) {
      return NextResponse.json({
        error: 'Sua conta foi suspensa. Entre em contato com o suporte.',
        banned: true,
      }, { status: 403 })
    }

    // 5. Atualizar streak e last_active_at (fire-and-forget — não bloqueia o login)
    Promise.all([
      supabaseAdmin.rpc('update_streak', { p_user_id: userId }),
      supabaseAdmin.from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId),
    ]).catch(err => console.error('Erro ao atualizar streak/last_active:', err))

    // 6. Setar cookies de sessão manualmente na resposta
    // signInWithPassword em API Route NÃO seta cookie automaticamente
    const response = NextResponse.json({
      success: true,
      user: authData.user,
      verified: userRow?.verified ?? false,
    })

    const { access_token, refresh_token, expires_at } = authData.session

    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    })

    return response

  } catch (err) {
    console.error('Erro no login:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

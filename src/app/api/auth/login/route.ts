// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

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

    // 2. Verificar banimento ANTES de criar sessão
    // ✅ CORREÇÃO: ban check agora ocorre antes de signInWithPassword.
    // Antes: a sessão já existia no Supabase Auth quando retornávamos 403 para banidos.
    const { data: userPrecheck } = await supabaseAdmin
      .from('users')
      .select('id, banned')
      .eq('email', email)
      .single()

    if (userPrecheck?.banned) {
      await supabaseAdmin.rpc('register_login_attempt', { p_email: email, p_ip: ip, p_success: false })
      return NextResponse.json({
        error: 'Sua conta foi suspensa. Entre em contato com o suporte.',
        banned: true,
      }, { status: 403 })
    }

    // 3. Login
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    // 4. Registrar tentativa
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

    // 5. Buscar dados do usuário (verified, etc.) — banned já foi checado acima
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('verified')
      .eq('id', userId)
      .single()

    // 6. Atualizar streak e last_active_at (fire-and-forget — não bloqueia o login)
    Promise.all([
      supabaseAdmin.rpc('update_streak', { p_user_id: userId }),
      supabaseAdmin.from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId),
    ]).catch(err => console.error('Erro ao atualizar streak/last_active:', err))

    // 7. Setar cookies de sessão usando createServerClient do @supabase/ssr
    // ✅ CORREÇÃO CRÍTICA: cookies sb-access-token/sb-refresh-token separados NÃO são
    // reconhecidos pelo createServerClient do proxy. O formato correto é
    // sb-[project-ref]-auth-token (JSON com toda a sessão), gerenciado pelo SSR client.
    const response = NextResponse.json({
      success: true,
      user: authData.user,
      verified: userRow?.verified ?? false,
    })

    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await ssrClient.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    })

    return response

  } catch (err) {
    console.error('Erro no login:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

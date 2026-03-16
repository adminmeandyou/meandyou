// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { createHash, randomBytes } from 'crypto'
import {
  sendAccountBlockedEmail,
  sendSuspiciousLoginEmail,
  sendNewDeviceLoginEmail,
} from '@/app/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: busca nome do usuário pelo id (fire-and-forget, ignora erro)
async function getNome(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('profiles').select('name').eq('id', userId).single()
  return data?.name?.split(' ')[0] ?? 'Usuário'
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'desconhecido'
    const ua = req.headers.get('user-agent') ?? 'Dispositivo desconhecido'

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

      // Notificar o usuário que a conta foi bloqueada (fire-and-forget)
      ;(async () => {
        try {
          const { data: u } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
          if (!u) return
          const nome = await getNome(u.id)
          await sendAccountBlockedEmail(email, nome, minutesLeft)
        } catch {}
      })()

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
      const currentAttempts = (limitData?.attempts ?? 0) + 1
      const remainingAttempts = 3 - currentAttempts

      // Notificar sobre tentativas suspeitas a partir da 3ª falha (fire-and-forget)
      if (currentAttempts >= 3 && userPrecheck?.id) {
        getNome(userPrecheck.id).then(nome => {
          sendSuspiciousLoginEmail(email, nome, currentAttempts).catch(() => {})
        }).catch(() => {})
      }

      return NextResponse.json({
        error: remainingAttempts > 0
          ? `Email ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).`
          : 'Conta bloqueada temporariamente por 15 minutos.',
        remaining_attempts: Math.max(remainingAttempts, 0),
      }, { status: 401 })
    }

    const userId = authData.user.id

    // 5. Buscar dados do usuário (verified, totp, etc.) — banned já foi checado acima
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('verified, known_ua_hashes, totp_enabled')
      .eq('id', userId)
      .single()

    // 5b. Se 2FA ativo, não criar sessão ainda — retornar temp_token
    if ((userRow as any)?.totp_enabled) {
      const tempToken = randomBytes(32).toString('hex')
      await supabaseAdmin.from('auth_2fa_pending').insert({
        user_id: userId,
        temp_token: tempToken,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      })
      return NextResponse.json({ requires_2fa: true, temp_token: tempToken })
    }

    // 6. Detectar novo dispositivo (fire-and-forget)
    // Requer coluna `known_ua_hashes text[]` na tabela users (ver migration_security.sql)
    const uaHash = createHash('sha256').update(ua).digest('hex').slice(0, 16)
    const knownHashes: string[] = (userRow as any)?.known_ua_hashes ?? []
    if (!knownHashes.includes(uaHash)) {
      ;(async () => {
        try {
          const nome = await getNome(userId)
          await sendNewDeviceLoginEmail(email, nome, ua.slice(0, 80), ip)
        } catch {}
      })()

      // Armazena o novo hash (mantém os últimos 10)
      ;(async () => {
        try {
          await supabaseAdmin.from('users').update({
            known_ua_hashes: [...knownHashes.slice(-9), uaHash],
          }).eq('id', userId)
        } catch {}
      })()
    }

    // 7a. Registrar sessão ativa (fire-and-forget)
    const deviceInfo = ua.slice(0, 200)
    ;(async () => {
      try {
        await supabaseAdmin.from('user_sessions').insert({
          user_id: userId,
          ip,
          user_agent: ua.slice(0, 500),
          device_info: deviceInfo,
        })
      } catch {}
    })()

    // 7b. Atualizar streak e last_active_at (fire-and-forget — não bloqueia o login)
    Promise.all([
      supabaseAdmin.rpc('update_streak', { p_user_id: userId }),
      supabaseAdmin.from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId),
    ]).catch(err => console.error('Erro ao atualizar streak/last_active:', err))

    // 8. Setar cookies de sessão usando createServerClient do @supabase/ssr
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

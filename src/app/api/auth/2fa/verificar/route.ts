import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { verify } from 'otplib'
import { createHash } from 'crypto'
import { decryptSecret } from '../gerar/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { temp_token, codigo } = await req.json()
    if (!temp_token || !codigo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Buscar o pending token
    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from('auth_2fa_pending')
      .select('*')
      .eq('temp_token', temp_token)
      .single()

    if (pendingErr || !pending) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }

    if (new Date(pending.expires_at) < new Date()) {
      await supabaseAdmin.from('auth_2fa_pending').delete().eq('temp_token', temp_token)
      return NextResponse.json({ error: 'Token expirado. Faça login novamente.' }, { status: 400 })
    }

    // Verificar código TOTP
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('totp_secret, totp_backup_codes')
      .eq('id', pending.user_id)
      .single()

    if (!userData?.totp_secret) {
      return NextResponse.json({ error: 'Erro de configuração 2FA' }, { status: 500 })
    }

    const secret = decryptSecret(userData.totp_secret)
    let autenticado: boolean = !!(await verify({ secret, token: codigo }))

    // Verificar código de backup se TOTP falhou
    if (!autenticado && userData.totp_backup_codes?.length) {
      const codigoNormalizado = codigo.toUpperCase().replace(/\s/g, '')
      const hash = createHash('sha256').update(codigoNormalizado).digest('hex')
      const idx = userData.totp_backup_codes.indexOf(hash)
      if (idx !== -1) {
        autenticado = true
        // Remover código de backup usado
        const novosCodigos = [...userData.totp_backup_codes]
        novosCodigos.splice(idx, 1)
        await supabaseAdmin.from('users').update({ totp_backup_codes: novosCodigos }).eq('id', pending.user_id)
      }
    }

    if (!autenticado) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    // Deletar pending token
    await supabaseAdmin.from('auth_2fa_pending').delete().eq('temp_token', temp_token)

    // Setar cookies de sessão
    const response = NextResponse.json({ success: true })
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
      access_token: pending.access_token,
      refresh_token: pending.refresh_token,
    })

    return response
  } catch (err) {
    console.error('Erro ao verificar 2FA:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

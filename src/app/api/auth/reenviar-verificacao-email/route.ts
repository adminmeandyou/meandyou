// src/app/api/auth/reenviar-verificacao-email/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendInstitutionalEmail } from '@/app/lib/email'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://www.meandyou.com.br'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('email, email_verified, email_verify_token_expires_at')
      .eq('id', userId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (userRow.email_verified) {
      return NextResponse.json({ error: 'Email já verificado' }, { status: 400 })
    }

    // Rate limit: só reenviar se o token atual expirou ou se falta menos de 27min (3 reenvios/hora = 1 a cada 20min)
    if (userRow.email_verify_token_expires_at) {
      const expiresAt = new Date(userRow.email_verify_token_expires_at)
      const minutosRestantes = (expiresAt.getTime() - Date.now()) / 60000
      if (minutosRestantes > 27) {
        const aguardar = Math.ceil(minutosRestantes - 27)
        return NextResponse.json(
          { error: `Aguarde ${aguardar} minuto(s) antes de reenviar.` },
          { status: 429 }
        )
      }
    }

    // Gerar novo token
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await supabase
      .from('users')
      .update({ email_verify_token: token, email_verify_token_expires_at: expiresAt })
      .eq('id', userId)

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single()

    const nome = profile?.name || 'novo membro'
    const link = `${APP_URL}/verificar-email?token=${token}`

    await sendInstitutionalEmail(
      userRow.email,
      nome,
      'Confirme seu email - MeAndYou',
      'Confirme seu email',
      'Clique no botão abaixo para verificar seu endereço de email e acessar o MeAndYou. Este link expira em 30 minutos.',
      'Verificar email',
      link
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reenviar-verificacao-email]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

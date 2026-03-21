// src/app/api/auth/verificar-email/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    // 1. Buscar usuário com este token que ainda não expirou
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, email_verified, email_verify_token_expires_at')
      .eq('email_verify_token', token)
      .single()

    if (error || !userRow) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 })
    }

    if (userRow.email_verified) {
      return NextResponse.json({ ok: true, jaVerificado: true })
    }

    if (new Date(userRow.email_verify_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 })
    }

    const userId = userRow.id

    // 2. Marcar email como verificado e limpar token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verify_token: null,
        email_verify_token_expires_at: null,
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao verificar email. Tente novamente.' }, { status: 500 })
    }

    // 3. Avançar cadastro_step para 1 (email verificado, onboarding pendente)
    await supabase
      .from('profiles')
      .update({ cadastro_step: 1 })
      .eq('id', userId)
      .lt('cadastro_step', 1)

    // 4. Email de boas-vindas (fire-and-forget)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single()

    sendWelcomeEmail(userRow.email, profile?.name || 'novo membro').catch(err =>
      console.error('[verificar-email] Falha ao enviar email de boas-vindas:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verificar-email]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

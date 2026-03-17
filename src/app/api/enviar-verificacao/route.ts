// src/app/api/enviar-verificacao/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, email, nome } = await req.json()
    if (!userId || !email) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // 1. Rate limit: máximo 3 reenvios por hora por usuário
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('verification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', umaHoraAtras)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Limite de reenvios atingido. Aguarde 1 hora antes de tentar novamente.' },
        { status: 429 }
      )
    }

    // 2. Invalidar tokens anteriores não utilizados do mesmo usuário
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false)

    // 3. Gerar novo token (30 minutos de validade)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const { error } = await supabase.from('verification_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (error) {
      return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })
    }

    // 4. Enviar email via lib/email.ts (fire-and-forget — token já está no banco)
    const primeiroNome = nome?.split(' ')[0] || ''
    sendVerificationEmail(email, primeiroNome, token).catch(err =>
      console.error('[enviar-verificacao] Falha ao enviar email:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em enviar-verificacao:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

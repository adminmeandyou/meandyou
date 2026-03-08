// src/app/api/auth/recuperar-senha/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Sempre retorna 200 por segurança — nunca revela se o email existe
    if (!email) return NextResponse.json({ ok: true })

    // 1. Buscar usuário na tabela users (nunca listUsers)
    const { data: userRow } = await supabase
      .from('users')
      .select('id, nome_completo')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!userRow) return NextResponse.json({ ok: true })

    // 2. Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    // 3. Invalidar tokens anteriores do mesmo usuário
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', userRow.id)
      .eq('used', false)

    // 4. Inserir novo token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userRow.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (insertError) {
      console.error('Erro ao criar token:', insertError)
      return NextResponse.json({ ok: true })
    }

    // 5. Enviar email via lib/email.ts
    const nome = userRow.nome_completo?.split(' ')[0] || 'Olá'
    await sendPasswordResetEmail(email, nome, token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em recuperar-senha:', err)
    return NextResponse.json({ ok: true }) // Sempre 200
  }
}

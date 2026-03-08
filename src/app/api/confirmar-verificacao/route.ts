// src/app/api/confirmar-verificacao/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json()
    if (!token || !userId) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // 1. Validar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }
    if (tokenData.used) {
      return NextResponse.json({ error: 'Token já utilizado' }, { status: 400 })
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expirado. Solicite um novo link.' }, { status: 400 })
    }

    // 2. Marcar token como usado
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('token', token)

    // 3. Marcar usuário como verificado em `users` (nunca em `profiles`)
    await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', userId)

    // 4. Atualizar completude do perfil — verificação vale 15 pontos
    // Recalcula somando ao valor atual sem sobrescrever os outros campos
    const { data: profileData } = await supabase
      .from('profiles')
      .select('profile_completeness')
      .eq('id', userId)
      .single()

    if (profileData) {
      const novaCompletude = Math.min(
        (profileData.profile_completeness ?? 0) + 15,
        100
      )
      await supabase
        .from('profiles')
        .update({ profile_completeness: novaCompletude })
        .eq('id', userId)
    }

    // 5. Atualizar score do perfil (verificação aumenta credibilidade)
    await supabase.rpc('update_profile_score', { p_user_id: userId })
      .catch(err => console.error('Erro ao atualizar score:', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em confirmar-verificacao:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

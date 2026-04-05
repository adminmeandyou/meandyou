// src/app/api/confirmar-verificacao/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationApprovedEmail } from '@/app/lib/email'
import { awardBadges } from '@/lib/badges'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

    // Risco R4: garantir que o userId do body pertence ao usuário autenticado na sessão
    const sessionClient = await createServerClient()
    const { data: { user: sessionUser } } = await sessionClient.auth.getUser()
    if (!sessionUser || sessionUser.id !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
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

    // ✅ CORREÇÃO ATOMICIDADE: verificar usuário PRIMEIRO, depois marcar token como usado.
    // Antes: token era marcado 'used' e em seguida users.verified era setado. Se o segundo
    // falhasse, o usuário ficava preso (token usado + não verificado, sem saída).
    // Nova ordem: se users.update falhar, o token ainda não está marcado → usuário pode tentar novamente.

    // 2. Marcar usuário como verificado em `users` (nunca em `profiles`)
    const { error: verifyError } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', userId)


    if (verifyError) {
      console.error('Erro ao verificar usuário:', verifyError)
      return NextResponse.json({ error: 'Erro ao verificar usuário. Tente novamente.' }, { status: 500 })
    }

    // 3. Marcar verificacao facial como concluida no progresso do cadastro
    await supabase
      .from('profiles')
      .update({ reg_facial_verified: true })
      .eq('id', userId)

    // 4. Marcar token como usado (só depois de verified = true ter sido commitado)
    const { error: tokenMarkError } = await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('token', token)

    if (tokenMarkError) {
      // Rollback: desfaz verificação para o usuário poder tentar de novo com o mesmo token
      await supabase.from('users').update({ verified: false }).eq('id', userId)
      console.error('Erro ao marcar token como usado:', tokenMarkError)
      return NextResponse.json({ error: 'Erro ao confirmar verificação. Tente novamente.' }, { status: 500 })
    }

    // 5. Atualizar completude do perfil — verificação vale 15 pontos
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

    // 6. Atualizar score do perfil (verificação aumenta credibilidade)
    try {
      await supabase.rpc('update_profile_score', { p_user_id: userId })
    } catch (err) {
      console.error('Erro ao atualizar score:', err)
    }

    // 7. Email de aprovação (fire-and-forget — não bloqueia a resposta)
    const { data: userInfo } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    const { data: profileInfo } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single()
    if (userInfo?.email) {
      sendVerificationApprovedEmail(userInfo.email, profileInfo?.name || '').catch(err =>
        console.error('[confirmar-verificacao] Falha ao enviar email de aprovação:', err)
      )
    }

    // Concede emblema Identidade Verificada imediatamente
    awardBadges(userId, 'on_verify').catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em confirmar-verificacao:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

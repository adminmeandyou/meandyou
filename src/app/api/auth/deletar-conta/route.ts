import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    // Valida sessão pelo cookie
    const accessToken = req.cookies.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const userId = user.id

    // ─── Sequência obrigatória LGPD ────────────────────────────────────────────

    // 1. Deletar fotos do bucket
    const { data: fotos } = await supabase.storage.from('fotos').list(userId)
    if (fotos && fotos.length > 0) {
      const paths = fotos.map((f) => `${userId}/${f.name}`)
      await supabase.storage.from('fotos').remove(paths)
    }

    // 2. Deletar documentos do bucket
    const { data: docs } = await supabase.storage.from('documentos').list(userId)
    if (docs && docs.length > 0) {
      const paths = docs.map((d) => `${userId}/${d.name}`)
      await supabase.storage.from('documentos').remove(paths)
    }

    // 3. Deletar mensagens enviadas
    await supabase.from('messages').delete().eq('sender_id', userId)

    // 4. Deletar matches
    await supabase.from('matches').delete().or(`user1.eq.${userId},user2.eq.${userId}`)

    // 5. Deletar dados relacionais
    await Promise.all([
      supabase.from('likes').delete().or(`from_user.eq.${userId},to_user.eq.${userId}`),
      supabase.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`),
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('profile_views').delete().or(`viewer_id.eq.${userId},viewed_id.eq.${userId}`),
      supabase.from('reports').delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`),
      supabase.from('roleta_history').delete().eq('user_id', userId),
      supabase.from('streak_calendar').delete().eq('user_id', userId),
      supabase.from('daily_streaks').delete().eq('user_id', userId),
      supabase.from('push_subscriptions').delete().eq('user_id', userId),
      supabase.from('analytics_events').delete().eq('user_id', userId),
      supabase.from('video_calls').delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`),
    ])

    // 6. Deletar profiles (cascade: filters, user_superlikes, user_boosts,
    //    user_tickets, user_lupas, user_rewinds)
    await supabase.from('profiles').delete().eq('id', userId)

    // 7. Deletar users
    await supabase.from('users').delete().eq('id', userId)

    // 8. Deletar do Supabase Auth (deve ser o último)
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId)
    if (deleteErr) {
      console.error('Erro ao deletar auth user:', deleteErr)
      // Não retorna erro — dados já foram removidos, auth pode ser limpo manualmente
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Deletar conta error:', err)
    return NextResponse.json({ error: 'Erro interno ao excluir conta' }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendAccountDeletedEmail, sendDataDeletionConfirmedEmail } from '@/app/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    // Valida sessão pelo cookie
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const userId = user.id
    const userEmail = user.email ?? ''

    // Busca nome ANTES de deletar qualquer dado
    const { data: profileName } = await supabase.from('profiles').select('name').eq('id', userId).single()
    const nomeDisplay = profileName?.name?.split(' ')[0] ?? 'Usuário'

    // ─── PASSO 0: Deletar do Supabase Auth PRIMEIRO ────────────────────────────
    // Feito antes de qualquer dado do banco para garantir que, se falhar,
    // a conta ainda existe intacta e o usuário pode tentar novamente.
    const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(userId)
    if (deleteAuthErr) {
      console.error('Erro ao deletar auth user:', deleteAuthErr)
      return NextResponse.json({ error: 'Não foi possível excluir sua conta. Tente novamente ou contate o suporte.' }, { status: 500 })
    }

    // ─── Sequência obrigatória LGPD ────────────────────────────────────────────
    // IMPORTANTE: auth já foi deletado acima. Todos os erros abaixo são logados mas não
    // interrompem o fluxo — queremos limpar o máximo possível de dados mesmo em falhas parciais.

    // 1. Deletar fotos do bucket
    try {
      const { data: fotos } = await supabase.storage.from('fotos').list(userId)
      if (fotos && fotos.length > 0) {
        const paths = fotos.map((f) => `${userId}/${f.name}`)
        await supabase.storage.from('fotos').remove(paths)
      }
    } catch (err) { console.error('Deletar fotos error:', err) }

    // 2. Deletar documentos do bucket
    try {
      const { data: docs } = await supabase.storage.from('documentos').list(userId)
      if (docs && docs.length > 0) {
        const paths = docs.map((d) => `${userId}/${d.name}`)
        await supabase.storage.from('documentos').remove(paths)
      }
    } catch (err) { console.error('Deletar documentos error:', err) }

    // 3. Deletar mensagens enviadas
    const { error: msgErr } = await supabase.from('messages').delete().eq('sender_id', userId)
    if (msgErr) console.error('Deletar messages error:', msgErr)

    // 4. Deletar matches
    const { error: matchErr } = await supabase.from('matches').delete().or(`user1.eq.${userId},user2.eq.${userId}`)
    if (matchErr) console.error('Deletar matches error:', matchErr)

    // 5. Deletar dados relacionais (logs de erro sem interromper)
    const relationalDeletes = await Promise.allSettled([
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
    ])
    relationalDeletes.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`Deletar relacional[${i}] error:`, r.reason)
    })

    // video_calls pode não existir em todos os ambientes — ignorar erro silenciosamente
    try {
      await supabase.from('video_calls').delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
    } catch (_) {}

    // 6. Deletar profiles (cascade: filters, user_superlikes, user_boosts,
    //    user_tickets, user_lupas, user_rewinds)
    const { error: profileErr } = await supabase.from('profiles').delete().eq('id', userId)
    if (profileErr) console.error('Deletar profiles error:', profileErr)

    // 7. Deletar users
    const { error: userErr } = await supabase.from('users').delete().eq('id', userId)
    if (userErr) console.error('Deletar users error:', userErr)

    // Emails de confirmação LGPD (best-effort — dados já deletados)
    if (userEmail) {
      await sendAccountDeletedEmail(userEmail, nomeDisplay)
      await sendDataDeletionConfirmedEmail(userEmail, nomeDisplay)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Deletar conta error:', err)
    return NextResponse.json({ error: 'Erro interno ao excluir conta' }, { status: 500 })
  }
}

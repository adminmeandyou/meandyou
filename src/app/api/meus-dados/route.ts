// GET /api/meus-dados — cópia dos dados do próprio usuário em JSON (LGPD art. 18 II e V, art. 19)
// Só dados do usuário logado. Tokens, segredos de 2FA e caminhos de documentos ficam de fora.
import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const LIMITE_LINHAS = 5000

// [tabela, coluna(s) que apontam para o usuário]
const TABELAS: Array<[string, string[]]> = [
  ['filters', ['user_id']],
  ['likes', ['user_id']],
  ['dislikes', ['from_user']],
  ['mode_likes', ['user_id']],
  ['matches', ['user1', 'user2']],
  ['messages', ['sender_id']],
  ['friendships', ['requester_id']],
  ['friend_messages', ['sender_id']],
  ['friend_gifts', ['sender_id']],
  ['room_members', ['user_id']],
  ['room_messages', ['sender_id']],
  ['camarote_messages', ['sender_id']],
  ['couple_profiles', ['user1_id', 'user2_id']],
  ['access_requests', ['requester_id']],
  ['subscriptions', ['user_id']],
  ['payments', ['user_id']],
  ['store_purchases', ['user_id']],
  ['cancellation_requests', ['user_id']],
  ['fichas_transactions', ['user_id']],
  ['user_fichas', ['user_id']],
  ['user_superlikes', ['user_id']],
  ['user_boosts', ['user_id']],
  ['user_lupas', ['user_id']],
  ['user_rewinds', ['user_id']],
  ['user_tickets', ['user_id']],
  ['user_video_extra', ['user_id']],
  ['video_minutes', ['user_id']],
  ['user_badges', ['user_id']],
  ['xp_events', ['user_id']],
  ['daily_streaks', ['user_id']],
  ['streak_calendar', ['user_id']],
  ['roleta_history', ['user_id']],
  ['notifications', ['user_id']],
  ['reports', ['reporter_id']],
  ['bolo_reports', ['reporter_id']],
  ['bug_reports', ['user_id']],
  ['safety_records', ['user_id']],
  ['user_sessions', ['user_id']],
  ['analytics_events', ['user_id']],
]

const COLUNAS_OCULTAS_USERS = new Set([
  'totp_secret', 'totp_backup_codes', 'known_ua_hashes',
  'email_verify_token', 'email_verify_token_expires_at',
  'documento_url', 'documento_verso_url', 'selfie_url',
])

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const admin = createAdminClient()
    const uid = user.id

    const [{ data: conta }, { data: perfil }] = await Promise.all([
      admin.from('users').select('*').eq('id', uid).maybeSingle(),
      admin.from('profiles').select('*').eq('id', uid).maybeSingle(),
    ])

    const dados: Record<string, unknown> = {
      gerado_em: new Date().toISOString(),
      conta: conta
        ? Object.fromEntries(Object.entries(conta).filter(([k]) => !COLUNAS_OCULTAS_USERS.has(k)))
        : null,
      perfil,
    }

    await Promise.all(TABELAS.map(async ([tabela, colunas]) => {
      let q = admin.from(tabela).select('*').limit(LIMITE_LINHAS)
      q = colunas.length === 1
        ? q.eq(colunas[0], uid)
        : q.or(colunas.map(c => `${c}.eq.${uid}`).join(','))
      const { data, error } = await q
      if (error) {
        console.error(`[meus-dados] ${tabela}:`, error.message)
        return
      }
      if (data && data.length > 0) dados[tabela] = data
    }))

    const data = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(dados, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="meandyou-meus-dados-${data}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[meus-dados] GET', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

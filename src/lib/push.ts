import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type NotificationType = 'match' | 'message' | 'superlike' | 'boost_expired' | 'plan_expired' | 'friend_request' | 'friend_accepted' | 'friend_message' | 'friend_nudge' | 'friend_gift' | 'meeting_invite' | 'meeting_accepted' | 'meeting_declined' | 'meeting_rescheduled' | 'meeting_cancelled'

// Devolve false se as chaves VAPID não estiverem configuradas (antes lançava erro e
// derrubava a rota inteira, inclusive a notificação salva no app)
function initWebPush(): boolean {
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  if (!publica || !privada) {
    console.error('[push] VAPID não configurado: notificação salva no app, push no celular não enviado')
    return false
  }
  try {
    webpush.setVapidDetails('mailto:noreply@meandyou.com.br', publica, privada)
    return true
  } catch (err) {
    console.error('[push] VAPID inválido:', err)
    return false
  }
}

interface SendPushParams {
  targetUserId: string
  type:         NotificationType
  title:        string
  body:         string
  data?:        Record<string, unknown>
  fromUserId?:  string
}

export async function enviarPushParaUsuario({
  targetUserId,
  type,
  title,
  body,
  data = {},
  fromUserId,
}: SendPushParams) {
  // 1. Salvar notificação no banco
  const { error: insertError } = await supabaseAdmin.from('notifications').insert({
    user_id:      targetUserId,
    type,
    from_user_id: fromUserId ?? null,
    read:         false,
    data,
  })
  if (insertError) console.error('Erro ao inserir notificação:', insertError)

  if (!initWebPush()) return

  // 2. Buscar subscriptions do usuário
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', targetUserId)

  if (!subs || subs.length === 0) return

  const payload = JSON.stringify({ title, body, data, type })

  // 3. Enviar para todos os dispositivos do usuário
  const promises = subs.map(async (sub) => {
    try {
      // Timeout de 8 segundos — se o servico do browser nao responder, desiste
      await Promise.race([
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error('timeout'), { statusCode: 0 })), 8000)
        ),
      ])
    } catch (err: any) {
      // Subscription expirada ou inválida — remover do banco
      if (err.statusCode === 404 || err.statusCode === 410) {
        try {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        } catch (_) {}
      } else {
        console.error('Erro ao enviar push:', err)
      }
    }
  })

  await Promise.allSettled(promises)
}

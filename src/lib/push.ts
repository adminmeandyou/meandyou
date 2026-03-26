import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type NotificationType = 'match' | 'message' | 'superlike' | 'boost_expired' | 'plan_expired'

function initWebPush() {
  webpush.setVapidDetails(
    `mailto:${process.env.RESEND_FROM_EMAIL || 'noreply@meandyou.com.br'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
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
  initWebPush()
  // 1. Salvar notificação no banco
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id:      targetUserId,
      type,
      from_user_id: fromUserId ?? null,
      read:         false,
      data,
    })
  } catch (err) {
    console.error('Erro ao inserir notificação:', err)
  }

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
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
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

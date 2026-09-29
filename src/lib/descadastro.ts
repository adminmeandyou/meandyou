// Link de descadastro dos e-mails de marketing (LGPD art. 8 §5: revogação fácil e gratuita).
// Assinado com HMAC para ninguém descadastrar outra pessoa trocando o ID na URL.
import { createHmac, timingSafeEqual } from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meandyou.com.br'

function assinar(userId: string) {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`descadastro:${userId}`)
    .digest('base64url')
}

export function linkDescadastro(userId: string) {
  return `${BASE_URL}/api/descadastro?u=${encodeURIComponent(userId)}&t=${assinar(userId)}`
}

export function assinaturaValida(userId: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !token) return false
  const esperado = Buffer.from(assinar(userId))
  const recebido = Buffer.from(token)
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido)
}

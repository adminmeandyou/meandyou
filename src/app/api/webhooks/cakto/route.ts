// TODO: gateway de pagamentos removido (Cakto).
// Implementar novo webhook quando o gateway for definido.
// O webhook deve:
//   1. Validar assinatura HMAC do gateway
//   2. Processar status 'approved'/'paid' apenas
//   3. Ativar plano via RPC activate_subscription(p_user_id, p_plan, p_order_id)
//   4. Creditar fichas/SuperLikes/Boosts via RPCs com idempotência por order_id
//   5. Chamar reward_referral(p_referred_id) se usuário tiver indicação pendente

import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Gateway de pagamentos não configurado' },
    { status: 501 }
  )
}

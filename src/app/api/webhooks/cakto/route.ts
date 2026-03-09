// src/app/api/webhooks/cakto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Planos ────────────────────────────────────────────────────────────────
const OFFER_TO_PLAN: Record<string, string> = {
  'hftqkrj':        'black',
  '3arwn9f':        'plus',
  'cip6fy9_797209': 'essencial',
}

// ── Backstage ─────────────────────────────────────────────────────────────
const BACKSTAGE_OFFER = 'i73nbfm'

// ── Loja avulsa ───────────────────────────────────────────────────────────
type StoreItem =
  | { type: 'superlike' | 'boost' | 'lupa' | 'rewind'; amount: number; item_type: string }

const STORE_OFFERS: Record<string, StoreItem> = {
  // SuperLikes
  'qjgmwzu': { type: 'superlike', amount: 5,  item_type: 'superlikes_5'  },
  '33kbrpq': { type: 'superlike', amount: 15, item_type: 'superlikes_15' },
  'ft87o9v': { type: 'superlike', amount: 30, item_type: 'superlikes_30' },
  // Boosts
  'hsv4ooq': { type: 'boost',     amount: 1,  item_type: 'boost_1'       },
  'sgbdabs': { type: 'boost',     amount: 5,  item_type: 'boost_5'       },
  // Lupas — slugs a definir no Cakto, substituir quando criados
  'lupa_5_slug':  { type: 'lupa',   amount: 5,  item_type: 'lupas_5'       },
  'lupa_15_slug': { type: 'lupa',   amount: 15, item_type: 'lupas_15'      },
  'lupa_30_slug': { type: 'lupa',   amount: 30, item_type: 'lupas_30'      },
  // Rewinds — slug a definir no Cakto
  'rewind_5_slug': { type: 'rewind', amount: 5, item_type: 'rewinds_5'     },
}

// ── Validação HMAC ────────────────────────────────────────────────────────
function validarHMAC(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.CAKTOPAY_SECRET
  if (!secret) return true // Se não configurado, pula validação em dev

  const assinatura = req.headers.get('x-cakto-signature') || req.headers.get('x-webhook-signature')
  if (!assinatura) return false

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(assinatura.replace('sha256=', ''), 'hex'),
    Buffer.from(hmac, 'hex')
  )
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // 1. Validar HMAC
    if (!validarHMAC(req, rawBody)) {
      console.warn('Webhook Cakto: assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // 2. Só processa aprovados/pagos
    const status = body?.status || body?.data?.status
    if (status !== 'approved' && status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const orderId       = body?.id              || body?.data?.id
    const customerEmail = body?.customer?.email || body?.data?.customer?.email
    const offerSlug     = body?.offer?.slug     || body?.data?.offer?.slug || ''
    const metadata      = body?.metadata        || body?.data?.metadata   || {}

    if (!customerEmail) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })
    }

    // 3. Buscar usuário por email na tabela users — NUNCA usar listUsers()
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase().trim())
      .single()

    if (!userRow) {
      console.warn(`Webhook Cakto: usuário não encontrado para email ${customerEmail}`)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userId = userRow.id

    // ── 4. Plano ──────────────────────────────────────────────────────────
    const plan = OFFER_TO_PLAN[offerSlug]
    if (plan) {
      await supabaseAdmin.rpc('activate_subscription', {
        p_user_id:        userId,
        p_plan:           plan,
        p_cakto_order_id: orderId,
      })
      // Recompensa indicação se houver referral pendente
      try {
        await supabaseAdmin.rpc('reward_referral', { p_referred_id: userId })
      } catch (err) {
        console.error('Erro ao recompensar indicação:', err)
      }

      console.log(`Plano ${plan} ativado para ${customerEmail}`)
      return NextResponse.json({ success: true })
    }

    // ── 5. Backstage ──────────────────────────────────────────────────────
    if (offerSlug === BACKSTAGE_OFFER) {
      const requestId = metadata?.request_id
      if (!requestId) {
        return NextResponse.json({ error: 'request_id obrigatório' }, { status: 400 })
      }
      await supabaseAdmin.rpc('activate_access_request', {
        p_request_id:     requestId,
        p_paid_by:        userId,
        p_cakto_order_id: orderId,
      })
      console.log(`Backstage ativado para ${customerEmail}`)
      return NextResponse.json({ success: true })
    }

    // ── 6. Loja avulsa ────────────────────────────────────────────────────
    const storeItem = STORE_OFFERS[offerSlug]
    if (storeItem) {
      const baseParams = {
        p_user_id:   userId,
        p_amount:    storeItem.amount,
        p_order_id:  orderId,
        p_item_type: storeItem.item_type,
      }

      if (storeItem.type === 'superlike') {
        await supabaseAdmin.rpc('credit_superlikes', baseParams)
      } else if (storeItem.type === 'boost') {
        await supabaseAdmin.rpc('credit_boosts', baseParams)
      } else if (storeItem.type === 'lupa') {
        await supabaseAdmin.rpc('credit_lupas', baseParams)
      } else if (storeItem.type === 'rewind') {
        await supabaseAdmin.rpc('credit_rewinds', baseParams)
      }

      console.log(`${storeItem.amount}x ${storeItem.type} creditado para ${customerEmail}`)
      return NextResponse.json({ success: true })
    }

    console.warn('Oferta não reconhecida:', offerSlug)
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Erro no webhook Cakto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

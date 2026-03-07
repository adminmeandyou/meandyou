// src/app/api/webhooks/cakto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Planos ──
const OFFER_TO_PLAN: Record<string, string> = {
  'hftqkrj': 'black',
  '3arwn9f': 'plus',
  'cip6fy9_797209': 'essencial',
}

// ── Backstage ──
const BACKSTAGE_OFFER = 'i73nbfm'

// ── Loja de avulsos ──
const STORE_OFFERS: Record<string, { type: 'superlike' | 'boost'; amount: number; item_type: string }> = {
  'qjgmwzu': { type: 'superlike', amount: 5,  item_type: 'superlikes_5'  },
  '33kbrpq': { type: 'superlike', amount: 15, item_type: 'superlikes_15' },
  'ft87o9v': { type: 'superlike', amount: 30, item_type: 'superlikes_30' },
  'hsv4ooq': { type: 'boost',     amount: 1,  item_type: 'boost_1'       },
  'sgbdabs': { type: 'boost',     amount: 5,  item_type: 'boost_5'       },
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const status = body?.status || body?.data?.status
    if (status !== 'approved' && status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const orderId       = body?.id               || body?.data?.id
    const customerEmail = body?.customer?.email  || body?.data?.customer?.email
    const offerSlug     = body?.offer?.slug      || body?.data?.offer?.slug || ''
    const metadata      = body?.metadata         || body?.data?.metadata   || {}

    if (!customerEmail) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })
    }

    // Buscar usuário pelo email
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
    const user = userData?.users?.find(u => u.email === customerEmail)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // ── 1. Plano ──
    const plan = OFFER_TO_PLAN[offerSlug]
    if (plan) {
      await supabaseAdmin.rpc('activate_subscription', {
        p_user_id: user.id,
        p_plan: plan,
        p_cakto_order_id: orderId,
      })
      // 🎁 Recompensa indicação (só executa se houver referral pendente)
      await supabaseAdmin.rpc('reward_referral', { p_referred_id: user.id })
      console.log(`Plano ${plan} ativado para ${customerEmail}`)
      return NextResponse.json({ success: true })
    }

    // ── 2. Resgate Backstage ──
    if (offerSlug === BACKSTAGE_OFFER) {
      const requestId = metadata?.request_id
      if (!requestId) {
        return NextResponse.json({ error: 'request_id obrigatório' }, { status: 400 })
      }
      const { data: result } = await supabaseAdmin.rpc('activate_access_request', {
        p_request_id: requestId,
        p_paid_by: user.id,
        p_cakto_order_id: orderId,
      })
      console.log(`Resgate Backstage ativado:`, result)
      return NextResponse.json({ success: true, result })
    }

    // ── 3. Loja de avulsos ──
    const storeItem = STORE_OFFERS[offerSlug]
    if (storeItem) {
      if (storeItem.type === 'superlike') {
        await supabaseAdmin.rpc('credit_superlikes', {
          p_user_id:   user.id,
          p_amount:    storeItem.amount,
          p_order_id:  orderId,
          p_item_type: storeItem.item_type,
        })
        console.log(`${storeItem.amount} SuperLikes creditados para ${customerEmail}`)
      } else {
        await supabaseAdmin.rpc('credit_boosts', {
          p_user_id:   user.id,
          p_amount:    storeItem.amount,
          p_order_id:  orderId,
          p_item_type: storeItem.item_type,
        })
        console.log(`${storeItem.amount} Boosts creditados para ${customerEmail}`)
      }
      return NextResponse.json({ success: true })
    }

    console.warn('Oferta não reconhecida:', offerSlug)
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Erro no webhook Cakto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
// src/app/api/webhooks/cakto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendPlanActivatedEmail, sendReceiptEmail, sendRewardReceivedEmail } from '@/app/lib/email'

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

// ── Preços dos planos (para recibo) ───────────────────────────────────────
const PLAN_PRICES: Record<string, number> = {
  essencial: 9.97,
  plus: 39.97,
  black: 99.97,
}

// ── Pacotes de Fichas ─────────────────────────────────────────────────────
// ATENÇÃO: substitua os slugs placeholder pelos slugs reais criados na Cakto
const FICHAS_OFFERS: Record<string, number> = {
  'fichas_500':   500,    // TODO: substituir pelo slug real — R$ 7,97
  'fichas_1500':  1500,   // TODO: substituir pelo slug real — R$ 19,97
  'fichas_4000':  4000,   // TODO: substituir pelo slug real — R$ 44,97
  'fichas_10000': 10000,  // TODO: substituir pelo slug real — R$ 99,97
}

// ── Loja avulsa ───────────────────────────────────────────────────────────
type StoreItem =
  | { type: 'superlike' | 'boost' | 'lupa' | 'rewind' | 'ghost'; amount: number; item_type: string }

const STORE_OFFERS: Record<string, StoreItem> = {
  // SuperLikes
  '3cg973u': { type: 'superlike', amount: 1,  item_type: 'superlikes_1'  },
  '8imgsen': { type: 'superlike', amount: 5,  item_type: 'superlikes_5'  },
  'nhx6ei3': { type: 'superlike', amount: 10, item_type: 'superlikes_10' },
  // Boosts
  'mdpn9zu': { type: 'boost',     amount: 1,  item_type: 'boost_1'       },
  'vyaecjn': { type: 'boost',     amount: 5,  item_type: 'boost_5'       },
  'v2hkztt': { type: 'boost',     amount: 10, item_type: 'boost_10'      },
  // Lupas (ver quem curtiu)
  'hnou4rx': { type: 'lupa',      amount: 1,  item_type: 'lupas_1'       },
  't8mzpty': { type: 'lupa',      amount: 5,  item_type: 'lupas_5'       },
  'skksymv': { type: 'lupa',      amount: 10, item_type: 'lupas_10'      },
  // Rewinds (desfazer curtida)
  'jra25ti': { type: 'rewind',    amount: 1,  item_type: 'rewinds_1'     },
  'tffexvs': { type: 'rewind',    amount: 5,  item_type: 'rewinds_5'     },
  '7e5fjbx': { type: 'rewind',    amount: 10, item_type: 'rewinds_10'    },
  // Modo Fantasma (cada unidade = 7 dias)
  'ct79bui': { type: 'ghost',     amount: 7,  item_type: 'ghost_7d'      },
  'jesigqc': { type: 'ghost',     amount: 35, item_type: 'ghost_35d'     },
  '8b75h6z': { type: 'ghost',     amount: 70, item_type: 'ghost_70d'     },
}

// ── Validação HMAC ────────────────────────────────────────────────────────
function validarHMAC(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.CAKTOPAY_SECRET
  if (!secret) {
    console.error('CAKTOPAY_SECRET não configurado — rejeitar webhook')
    return false
  }

  const assinatura = req.headers.get('x-cakto-signature') || req.headers.get('x-webhook-signature')
  if (!assinatura) return false

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(assinatura.replace('sha256=', ''), 'hex'),
      Buffer.from(hmac, 'hex')
    )
  } catch {
    return false
  }
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

    const orderId = body?.id || body?.data?.id

    // 3. Idempotência — orderId é obrigatório para evitar duplo crédito
    if (!orderId) {
      console.error('Webhook Cakto: orderId ausente — rejeitando para evitar duplo crédito')
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
    }

    const { error: insertError } = await supabaseAdmin
      .from('cakto_webhook_log')
      .insert({ order_id: orderId })

    if (insertError) {
      // Conflito = já foi processado
      if (insertError.code === '23505') {
        console.log(`Webhook duplicado ignorado: ${orderId}`)
        return NextResponse.json({ received: true })
      }
      // Tabela não existe ainda — prossegue sem idempotência e loga aviso
      console.warn('cakto_webhook_log não encontrada — crie a tabela no Supabase')
    }
    const customerEmail = body?.customer?.email || body?.data?.customer?.email
    const offerSlug     = body?.offer?.slug     || body?.data?.offer?.slug || ''
    const metadata      = body?.metadata        || body?.data?.metadata   || {}

    if (!customerEmail) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })
    }

    // 4. Buscar usuário por email na tabela users — NUNCA usar listUsers()
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
      try {
        await supabaseAdmin.rpc('activate_subscription', {
          p_user_id:        userId,
          p_plan:           plan,
          p_cakto_order_id: orderId,
        })
      } catch (err) {
        console.error('Erro ao ativar assinatura via RPC:', err)
        return NextResponse.json({ error: 'Erro ao ativar assinatura' }, { status: 500 })
      }

      // Recompensa indicação se houver referral pendente
      try {
        await supabaseAdmin.rpc('reward_referral', { p_referred_id: userId })
      } catch (err) {
        console.error('Erro ao recompensar indicação:', err)
      }

      console.log(`Plano ${plan} ativado para ${customerEmail}`)
      const { data: profileData } = await supabaseAdmin.from('profiles').select('name').eq('id', userId).single()
      const nomeDisplay = profileData?.name?.split(' ')[0] ?? 'Usuário'
      await sendPlanActivatedEmail(customerEmail, nomeDisplay, plan)

      try {
        const hoje = new Date()
        const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await sendReceiptEmail(
          customerEmail,
          nomeDisplay,
          plan,
          PLAN_PRICES[plan] != null ? `R$ ${PLAN_PRICES[plan].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : '—',
          hoje.toLocaleDateString('pt-BR'),
          vencimento.toLocaleDateString('pt-BR'),
        )
      } catch (err) {
        console.error('Erro ao enviar email de recibo (não bloqueante):', err)
      }

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
      } else if (storeItem.type === 'ghost') {
        await supabaseAdmin.rpc('activate_ghost_mode', {
          p_user_id: userId,
          p_days:    storeItem.amount,
        })
      }

      console.log(`${storeItem.amount}x ${storeItem.type} creditado para ${customerEmail}`)

      // Email de confirmação de compra avulsa
      try {
        const { data: profileData } = await supabaseAdmin.from('profiles').select('name').eq('id', userId).single()
        const nomeDisplay = profileData?.name?.split(' ')[0] ?? 'Usuário'
        const itemLabel: Record<string, string> = {
          superlike: `${storeItem.amount} SuperLike${storeItem.amount > 1 ? 's' : ''}`,
          boost:     `${storeItem.amount} Boost${storeItem.amount > 1 ? 's' : ''}`,
          lupa:      `${storeItem.amount} Lupa${storeItem.amount > 1 ? 's' : ''}`,
          rewind:    `${storeItem.amount} Desfazer Curtida${storeItem.amount > 1 ? 's' : ''}`,
          ghost:     `${storeItem.amount} dias de Modo Fantasma`,
        }
        await sendRewardReceivedEmail(customerEmail, nomeDisplay, itemLabel[storeItem.type] ?? storeItem.item_type, 'compra na loja')
      } catch (err) {
        console.error('Erro ao enviar email de compra da loja (não bloqueante):', err)
      }

      return NextResponse.json({ success: true })
    }

    // ── 7. Fichas ──────────────────────────────────────────────────────────
    const fichasAmount = FICHAS_OFFERS[offerSlug]
    if (fichasAmount) {
      await supabaseAdmin.rpc('credit_fichas', {
        p_user_id:    userId,
        p_amount:     fichasAmount,
        p_order_id:   orderId,
        p_description: `Compra de ${fichasAmount} fichas`,
      })
      console.log(`${fichasAmount} fichas creditadas para ${customerEmail}`)
      try {
        const { data: profileData } = await supabaseAdmin.from('profiles').select('name').eq('id', userId).single()
        const nomeDisplay = profileData?.name?.split(' ')[0] ?? 'Usuario'
        await sendRewardReceivedEmail(customerEmail, nomeDisplay, `${fichasAmount} Fichas`, 'compra na loja')
      } catch (err) {
        console.error('Erro ao enviar email de fichas (nao bloqueante):', err)
      }
      return NextResponse.json({ success: true })
    }

    // ATENÇÃO: oferta não mapeada — pode ser slug de Lupa/Rewind ainda não configurado.
    // Adicionar o slug real em STORE_OFFERS para que compras desse item sejam creditadas.
    console.error(`Webhook Cakto: oferta não reconhecida — slug="${offerSlug}", orderId="${orderId}", email="${customerEmail}"`)
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Erro no webhook Cakto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

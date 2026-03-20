import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Custo em fichas por unidade — alinhado com STORE_ITEMS no frontend (loja/page.tsx)
const ITEM_CONFIG: Record<string, { fichasPorUnidade: number; label: string }> = {
  superlike:     { fichasPorUnidade: 30,   label: 'SuperLike' },
  boost:         { fichasPorUnidade: 40,   label: 'Boost' },
  lupa:          { fichasPorUnidade: 25,   label: 'Lupa' },
  rewind:        { fichasPorUnidade: 20,   label: 'Desfazer' },
  ghost_7d:      { fichasPorUnidade: 60,   label: 'Fantasma 7 dias' },
  ghost_35d:     { fichasPorUnidade: 220,  label: 'Fantasma 35 dias' },
  reveals_5:     { fichasPorUnidade: 50,   label: 'Ver quem curtiu (5 perfis)' },
  xp_bonus_3d:   { fichasPorUnidade: 50,   label: 'Bonus de XP (3 dias)' },
  verified_plus: { fichasPorUnidade: 200,  label: 'Selo Verificado Plus' },
  caixa_surpresa:{ fichasPorUnidade: 35,   label: 'Caixa Surpresa' },
  caixa_lendaria:{ fichasPorUnidade: 2250, label: 'Caixa Super Lendaria' },
}

async function incrementarSaldo(tabela: string, userId: string, amount: number): Promise<void> {
  const { data: cur } = await supabaseAdmin
    .from(tabela)
    .select('amount')
    .eq('user_id', userId)
    .single()

  await supabaseAdmin
    .from(tabela)
    .upsert(
      { user_id: userId, amount: (cur?.amount ?? 0) + amount },
      { onConflict: 'user_id' }
    )
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
    }

    const body = await req.json()
    const item_key: string = body.item_key
    const qty: number = typeof body.qty === 'number' && body.qty >= 1 ? Math.floor(body.qty) : 1

    const itemConfig = ITEM_CONFIG[item_key]
    if (!itemConfig) {
      return NextResponse.json({ error: 'Item desconhecido', item_key }, { status: 400 })
    }

    const totalFichas = itemConfig.fichasPorUnidade * qty
    const label = qty > 1 ? `${qty}x ${itemConfig.label}` : itemConfig.label

    // Debita fichas via RPC spend_fichas
    const { data: spent, error: spendErr } = await supabaseAdmin.rpc('spend_fichas', {
      p_user_id:     user.id,
      p_amount:      totalFichas,
      p_description: `Compra: ${label}`,
    })

    if (spendErr) {
      console.error('spend_fichas error:', spendErr)
      return NextResponse.json({ error: 'Erro ao debitar fichas', detail: spendErr.message }, { status: 500 })
    }

    if (!spent) {
      return NextResponse.json({ error: 'Fichas insuficientes' }, { status: 402 })
    }

    // Credita o item comprado
    if (item_key === 'superlike') {
      await incrementarSaldo('user_superlikes', user.id, qty)

    } else if (item_key === 'boost') {
      await incrementarSaldo('user_boosts', user.id, qty)

    } else if (item_key === 'lupa') {
      await incrementarSaldo('user_lupas', user.id, qty)

    } else if (item_key === 'rewind') {
      await incrementarSaldo('user_rewinds', user.id, qty)

    } else if (item_key === 'ghost_7d' || item_key === 'ghost_35d') {
      const days = item_key === 'ghost_7d' ? 7 : 35
      const { error: ghostErr } = await supabaseAdmin.rpc('activate_ghost_mode', {
        p_user_id: user.id,
        p_days:    days,
      })
      if (ghostErr) {
        const until = new Date(Date.now() + days * 86400000).toISOString()
        await supabaseAdmin.from('profiles').update({ ghost_mode_until: until }).eq('id', user.id)
      }

    } else if (item_key === 'reveals_5') {
      // Abre janela de 24h para ver quem curtiu
      const until = new Date(Date.now() + 86400000).toISOString()
      await supabaseAdmin.from('profiles').update({ curtidas_reveals_until: until }).eq('id', user.id)

    } else if (item_key === 'xp_bonus_3d') {
      const until = new Date(Date.now() + 3 * 86400000).toISOString()
      await supabaseAdmin.from('profiles').update({ xp_bonus_until: until }).eq('id', user.id)

    } else if (item_key === 'verified_plus') {
      await supabaseAdmin.from('profiles').update({ verified_plus: true }).eq('id', user.id)
      // Concede automaticamente o emblema de Identidade Verificada (se existir)
      const { data: verifiedBadge } = await supabaseAdmin
        .from('badges')
        .select('id')
        .eq('condition_type', 'on_verify')
        .limit(1)
        .maybeSingle()
      if (verifiedBadge?.id) {
        await supabaseAdmin
          .from('user_badges')
          .upsert({ user_id: user.id, badge_id: verifiedBadge.id }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
      }

    } else if (item_key === 'caixa_surpresa') {
      const { data: spinResult } = await supabaseAdmin.rpc('spin_roleta', { p_user_id: user.id })
      return NextResponse.json({ success: true, surpresa: spinResult })

    } else if (item_key === 'caixa_lendaria') {
      // Pool lendário — itens exclusivos, ponderados por raridade
      const pool = [
        { type: 'superlike', amount: 5, weight: 30 },
        { type: 'boost', amount: 2, weight: 20 },
        { type: 'lupa', amount: 2, weight: 20 },
        { type: 'ghost_7d', amount: 1, weight: 15 },
        { type: 'reveals_5', amount: 1, weight: 10 },
        { type: 'xp_bonus_3d', amount: 1, weight: 4 },
        { type: 'plan_black_1d', amount: 1, weight: 1 },
      ]
      const totalWeight = pool.reduce((s, i) => s + i.weight, 0)
      let rng = Math.random() * totalWeight
      const chosen = pool.find(i => { rng -= i.weight; return rng <= 0 }) ?? pool[0]

      if (chosen.type === 'superlike') await incrementarSaldo('user_superlikes', user.id, chosen.amount)
      else if (chosen.type === 'boost') await incrementarSaldo('user_boosts', user.id, chosen.amount)
      else if (chosen.type === 'lupa') await incrementarSaldo('user_lupas', user.id, chosen.amount)
      else if (chosen.type === 'ghost_7d') {
        const until = new Date(Date.now() + 7 * 86400000).toISOString()
        await supabaseAdmin.from('profiles').update({ ghost_mode_until: until }).eq('id', user.id)
      } else if (chosen.type === 'reveals_5') {
        const until = new Date(Date.now() + 86400000).toISOString()
        await supabaseAdmin.from('profiles').update({ curtidas_reveals_until: until }).eq('id', user.id)
      } else if (chosen.type === 'xp_bonus_3d') {
        const until = new Date(Date.now() + 3 * 86400000).toISOString()
        await supabaseAdmin.from('profiles').update({ xp_bonus_until: until }).eq('id', user.id)
      } else if (chosen.type === 'plan_black_1d') {
        // XP bonus como proxy de "1 dia Black" até sistema de planos temporários existir
        const until = new Date(Date.now() + 86400000).toISOString()
        await supabaseAdmin.from('profiles').update({ xp_bonus_until: until }).eq('id', user.id)
      }

      return NextResponse.json({ success: true, caixa_lendaria: { type: chosen.type, amount: chosen.amount } })
    }

    // Conceder XP pela compra (fire-and-forget)
    supabaseAdmin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'purchase', p_base_xp: 50 }).then(() => {}).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro em /api/loja/gastar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

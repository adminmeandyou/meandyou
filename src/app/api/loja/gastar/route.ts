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
  reveals_5:     { fichasPorUnidade: 50,   label: 'Ver quem curtiu (24h)' },
  xp_bonus_3d:   { fichasPorUnidade: 50,   label: 'Bonus de XP (3 dias)' },
  verified_plus: { fichasPorUnidade: 200,  label: 'Selo Verificado Plus' },
  caixa_surpresa:{ fichasPorUnidade: 35,   label: 'Caixa Surpresa' },
  caixa_lendaria:{ fichasPorUnidade: 2250, label: 'Caixa Super Lendaria' },
}

async function incrementarSaldo(tabela: string, userId: string, amount: number): Promise<void> {
  // Operação atômica via RPC — evita race condition em compras simultâneas
  const { error } = await supabaseAdmin.rpc('increment_user_balance', {
    p_table:   tabela,
    p_user_id: userId,
    p_amount:  amount,
  })
  if (error) throw new Error(`increment_user_balance falhou para ${tabela}: ${error.message}`)
}

async function estornarFichas(userId: string, amount: number): Promise<void> {
  await supabaseAdmin.rpc('increment_user_balance', {
    p_table:   'user_fichas',
    p_user_id: userId,
    p_amount:  amount,
  })
}

// Retry para updates diretos em profiles (campos de data/boolean).
// As fichas ja foram debitadas antes de chegar aqui, entao se o update falhar
// o usuario perde o beneficio sem perder as fichas. O retry reduz esse risco.
async function atualizarProfile(userId: string, update: Record<string, unknown>): Promise<void> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { error } = await supabaseAdmin.from('profiles').update(update).eq('id', userId)
    if (!error) return
    if (tentativa < 2) await new Promise(r => setTimeout(r, 300 * (tentativa + 1)))
  }
  console.error('[loja/gastar] falha ao atualizar profile apos 3 tentativas — user:', userId, 'update:', update)
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

    // Credita o item comprado — em caso de falha, estorna as fichas automaticamente
    try {
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
        await atualizarProfile(user.id, { ghost_mode_until: until })
      }

    } else if (item_key === 'reveals_5') {
      // Abre janela de 24h para ver quem curtiu
      const until = new Date(Date.now() + 86400000).toISOString()
      await atualizarProfile(user.id, { curtidas_reveals_until: until })

    } else if (item_key === 'xp_bonus_3d') {
      const until = new Date(Date.now() + 3 * 86400000).toISOString()
      await atualizarProfile(user.id, { xp_bonus_until: until })

    } else if (item_key === 'verified_plus') {
      await atualizarProfile(user.id, { verified_plus: true })
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
      // Premio aleatorio da caixa — NAO usa spin_roleta (sem deducao de ticket)
      const { data: prizes } = await supabaseAdmin.from('roleta_prizes').select('reward_type, reward_amount, weight').eq('active', true)
      const pool = prizes ?? []
      if (pool.length === 0) return NextResponse.json({ error: 'Sem premios configurados' }, { status: 500 })
      const totalWeight = pool.reduce((s: number, p: any) => s + p.weight, 0)
      let rng = Math.random() * totalWeight
      const chosen = pool.find((p: any) => { rng -= p.weight; return rng <= 0 }) ?? pool[0]
      // Credita o premio
      if (chosen.reward_type === 'ticket') await incrementarSaldo('user_tickets', user.id, chosen.reward_amount)
      else if (chosen.reward_type === 'supercurtida') await incrementarSaldo('user_superlikes', user.id, chosen.reward_amount)
      else if (chosen.reward_type === 'boost') await incrementarSaldo('user_boosts', user.id, chosen.reward_amount)
      else if (chosen.reward_type === 'lupa') await incrementarSaldo('user_lupas', user.id, chosen.reward_amount)
      else if (chosen.reward_type === 'rewind') await incrementarSaldo('user_rewinds', user.id, chosen.reward_amount)
      return NextResponse.json({ success: true, surpresa: { reward_type: chosen.reward_type, reward_amount: chosen.reward_amount } })

    } else if (item_key === 'caixa_lendaria') {
      // Busca emblemas exclusivos da caixa lendária (condition_type = 'caixa_lendaria')
      const { data: lendBadges } = await supabaseAdmin
        .from('badges')
        .select('id, name, icon_url')
        .eq('condition_type', 'caixa_lendaria')
        .eq('is_active', true)

      if (!lendBadges || lendBadges.length === 0) {
        // Emblemas ainda nao cadastrados — informa ao usuario
        return NextResponse.json({ success: true, caixa_lendaria: { type: 'badge_pending', badge_name: 'Emblema Super Lendario', badge_id: null } })
      }

      // Sorteia um emblema que o usuario ainda nao tem
      const { data: owned } = await supabaseAdmin
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id)
        .in('badge_id', lendBadges.map(b => b.id))

      const ownedIds = new Set((owned ?? []).map((r: any) => r.badge_id))
      const available = lendBadges.filter(b => !ownedIds.has(b.id))
      const pool = available.length > 0 ? available : lendBadges // se tiver todos, repete
      const badge = pool[Math.floor(Math.random() * pool.length)]

      await supabaseAdmin
        .from('user_badges')
        .upsert({ user_id: user.id, badge_id: badge.id }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

      return NextResponse.json({ success: true, caixa_lendaria: { type: 'badge', badge_id: badge.id, badge_name: badge.name, badge_icon: badge.icon_url } })
    }
    } catch (creditErr) {
      // Crédito do item falhou — estorna as fichas automaticamente
      console.error('[loja/gastar] falha ao creditar item, estornando fichas. user:', user.id, 'item:', item_key, creditErr)
      await estornarFichas(user.id, totalFichas)
      return NextResponse.json({ error: 'Erro ao processar item. Fichas estornadas.' }, { status: 500 })
    }

    // Conceder XP pela compra (fire-and-forget)
    void supabaseAdmin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'purchase', p_base_xp: 50 }).then(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro em /api/loja/gastar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

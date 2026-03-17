import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Custo em fichas por item
const FICHAS_COST: Record<string, { amount: number; fichas: number; label: string }> = {
  superlike_1:  { amount: 1,  fichas: 50,  label: '1 SuperLike' },
  superlike_5:  { amount: 5,  fichas: 200, label: '5 SuperLikes' },
  boost_1:      { amount: 1,  fichas: 60,  label: '1 Boost' },
  boost_5:      { amount: 5,  fichas: 250, label: '5 Boosts' },
  lupa_1:       { amount: 1,  fichas: 70,  label: '1 Lupa' },
  lupa_5:       { amount: 5,  fichas: 290, label: '5 Lupas' },
  rewind_1:     { amount: 1,  fichas: 50,  label: '1 Desfazer' },
  rewind_5:     { amount: 5,  fichas: 200, label: '5 Desfazer' },
  ghost_7d:     { amount: 7,  fichas: 90,  label: '7 dias Fantasma' },
  ghost_35d:    { amount: 35, fichas: 350, label: '35 dias Fantasma' },
  // Novos itens exclusivos de fichas
  reveals_24h:  { amount: 1,  fichas: 200, label: 'Ver quem curtiu (24h)' },
  xp_bonus_3d:  { amount: 3,  fichas: 150, label: 'Bonus de XP (3 dias)' },
  verified_plus:{ amount: 1,  fichas: 500, label: 'Selo Verificado Plus' },
  caixa_surpresa:{ amount: 1, fichas: 100, label: 'Caixa Surpresa' },
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

    const { item_key } = await req.json()
    const item = FICHAS_COST[item_key]
    if (!item) {
      return NextResponse.json({ error: 'Item desconhecido' }, { status: 400 })
    }

    // Tenta debitar fichas
    const { data: spent, error: spendErr } = await supabaseAdmin.rpc('spend_fichas', {
      p_user_id:    user.id,
      p_amount:     item.fichas,
      p_description: `Compra: ${item.label}`,
    })

    if (spendErr) {
      console.error('Erro ao gastar fichas:', spendErr)
      return NextResponse.json({ error: 'Erro ao processar compra' }, { status: 500 })
    }

    if (!spent) {
      return NextResponse.json({ error: 'Fichas insuficientes' }, { status: 402 })
    }

    // Credita o item comprado
    const type = item_key.split('_')[0] as string

    if (type === 'superlike') {
      await supabaseAdmin.rpc('credit_superlikes', {
        p_user_id:   user.id,
        p_amount:    item.amount,
        p_order_id:  `fichas_${Date.now()}`,
        p_item_type: item_key,
      })
    } else if (type === 'boost') {
      await supabaseAdmin.rpc('credit_boosts', {
        p_user_id:   user.id,
        p_amount:    item.amount,
        p_order_id:  `fichas_${Date.now()}`,
        p_item_type: item_key,
      })
    } else if (type === 'lupa') {
      await supabaseAdmin.rpc('credit_lupas', {
        p_user_id:   user.id,
        p_amount:    item.amount,
        p_order_id:  `fichas_${Date.now()}`,
        p_item_type: item_key,
      })
    } else if (type === 'rewind') {
      await supabaseAdmin.rpc('credit_rewinds', {
        p_user_id:   user.id,
        p_amount:    item.amount,
        p_order_id:  `fichas_${Date.now()}`,
        p_item_type: item_key,
      })
    } else if (type === 'ghost') {
      await supabaseAdmin.rpc('activate_ghost_mode', {
        p_user_id: user.id,
        p_days:    item.amount,
      })
    } else if (item_key === 'reveals_24h') {
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await supabaseAdmin
        .from('profiles')
        .update({ curtidas_reveals_until: until })
        .eq('id', user.id)
    } else if (item_key === 'xp_bonus_3d') {
      const until = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      await supabaseAdmin
        .from('profiles')
        .update({ xp_bonus_until: until })
        .eq('id', user.id)
    } else if (item_key === 'verified_plus') {
      await supabaseAdmin
        .from('profiles')
        .update({ verified_plus: true })
        .eq('id', user.id)
    } else if (item_key === 'caixa_surpresa') {
      const { data: spinResult } = await supabaseAdmin.rpc('spin_roleta', { p_user_id: user.id })
      return NextResponse.json({ success: true, surpresa: spinResult })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro em /api/loja/gastar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

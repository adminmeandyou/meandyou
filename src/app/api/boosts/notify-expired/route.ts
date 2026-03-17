import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBoostExpiredEmail } from '@/app/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  // Verifica se boost expirou nas últimas 2 horas (evita reenvio em visitas posteriores)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: boost } = await supabaseAdmin
    .from('user_boosts')
    .select('active_until')
    .eq('user_id', user.id)
    .lt('active_until', new Date().toISOString())
    .gt('active_until', twoHoursAgo)
    .single()

  if (!boost) return NextResponse.json({ sent: false })

  const [{ data: userData }, { data: profileData }] = await Promise.all([
    supabaseAdmin.from('users').select('email').eq('id', user.id).single(),
    supabaseAdmin.from('profiles').select('name').eq('id', user.id).single(),
  ])

  if (!userData?.email) return NextResponse.json({ sent: false })

  const nome = profileData?.name?.split(' ')[0] ?? 'Usuário'
  await sendBoostExpiredEmail(userData.email, nome)

  return NextResponse.json({ sent: true })
}

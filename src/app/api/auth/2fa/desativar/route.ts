import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verify } from 'otplib'
import { decryptSecret } from '@/lib/totp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { codigo } = await req.json()
    if (!codigo) return NextResponse.json({ error: 'Código obrigatório para desativar' }, { status: 400 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('totp_secret, totp_enabled')
      .eq('id', user.id)
      .single()

    if (!userData?.totp_enabled) {
      return NextResponse.json({ error: '2FA não está ativo' }, { status: 400 })
    }

    const secret = decryptSecret(userData.totp_secret!)
    const valido = await verify({ secret, token: codigo })
    if (!valido) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    await supabaseAdmin
      .from('users')
      .update({ totp_enabled: false, totp_secret: null, totp_backup_codes: null })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao desativar 2FA:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

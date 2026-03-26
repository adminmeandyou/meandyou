import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verify } from 'otplib'
import { randomBytes, createHash } from 'crypto'
import { decryptSecret } from '@/lib/totp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { codigo } = await req.json()
    if (!codigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('totp_secret, totp_enabled')
      .eq('id', user.id)
      .single()

    if (!userData?.totp_secret) {
      return NextResponse.json({ error: 'Gere o QR code primeiro' }, { status: 400 })
    }
    if (userData.totp_enabled) {
      return NextResponse.json({ error: '2FA já está ativo' }, { status: 400 })
    }

    const secret = decryptSecret(userData.totp_secret)
    const valido = await verify({ secret, token: codigo })

    if (!valido) {
      return NextResponse.json({ error: 'Código inválido. Tente novamente.' }, { status: 400 })
    }

    // Gerar 8 códigos de backup
    const codigosBackup = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase().match(/.{4}/g)!.join('-')
    )
    const codigosHash = codigosBackup.map(hashCode)

    await supabaseAdmin
      .from('users')
      .update({ totp_enabled: true, totp_backup_codes: codigosHash })
      .eq('id', user.id)

    return NextResponse.json({ success: true, backup_codes: codigosBackup })
  } catch (err) {
    console.error('Erro ao ativar 2FA:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Criptografa dados sensíveis com AES-256-GCM usando a SERVICE_ROLE_KEY como chave
export function encryptSecret(plain: string): string {
  const key = Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 32).padEnd(32, '0'))
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptSecret(enc: string): string {
  const [ivHex, tagHex, dataHex] = enc.split(':')
  const key = Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 32).padEnd(32, '0'))
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    // Verificar se 2FA já está ativo
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('totp_enabled')
      .eq('id', user.id)
      .single()

    if (userData?.totp_enabled) {
      return NextResponse.json({ error: '2FA já está ativo nesta conta' }, { status: 400 })
    }

    // Gerar novo secret
    const secret = generateSecret()
    const encryptedSecret = encryptSecret(secret)

    // Salvar secret (não ativado ainda — precisa de confirmação)
    await supabaseAdmin
      .from('users')
      .update({ totp_secret: encryptedSecret, totp_enabled: false })
      .eq('id', user.id)

    // Gerar URI para QR Code
    const otpauth = generateURI({ secret, label: user.email ?? user.id, issuer: 'MeAndYou' })
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

    return NextResponse.json({ qr_code: qrCodeDataUrl, secret })
  } catch (err) {
    console.error('Erro ao gerar 2FA:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

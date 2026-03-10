import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isMobileUA(ua: string): boolean {
  const isEmulator = /bluestacks|nox|memu|ldplayer|gameloop|android.*sdk|sdk.*android/i.test(ua)
  if (isEmulator) return false
  return /android|iphone|ipad|ipod|mobile/i.test(ua)
}

export async function POST(req: NextRequest) {
  try {
    // Verificação server-side: só aceita celular real
    const userAgent = req.headers.get('user-agent') || ''
    if (!isMobileUA(userAgent)) {
      return NextResponse.json({ error: 'mobile_required' }, { status: 403 })
    }

    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })

    // Rate limit por IP: máx 10 tentativas por hora — protege contra enumeração de tokens
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: tentativas } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'token_validation_attempt')
      .eq('metadata->>ip' as any, ip)
      .gte('created_at', umaHoraAtras)

    if ((tentativas ?? 0) >= 10) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
    }

    try {
      await supabase.from('analytics_events').insert({
        user_id: null,
        event_type: 'token_validation_attempt',
        metadata: { ip },
      })
    } catch (_) {}

    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
    if (data.used) return NextResponse.json({ error: 'usado' }, { status: 400 })
    if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'expirado' }, { status: 400 })

    // userId é necessário na resposta: a página de verificação o usa para chamar
    // /api/confirmar-verificacao. Segurança: token é 64 chars hex aleatório (32 bytes),
    // inviável de adivinhar. Rate limit acima protege contra enumeração.
    return NextResponse.json({ ok: true, userId: data.user_id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
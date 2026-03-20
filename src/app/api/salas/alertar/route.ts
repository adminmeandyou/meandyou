// src/app/api/salas/alertar/route.ts
// Alerta automático ao suporte quando palavras críticas são detectadas
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { sendMarketingEmail } from '@/app/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { roomId, roomName, content, matchedWords, context } = await req.json()

  // Buscar dados do usuario
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('email, nome_completo')
    .eq('id', user.id)
    .single()

  const corpo = `
    <p><strong>Alerta de conteudo critico detectado automaticamente</strong></p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #333"><strong>Sala</strong></td><td style="padding:8px;border:1px solid #333">${roomName ?? roomId}</td></tr>
      <tr><td style="padding:8px;border:1px solid #333"><strong>Contexto</strong></td><td style="padding:8px;border:1px solid #333">${context ?? 'chat de sala'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #333"><strong>Usuario ID</strong></td><td style="padding:8px;border:1px solid #333">${user.id}</td></tr>
      <tr><td style="padding:8px;border:1px solid #333"><strong>Email</strong></td><td style="padding:8px;border:1px solid #333">${userRow?.email ?? 'desconhecido'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #333"><strong>Palavras detectadas</strong></td><td style="padding:8px;border:1px solid #333;color:#f87171">${(matchedWords ?? []).join(', ')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #333"><strong>Conteudo bloqueado</strong></td><td style="padding:8px;border:1px solid #333;font-family:monospace">${content}</td></tr>
    </table>
    <p style="margin-top:16px;color:#f87171">Acao recomendada: revisar o perfil e historico deste usuario imediatamente.</p>
  `

  try {
    await sendMarketingEmail(
      'adminmeandyou@proton.me',
      'Suporte',
      '[ALERTA] Conteudo critico detectado — acao imediata necessaria',
      'Alerta de Seguranca — MeAndYou',
      corpo,
      'Ver no Admin',
      `https://www.meandyou.com.br/admin/usuarios`
    )
  } catch { /* log silencioso */ }

  return NextResponse.json({ ok: true })
}

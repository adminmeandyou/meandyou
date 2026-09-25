// src/app/api/admin/marketing/campanha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  // Verificar se e admin ou staff
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && !staff) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { titulo, corpo, segmento } = await req.json()

  if (!titulo || !corpo) {
    return NextResponse.json({ error: 'Título e corpo são obrigatórios' }, { status: 400 })
  }

  // Buscar e-mails dos destinatários
  // e-mail fica em `users`, não em profiles (a consulta antiga falhava e nada era enviado)
  let query = supabaseAdmin
    .from('profiles')
    .select('id, name')
    .eq('banned', false)
    .is('deleted_at', null)
    // LGPD: respeita quem desligou e-mails em Configurações
    .or('notifications_email.is.null,notifications_email.eq.true')

  if (segmento === 'essencial' || segmento === 'plus' || segmento === 'black') {
    query = query.eq('plan', segmento)
  }

  const { data: perfis } = await query.limit(5000)
  const emailPorId: Record<string, string> = {}
  const ids = (perfis ?? []).map((p: any) => p.id)
  for (let i = 0; i < ids.length; i += 300) {
    const { data: us } = await supabaseAdmin.from('users').select('id, email').in('id', ids.slice(i, i + 300))
    for (const u of us ?? []) if (u.email) emailPorId[u.id] = u.email
  }
  const lista = (perfis ?? [])
    .filter((p: any) => emailPorId[p.id])
    .map((p: any) => ({ email: emailPorId[p.id], name: p.name }))

  let status = 'enviado'
  try {
    // Resend batch: chunks de 100
    const CHUNK = 100
    for (let i = 0; i < lista.length; i += CHUNK) {
      const chunk = lista.slice(i, i + CHUNK)
      await resend.batch.send(
        chunk.map((d: any) => ({
          from: 'MeAndYou <noreply@meandyou.com.br>',
          to: d.email,
          subject: titulo,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#e11d48">${titulo}</h2>
            <div style="color:#333;line-height:1.6">${corpo}</div>
            <hr style="margin:24px 0;border-color:#eee"/>
            <p style="color:#999;font-size:12px">MeAndYou · <a href="https://www.meandyou.com.br">meandyou.com.br</a></p>
          </div>`,
        }))
      )
    }
  } catch (e) {
    console.error('Erro ao enviar campanha:', e)
    status = 'falhou'
  }

  // Salvar no histórico
  await supabaseAdmin.from('marketing_campaigns').insert({
    titulo,
    corpo,
    segmento: segmento ?? 'todos',
    total_destinatarios: lista.length,
    status,
    created_by: user.id,
  })

  return NextResponse.json({ ok: true, total: lista.length, status })
}

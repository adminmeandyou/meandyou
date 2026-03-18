// src/app/api/bugs/reportar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  // Rate limit: máx 3 reports por dia por usuário
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const { count } = await supabaseAdmin
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', hoje.toISOString())

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Limite de 3 reportes por dia atingido' }, { status: 429 })
  }

  const formData = await req.formData()
  const descricao = formData.get('descricao') as string
  const screenshot = formData.get('screenshot') as File | null

  if (!descricao || descricao.trim().length < 20) {
    return NextResponse.json({ error: 'Descreva o problema com pelo menos 20 caracteres' }, { status: 400 })
  }

  let screenshot_url: string | null = null

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
    }
    const ext = screenshot.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('bug-screenshots')
      .upload(path, screenshot, { contentType: screenshot.type, upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage
        .from('bug-screenshots')
        .getPublicUrl(path)
      screenshot_url = urlData.publicUrl
    }
  }

  const { error } = await supabaseAdmin
    .from('bug_reports')
    .insert({ user_id: user.id, descricao: descricao.trim(), screenshot_url })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

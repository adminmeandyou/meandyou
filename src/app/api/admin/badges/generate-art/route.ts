// POST /api/admin/badges/generate-art
// Gera imagem pixel art via HuggingFace Inference API e salva no Supabase Storage

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HF_MODEL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user: caller } } = await supabase.auth.getUser(token)
    if (!caller) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', caller.id).single()
    const { data: staff } = await supabase.from('staff_members').select('id').eq('user_id', caller.id).single()
    if (profile?.role !== 'admin' && !staff) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { prompt, badgeId } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 })

    const hfToken = process.env.HUGGINGFACE_API_TOKEN
    if (!hfToken) return NextResponse.json({ error: 'HUGGINGFACE_API_TOKEN não configurado no servidor' }, { status: 500 })

    let imageBuffer: Buffer
    let contentType = 'image/png'

    // Tenta HuggingFace primeiro
    const hfRes = await fetch(HF_MODEL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    })

    if (hfRes.status === 503) {
      const err = await hfRes.json().catch(() => ({}))
      const tempo = err.estimated_time ? `Tente novamente em ~${Math.ceil(err.estimated_time)}s` : 'Tente novamente em instantes'
      return NextResponse.json({ error: `Modelo carregando. ${tempo}` }, { status: 503 })
    }

    if (hfRes.status === 402) {
      return NextResponse.json({ error: 'Créditos HuggingFace esgotados. Aguarde a renovação mensal.' }, { status: 402 })
    }

    if (!hfRes.ok) {
      const err = await hfRes.text().catch(() => '')
      return NextResponse.json({ error: `Erro HuggingFace: ${err}` }, { status: 500 })
    }

    contentType = hfRes.headers.get('content-type') ?? 'image/png'
    imageBuffer = Buffer.from(await hfRes.arrayBuffer())
    const ext = contentType.includes('jpeg') ? 'jpg' : 'png'
    const filename = `badge-ai-${Date.now()}.${ext}`

    await supabase.storage.createBucket('badge-images', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('badge-images')
      .upload(filename, imageBuffer, { contentType, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)

    if (badgeId) {
      await supabase.from('badges').update({ icon_url: publicUrl }).eq('id', badgeId)
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[badges/generate-art]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

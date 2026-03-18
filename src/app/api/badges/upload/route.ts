// POST /api/badges/upload
// Recebe imagem via multipart form, faz upload para Supabase Storage
// O resize para 72x72 é feito no cliente (canvas) antes do envio

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `badge-${Date.now()}.jpg`

    // Tenta criar o bucket se não existir (ignora erro se já existe)
    await supabase.storage.createBucket('badge-images', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('badge-images')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[badges/upload]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

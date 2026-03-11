// src/app/api/upload-verificacao/route.ts
// ✅ CORREÇÃO CRÍTICA: uploads do bucket 'documentos' (privado) feitos via service role
// Antes: page usava supabase singleton (anon key) sem sessão no celular → RLS bloqueava
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caminho = formData.get('caminho') as string | null
    const userId = formData.get('userId') as string | null
    const token = formData.get('token') as string | null

    if (!file || !caminho || !userId || !token) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Validar que o token pertence ao userId e não está expirado/usado
    const { data: tokenData } = await supabase
      .from('verification_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single()

    if (
      !tokenData ||
      tokenData.user_id !== userId ||
      tokenData.used ||
      new Date(tokenData.expires_at) < new Date()
    ) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    // Garantir que o caminho pertence ao userId (evitar path traversal)
    if (!caminho.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 403 })
    }

    const buffer = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from('documentos')
      .upload(caminho, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Erro no upload documentos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em upload-verificacao:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

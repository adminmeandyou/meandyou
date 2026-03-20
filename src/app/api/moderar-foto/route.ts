// src/app/api/moderar-foto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPhotoRejectedEmail } from '@/app/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_UPLOADS_POR_HORA = 10

async function uploadFoto(userId: string, index: number, foto: File): Promise<string | null> {
  const ext = foto.name.split('.').pop() || 'jpg'
  const path = `${userId}/foto_${index}.${ext}`
  const bytes = await foto.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('fotos')
    .upload(path, Buffer.from(bytes), { upsert: true, contentType: foto.type || 'image/jpeg' })
  if (error) {
    console.error('[moderar-foto] Erro no upload:', error)
    return null
  }
  const { data } = supabaseAdmin.storage.from('fotos').getPublicUrl(path)
  return data.publicUrl
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sessão do usuário
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Rate limit: max 10 uploads por hora por usuário (DB-based — funciona em serverless)
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: uploadCount } = await supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'photo_upload_attempt')
      .gte('created_at', umaHoraAtras)

    if ((uploadCount ?? 0) >= MAX_UPLOADS_POR_HORA) {
      return NextResponse.json(
        { error: 'Limite de uploads atingido. Tente novamente em 1 hora.' },
        { status: 429 }
      )
    }

    // Registrar tentativa antes de chamar Sightengine
    try {
      await supabaseAdmin.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'photo_upload_attempt',
        metadata: {},
      })
    } catch (err) { console.error('[moderar-foto] Falha ao registrar tentativa de upload:', err) }

    // 3. Pegar foto e índice do slot
    const formData = await req.formData()
    const foto = formData.get('foto') as File
    if (!foto) {
      return NextResponse.json({ error: 'Nenhuma foto enviada' }, { status: 400 })
    }
    const index = parseInt((formData.get('index') as string) ?? '0')

    // 4. Monta multipart/form-data para o Sightengine
    const sightengineForm = new FormData()
    sightengineForm.append('media', foto, foto.name || 'foto.jpg')
    sightengineForm.append('models', 'nudity-2.0,offensive,gore')
    sightengineForm.append('api_user', process.env.SIGHTENGINE_API_USER!)
    sightengineForm.append('api_secret', process.env.SIGHTENGINE_API_SECRET!)

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: sightengineForm,
    })

    if (!response.ok) {
      console.error('Sightengine HTTP error:', response.status)
      return NextResponse.json({ aprovado: false, motivo: 'Moderacao temporariamente indisponivel. Tente novamente em alguns minutos.' })
    }

    const resultado = await response.json()

    if (resultado.status !== 'success') {
      console.error('Sightengine erro:', resultado)
      return NextResponse.json({ aprovado: false, motivo: 'Moderacao temporariamente indisponivel. Tente novamente em alguns minutos.' })
    }

    // 5. Nudez — bloqueia se qualquer categoria relevante ultrapassar o threshold
    const nudity = resultado.nudity ?? {}
    const offensive = resultado.offensive?.prob ?? 0
    const gore = resultado.gore?.prob ?? 0

    const recusada =
      (nudity?.raw ?? 0) > 0.5 ||
      (nudity?.partial ?? 0) > 0.6 ||
      (nudity?.suggestive ?? 0) > 0.7 ||
      offensive > 0.7 ||
      gore > 0.7

    if (recusada) {
      // Notifica o usuário por email (fire-and-forget)
      if (user.email) {
        supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }) => {
            sendPhotoRejectedEmail(
              user.email!,
              profile?.name || '',
              'nudez ou conteúdo impróprio'
            ).catch(err => console.error('[moderar-foto] Falha ao enviar email de rejeição:', err))
          })
      }
      return NextResponse.json({
        aprovado: false,
        motivo: 'Foto recusada: contém nudez ou conteúdo impróprio. Use fotos com roupas.',
      })
    }

    // 6. Aprovada — fazer upload server-side e retornar URL
    const url = await uploadFoto(user.id, index, foto)
    if (!url) return NextResponse.json({ aprovado: false, motivo: 'Erro ao salvar a foto. Tente novamente.' })

    // Conceder XP pela foto aprovada (fire-and-forget)
    supabaseAdmin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'photo_added', p_base_xp: 10 }).then(() => {}).catch(() => {})

    return NextResponse.json({ aprovado: true, url })
  } catch (err) {
    console.error('Erro em moderar-foto:', err)
    return NextResponse.json({ aprovado: false, motivo: 'Erro inesperado. Tente novamente.' })
  }
}

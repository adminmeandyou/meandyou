// src/app/api/moderar-foto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_UPLOADS_POR_HORA = 10

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sessão do usuário
    const accessToken = req.cookies.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
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
    } catch (_) {}

    // 3. Pegar foto do form
    const formData = await req.formData()
    const foto = formData.get('foto') as File
    if (!foto) {
      return NextResponse.json({ error: 'Nenhuma foto enviada' }, { status: 400 })
    }

    // 4. Monta multipart/form-data para o Sightengine (formato correto da API)
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
      // Em caso de falha na API externa, aprovamos para não bloquear o usuário
      return NextResponse.json({ aprovado: true, aviso: 'moderacao_indisponivel' })
    }

    const resultado = await response.json()

    if (resultado.status !== 'success') {
      console.error('Sightengine erro:', resultado)
      return NextResponse.json({ aprovado: true, aviso: 'moderacao_indisponivel' })
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
      return NextResponse.json({
        aprovado: false,
        motivo: 'Foto recusada: contém nudez ou conteúdo impróprio. Use fotos com roupas.',
      })
    }

    return NextResponse.json({ aprovado: true })
  } catch (err) {
    console.error('Erro em moderar-foto:', err)
    // Em exceção inesperada, não bloqueia o upload
    return NextResponse.json({ aprovado: true, aviso: 'moderacao_indisponivel' })
  }
}

// src/app/api/moderar-foto/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const foto = formData.get('foto') as File
    if (!foto) {
      return NextResponse.json({ error: 'Nenhuma foto enviada' }, { status: 400 })
    }

    // Monta multipart/form-data para o Sightengine (formato correto da API)
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
      // O Sightengine tem apenas 100 requests/mês no free tier
      return NextResponse.json({ aprovado: true, aviso: 'moderacao_indisponivel' })
    }

    const resultado = await response.json()

    if (resultado.status !== 'success') {
      console.error('Sightengine erro:', resultado)
      return NextResponse.json({ aprovado: true, aviso: 'moderacao_indisponivel' })
    }

    // Nudez — bloqueia se qualquer categoria relevante ultrapassar o threshold
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

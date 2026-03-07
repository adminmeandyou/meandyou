import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const foto = formData.get('foto') as File
    if (!foto) return NextResponse.json({ error: 'Nenhuma foto enviada' }, { status: 400 })

    // Converte para base64
    const buffer = Buffer.from(await foto.arrayBuffer())
    const base64 = buffer.toString('base64')

    // Chama o Sightengine
    const params = new URLSearchParams({
      models: 'nudity-2.0,offensive',
      api_user: process.env.SIGHTENGINE_API_USER!,
      api_secret: process.env.SIGHTENGINE_API_SECRET!,
    })

    const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    })

    const resultado = await response.json()

    if (resultado.status !== 'success') {
      return NextResponse.json({ error: 'Erro ao verificar foto' }, { status: 500 })
    }

    // Verifica nudez — bloqueia se score > 0.5
    const nudity = resultado.nudity
    const offensive = resultado.offensive?.prob ?? 0

    const nudezDetectada =
      (nudity?.raw ?? 0) > 0.5 ||
      (nudity?.partial ?? 0) > 0.6 ||
      offensive > 0.7

    if (nudezDetectada) {
      return NextResponse.json({
        aprovado: false,
        motivo: 'Foto recusada: contém nudez ou conteúdo impróprio. Use fotos com roupas.'
      })
    }

    return NextResponse.json({ aprovado: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
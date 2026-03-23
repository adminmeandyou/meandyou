import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file')    as File   | null
    const caminho  = formData.get('caminho') as string | null
    const userId   = formData.get('userId')  as string | null
    const token    = formData.get('token')   as string | null

    if (!file || !caminho || !userId || !token) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Validar token
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

    if (!caminho.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 403 })
    }

    const buffer = await file.arrayBuffer()

    // Validação com Google Vision — apenas para frente do documento
    const isDocFrente = caminho.includes('/frente')
    const visionKey   = process.env.GOOGLE_CLOUD_VISION_API_KEY

    if (isDocFrente && visionKey) {
      // Busca CPF e nome cadastrados para comparação
      const { data: userData } = await supabase
        .from('users')
        .select('cpf, nome_completo')
        .eq('id', userId)
        .single()

      const cpfCadastrado  = (userData?.cpf ?? '').replace(/\D/g, '')
      const nomeCadastrado = normalizarTexto(userData?.nome_completo ?? '')
      const primeiroNome   = nomeCadastrado.split(' ')[0] ?? ''
      const ultimoNome     = nomeCadastrado.split(' ').pop() ?? ''

      try {
        const visionRes = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { content: Buffer.from(buffer).toString('base64') },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              }],
            }),
          }
        )

        const visionData = await visionRes.json()
        const textoRaw   = visionData?.responses?.[0]?.textAnnotations?.[0]?.description ?? ''

        if (textoRaw) {
          const textoNorm = normalizarTexto(textoRaw)

          // Verifica se CPF está no documento
          const cpfNoDoc = cpfCadastrado.length === 11 && textoNorm.includes(cpfCadastrado)

          // Verifica se pelo menos primeiro ou último nome está no documento
          const nomeNoDoc =
            (primeiroNome.length >= 3 && textoNorm.includes(primeiroNome)) ||
            (ultimoNome.length   >= 3 && textoNorm.includes(ultimoNome))

          if (!cpfNoDoc && !nomeNoDoc && cpfCadastrado.length === 11) {
            return NextResponse.json(
              {
                error:
                  'Os dados do documento não batem com o cadastro. ' +
                  'Use o documento que contém seu CPF ou nome completo visíveis na foto.',
              },
              { status: 422 }
            )
          }
        }
        // Sem texto extraído → aceita (foto fica salva para revisão manual)
      } catch (visionErr) {
        // Erro na Vision API → não bloqueia o usuário
        console.error('[upload-verificacao] Vision API error:', visionErr)
      }
    }

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

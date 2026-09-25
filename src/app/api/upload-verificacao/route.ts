import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

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
    // Valida sessão autenticada — userId vem da sessão, não do formulário
    const sessionClient = await createServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const userId = user.id

    const formData = await req.formData()
    const file     = formData.get('file')    as File   | null
    const caminho  = formData.get('caminho') as string | null
    const token    = formData.get('token')   as string | null

    if (!file || !caminho || !token) {
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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande (máx. 10 MB).' }, { status: 413 })
    }

    const buffer = await file.arrayBuffer()

    // Tipo real pelo conteúdo (magic bytes), não pelo nome/mime enviados pelo cliente
    const b = new Uint8Array(buffer.slice(0, 12))
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
    const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
    const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    const isPdf  = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46
    if (!isJpeg && !isPng && !isWebp && !isPdf) {
      return NextResponse.json({ error: 'Formato de imagem não suportado.' }, { status: 415 })
    }
    const contentType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : 'application/pdf'

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
        contentType,
        upsert: true,
      })

    if (error) {
      console.error('Erro no upload documentos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Guarda o caminho interno (bucket privado `documentos`) em `users` — as colunas
    // doc_*_url não existem em profiles e a URL /object/public/ não abre num bucket privado.
    // Para exibir no admin, gerar URL assinada a partir deste caminho.
    const userUpdate: Record<string, string> = {}
    if (caminho.includes('/frente')) userUpdate.documento_url = caminho
    else if (caminho.includes('/verso')) userUpdate.documento_verso_url = caminho
    else if (caminho.includes('/selfie')) userUpdate.selfie_url = caminho

    if (Object.keys(userUpdate).length > 0) {
      const { error: updErr } = await supabase.from('users').update(userUpdate).eq('id', userId)
      if (updErr) console.error('[upload-verificacao] falha ao salvar caminho:', updErr.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em upload-verificacao:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

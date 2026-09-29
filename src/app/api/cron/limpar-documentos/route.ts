import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { apagarDocumentosVerificacao, PRAZO_PENDENTE_DIAS } from '@/lib/documentos-verificacao'

// GET /api/cron/limpar-documentos (Vercel Cron, diário)
// Protegido por CRON_SECRET no header Authorization
//
// Apaga documento/selfie de verificações que ficaram pendentes por mais de
// PRAZO_PENDENTE_DIAS (LGPD art. 16). Verificados já têm os arquivos apagados na aprovação;
// aqui também pega qualquer sobra de quem já está verificado.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limite = Date.now() - PRAZO_PENDENTE_DIAS * 24 * 60 * 60 * 1000

  // Pastas do bucket = um usuário cada
  const { data: pastas, error } = await supabase.storage.from('documentos').list('', { limit: 1000 })
  if (error) {
    console.error('[cron] limpar-documentos list error:', error.message)
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  }

  const ids = (pastas ?? []).map(p => p.name).filter(n => /^[0-9a-f-]{36}$/i.test(n))
  if (ids.length === 0) return NextResponse.json({ ok: true, apagados: 0 })

  const { data: users } = await supabase.from('users').select('id, verified').in('id', ids)
  const verificado = new Map((users ?? []).map(u => [u.id, !!u.verified]))

  let apagados = 0
  for (const id of ids) {
    try {
      let apagar = verificado.get(id) === true || !verificado.has(id)
      if (!apagar) {
        const { data: arquivos } = await supabase.storage.from('documentos').list(id)
        const maisRecente = Math.max(0, ...(arquivos ?? []).map(a => new Date(a.created_at).getTime() || 0))
        apagar = maisRecente < limite
      }
      if (apagar) {
        await apagarDocumentosVerificacao(supabase, id)
        apagados++
      }
    } catch (err) {
      console.error('[cron] limpar-documentos erro em um usuário:', err)
    }
  }

  return NextResponse.json({ ok: true, apagados })
}

export async function GET(req: Request) { return run(req) }
export async function POST(req: Request) { return run(req) }

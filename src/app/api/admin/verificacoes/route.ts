// src/app/api/admin/verificacoes/route.ts
// Lista verificações pendentes e banidos para /admin/seguranca, e aprova verificação.
// Documentos ficam no bucket privado `documentos` → devolve URLs assinadas de curta duração.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { apagarDocumentosVerificacao } from '@/lib/documentos-verificacao'

const URL_TTL_SEGUNDOS = 600

async function exigirStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const { data: staff } = await supabaseAdmin.from('staff_members').select('id').eq('user_id', user.id).maybeSingle()
  if (profile?.role !== 'admin' && !staff) {
    return { erro: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { supabaseAdmin }
}

export async function GET(req: NextRequest) {
  try {
    const { erro, supabaseAdmin } = await exigirStaff()
    if (erro) return erro

    const tab = new URL(req.url).searchParams.get('tab') ?? 'verificacoes'

    if (tab === 'banidos') {
      const { data: perfis, error } = await supabaseAdmin!
        .from('profiles')
        .select('id, name, banned_reason, created_at')
        .eq('banned', true)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      const ids = (perfis ?? []).map(p => p.id)
      const { data: us } = ids.length
        ? await supabaseAdmin!.from('users').select('id, email').in('id', ids)
        : { data: [] as { id: string; email: string | null }[] }
      const email = Object.fromEntries((us ?? []).map(u => [u.id, u.email]))
      return NextResponse.json({ items: (perfis ?? []).map(p => ({ ...p, email: email[p.id] ?? null })) })
    }

    // Pendentes: enviaram documento/selfie mas ainda não estão verificados
    const { data: pendentes, error } = await supabaseAdmin!
      .from('users')
      .select('id, email, created_at, selfie_url, documento_url, documento_verso_url')
      .eq('verified', false)
      .eq('banned', false)
      .or('selfie_url.not.is.null,documento_url.not.is.null')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error

    const ids = (pendentes ?? []).map(u => u.id)
    const { data: perfis } = ids.length
      ? await supabaseAdmin!.from('profiles').select('id, name').in('id', ids).is('deleted_at', null)
      : { data: [] as { id: string; name: string | null }[] }
    const nome = Object.fromEntries((perfis ?? []).map(p => [p.id, p.name]))

    // Aceita tanto caminho (`uid/selfie.jpg`) quanto URL antiga `/object/public/documentos/...`
    const caminho = (v: string | null) => v ? v.replace(/^.*\/documentos\//, '') : null
    const assinar = async (v: string | null) => {
      const c = caminho(v)
      if (!c) return null
      const { data } = await supabaseAdmin!.storage.from('documentos').createSignedUrl(c, URL_TTL_SEGUNDOS)
      return data?.signedUrl ?? null
    }

    const items = await Promise.all((pendentes ?? []).filter(u => u.id in nome).map(async u => ({
      id: u.id,
      name: nome[u.id],
      email: u.email,
      created_at: u.created_at,
      selfie_url: await assinar(u.selfie_url),
      doc_frente_url: await assinar(u.documento_url),
      doc_verso_url: await assinar(u.documento_verso_url),
    })))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[admin/verificacoes] GET', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { erro, supabaseAdmin } = await exigirStaff()
    if (erro) return erro

    const { userId } = await req.json()
    if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    // O selo existe em users.verified (fonte do app) e profiles.verified — mantém os dois iguais
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabaseAdmin!.from('users').update({ verified: true }).eq('id', userId),
      supabaseAdmin!.from('profiles').update({ verified: true, reg_facial_verified: true }).eq('id', userId),
    ])
    if (e1 || e2) throw e1 ?? e2

    // Aprovado: documento e selfie não são mais necessários (LGPD)
    try {
      await apagarDocumentosVerificacao(supabaseAdmin!, userId)
    } catch (err) {
      console.error('[admin/verificacoes] Falha ao apagar documentos:', err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/verificacoes] POST', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

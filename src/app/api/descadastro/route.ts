// GET  /api/descadastro?u=&t= → página de confirmação (não altera nada: leitores de e-mail
//                                abrem links sozinhos para checar vírus)
// POST /api/descadastro?u=&t= → desliga os e-mails (botão da página e "Cancelar inscrição"
//                                do Gmail/Outlook, RFC 8058)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { assinaturaValida } from '@/lib/descadastro'

function pagina(titulo: string, texto: string, form = '') {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo} · MeAndYou</title></head>
<body style="margin:0;background:#0e0f13;color:#f8f9fa;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px">
<main style="max-width:420px;text-align:center">
<h1 style="font-size:22px;margin:0 0 12px">${titulo}</h1>
<p style="color:rgba(248,249,250,0.65);line-height:1.6;margin:0 0 24px">${texto}</p>${form}
<p style="margin-top:28px;font-size:13px"><a href="https://www.meandyou.com.br/configuracoes" style="color:#e11d48">Abrir configurações</a></p>
</main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

function params(req: NextRequest) {
  const url = new URL(req.url)
  return { u: url.searchParams.get('u') ?? '', t: url.searchParams.get('t') ?? '' }
}

export async function GET(req: NextRequest) {
  const { u, t } = params(req)
  if (!assinaturaValida(u, t)) {
    return pagina('Link inválido', 'Este link de descadastro não é válido. Você pode desligar os e-mails em Configurações no app.')
  }
  const acao = `/api/descadastro?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`
  return pagina(
    'Parar de receber e-mails?',
    'Você deixará de receber novidades e campanhas do MeAndYou por e-mail. E-mails de segurança da conta continuam chegando.',
    `<form method="post" action="${acao}"><button type="submit" style="background:#e11d48;color:#fff;border:0;border-radius:100px;padding:12px 28px;font-size:15px;font-weight:600;cursor:pointer">Confirmar descadastro</button></form>`,
  )
}

export async function POST(req: NextRequest) {
  const { u, t } = params(req)
  if (!assinaturaValida(u, t)) {
    return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  }
  try {
    const { error } = await createAdminClient().from('profiles').update({ notifications_email: false }).eq('id', u)
    if (error) throw error
  } catch (err) {
    console.error('[descadastro] POST', err)
    return pagina('Algo deu errado', 'Não conseguimos concluir agora. Tente de novo ou desligue os e-mails em Configurações no app.')
  }
  return pagina('Pronto', 'Você não vai mais receber e-mails de novidades e campanhas. Se mudar de ideia, é só religar em Configurações.')
}

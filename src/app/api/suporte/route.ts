import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const ADMIN_EMAIL = 'adminmeandyou@proton.me'

const CATEGORIA_LABELS: Record<string, string> = {
  verificacao: 'Verificação de identidade',
  pagamento:   'Pagamento / Assinatura',
  bug:         'Bug / Problema técnico',
  conta:       'Minha conta',
  outro:       'Outro',
}

export async function POST(req: NextRequest) {
  try {
    // Valida sessão pelo cookie
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const body = await req.json()
    const { nome, email, plano, prioridade, categoria, descricao } = body

    if (!categoria || !descricao?.trim()) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    if (descricao.trim().length < 20) {
      return NextResponse.json({ error: 'Descrição muito curta' }, { status: 400 })
    }

    // Sanitiza inputs antes de inserir em HTML — evita XSS no email do admin
    const sanitize = (str: string) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')

    const categoriaLabel = CATEGORIA_LABELS[categoria] ?? sanitize(categoria)
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const nomeSafe      = sanitize(nome ?? '')
    const emailSafe     = sanitize(email ?? '')
    const planoSafe     = sanitize(plano ?? '')
    const prioridadeSafe = sanitize(prioridade ?? '')
    const descricaoSafe = sanitize(descricao.trim())

    // Envia email para o admin com todas as informações
    await resend.emails.send({
      from: 'MeAndYou Suporte <noreply@meandyou.com.br>',
      to: ADMIN_EMAIL,
      subject: `[${prioridadeSafe}] ${categoriaLabel} — ${nomeSafe}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #b8f542; margin-bottom: 4px;">Novo chamado de suporte</h2>
          <p style="color: #888; font-size: 13px; margin-top: 0;">${agora}</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; color: #aaa; width: 140px; font-size: 13px;">Prioridade</td>
              <td style="padding: 10px 0; font-weight: bold; color: #fff; font-size: 13px;">${prioridadeSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Nome</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${nomeSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${emailSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Plano</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${planoSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Categoria</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${categoriaLabel}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">User ID</td>
              <td style="padding: 10px 0; color: #888; font-size: 11px;">${user.id}</td>
            </tr>
          </table>

          <div style="background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-top: 8px;">
            <p style="color: #aaa; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Descrição</p>
            <p style="color: #fff; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${descricaoSafe}</p>
          </div>

          <p style="color: #555; font-size: 11px; margin-top: 24px; text-align: center;">
            MeAndYou — Sistema de Suporte
          </p>
        </div>
      `,
    })

    // Envia confirmação para o usuário
    await resend.emails.send({
      from: 'MeAndYou Suporte <noreply@meandyou.com.br>',
      to: email,
      subject: 'Recebemos sua mensagem — MeAndYou',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0e0b14; color: #fff;">
          <h2 style="color: #b8f542;">Ola, ${nomeSafe}!</h2>
          <p style="color: #aaa; line-height: 1.6;">
            Recebemos sua mensagem na categoria <strong style="color: #fff;">${categoriaLabel}</strong>.
            ${plano === 'Black'
              ? 'Por ser assinante Black, seu chamado e <strong style="color: #f5c842;">prioritario</strong> e sera respondido em ate 24h.'
              : 'Responderemos o mais breve possivel pelo email cadastrado.'}
          </p>
          <p style="color: #555; font-size: 12px; margin-top: 32px;">MeAndYou — meandyou.com.br</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Suporte API error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

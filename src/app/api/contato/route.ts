import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'adminmeandyou@proton.me'

const ASSUNTO_LABELS: Record<string, string> = {
  suporte:  'Suporte técnico',
  conta:    'Minha conta',
  cobranca: 'Cobrança / plano',
  denuncia: 'Denúncia de perfil',
  parceria: 'Parceria',
  outro:    'Outro',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, assunto, mensagem } = body

    if (!nome?.trim() || !email?.trim() || !assunto || !mensagem?.trim()) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    if (mensagem.trim().length < 10) {
      return NextResponse.json({ error: 'Mensagem muito curta' }, { status: 400 })
    }

    const sanitize = (str: string) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')

    const assuntoLabel = ASSUNTO_LABELS[assunto] ?? sanitize(assunto)
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const nomeSafe     = sanitize(nome.trim())
    const emailSafe    = sanitize(email.trim())
    const mensagemSafe = sanitize(mensagem.trim())

    await resend.emails.send({
      from: 'MeAndYou Contato <noreply@meandyou.com.br>',
      to: ADMIN_EMAIL,
      subject: `[Contato] ${assuntoLabel} — ${nomeSafe}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #E11D48; margin-bottom: 4px;">Novo contato via landing page</h2>
          <p style="color: #888; font-size: 13px; margin-top: 0;">${agora}</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; color: #aaa; width: 140px; font-size: 13px;">Nome</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${nomeSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${emailSafe}</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 10px 0; color: #aaa; font-size: 13px;">Assunto</td>
              <td style="padding: 10px 0; color: #fff; font-size: 13px;">${assuntoLabel}</td>
            </tr>
          </table>

          <div style="background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-top: 8px;">
            <p style="color: #aaa; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Mensagem</p>
            <p style="color: #fff; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${mensagemSafe}</p>
          </div>

          <p style="color: #555; font-size: 11px; margin-top: 24px; text-align: center;">
            MeAndYou — Formulário de contato público
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contato API error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// src/app/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'MeAndYou <noreply@meandyou.com.br>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meandyou.com.br'

// ── Boas-vindas após cadastro ─────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, nome: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bem-vindo(a) ao MeAndYou! 💚',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2ec4a0;">Olá, ${nome}! 👋</h2>
        <p>Sua conta foi criada com sucesso. Agora complete seu perfil e comece a descobrir pessoas incríveis.</p>
        <a href="${APP_URL}/perfil" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Completar meu perfil
        </a>
        <p style="color:#7a9189;font-size:13px;margin-top:24px;">MeAndYou — Relacionamentos com verificação real.</p>
      </div>
    `,
  })
}

// ── Link de verificação de identidade ────────────────────────────────────
export async function sendVerificationEmail(email: string, nome: string, token: string) {
  const link = `${APP_URL}/verificacao?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verifique sua identidade no MeAndYou',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2ec4a0;">Verificação de identidade</h2>
        <p>Olá, ${nome}. Clique no botão abaixo no seu <strong>celular</strong> para verificar sua identidade. O link expira em 30 minutos.</p>
        <a href="${link}" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verificar identidade
        </a>
        <p style="color:#7a9189;font-size:13px;margin-top:24px;">⚠️ Este link só funciona em celular real. Se você não solicitou isso, ignore.</p>
      </div>
    `,
  })
}

// ── Recuperação de senha ──────────────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, nome: string, token: string) {
  const link = `${APP_URL}/nova-senha?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinir senha — MeAndYou',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2ec4a0;">Redefinir sua senha</h2>
        <p>Olá, ${nome}. Clique no botão abaixo para criar uma nova senha. O link expira em 30 minutos.</p>
        <a href="${link}" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Redefinir senha
        </a>
        <p style="color:#7a9189;font-size:13px;margin-top:24px;">Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
  })
}

// ── Reativação — curtidas não vistas (5 dias inativo) ────────────────────
export async function sendReactivationLikesEmail(email: string, nome: string, qtd: number) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} você enquanto você estava fora 👀`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2ec4a0;">Alguém está esperando por você!</h2>
        <p>Olá, ${nome}! <strong>${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} seu perfil</strong> enquanto você estava fora. Não deixe elas esperando!</p>
        <a href="${APP_URL}/busca" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Ver quem curtiu
        </a>
      </div>
    `,
  })
}

// ── Reativação — streak em risco (7 dias inativo) ────────────────────────
export async function sendReactivationStreakEmail(email: string, nome: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Seu streak está em risco! ⚠️ Faltam 2 dias para resetar',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #d4a017;">⚠️ Seu streak vai resetar!</h2>
        <p>Olá, ${nome}! Você está há 7 dias sem entrar no MeAndYou. Se não entrar hoje, sua sequência de prêmios vai resetar do zero.</p>
        <a href="${APP_URL}/streak" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Salvar meu streak agora
        </a>
      </div>
    `,
  })
}

// ── Reativação — matches esperando (10 dias inativo) ─────────────────────
export async function sendReactivationMatchesEmail(email: string, nome: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Você tem matches esperando por você 💚',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2ec4a0;">Seus matches estão com saudade!</h2>
        <p>Olá, ${nome}! Faz um tempo que você não aparece. Seus matches estão esperando uma mensagem sua.</p>
        <a href="${APP_URL}/conversas" style="display:inline-block;background:#2ec4a0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Abrir conversas
        </a>
      </div>
    `,
  })
}

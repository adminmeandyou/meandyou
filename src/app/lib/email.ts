// src/app/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'MeAndYou <noreply@meandyou.com.br>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meandyou.com.br'

// ─── Helpers de template ──────────────────────────────────────────────────

function base(content: string, previewText = '') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>MeAndYou</title>
</head>
<body style="margin:0;padding:0;background:#0d1b16;font-family:'Segoe UI',Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1b16;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${APP_URL}" style="text-decoration:none;">
            <span style="font-size:28px;font-weight:800;color:#2ec4a0;letter-spacing:-0.5px;">Me</span><span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AndYou</span>
          </a>
        </td></tr>
        <tr><td style="background:#152620;border-radius:16px;padding:36px 36px 28px;border:1px solid #1e3a2e;">
          ${content}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#3a6a5a;line-height:1.8;">
            Você está recebendo este email porque tem uma conta no MeAndYou.<br/>
            <a href="${APP_URL}/privacidade" style="color:#2ec4a0;text-decoration:none;">Privacidade</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}/termos" style="color:#2ec4a0;text-decoration:none;">Termos</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}/suporte" style="color:#2ec4a0;text-decoration:none;">Suporte</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const btn = (href: string, label: string, cor = '#2ec4a0') =>
  `<a href="${href}" style="display:inline-block;background:${cor};color:${cor === '#2ec4a0' ? '#0d1b16' : '#ffffff'};padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:20px;">${label}</a>`

const heading = (text: string) =>
  `<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">${text}</h2>`

const sub = (text: string) =>
  `<p style="margin:0 0 20px;font-size:15px;color:#7ab5a0;line-height:1.6;">${text}</p>`

const divider = () =>
  `<hr style="border:none;border-top:1px solid #1e3a2e;margin:24px 0;"/>`

const badge = (text: string, cor = '#2ec4a0') =>
  `<span style="display:inline-block;background:${cor}22;color:${cor};font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid ${cor}44;margin-bottom:16px;">${text}</span>`

const note = (text: string) =>
  `<p style="margin:20px 0 0;font-size:12px;color:#3a6a5a;line-height:1.5;">${text}</p>`

const infoBox = (titulo: string, itens: string[], cor = '#2ec4a0') =>
  `<div style="background:#0d1b16;border-radius:10px;padding:16px;margin:12px 0;border:1px solid #1e3a2e;">
    ${titulo ? `<p style="margin:0 0 8px;font-size:13px;color:${cor};font-weight:600;">${titulo}</p>` : ''}
    <ul style="margin:0;padding:0 0 0 16px;color:#7ab5a0;font-size:13px;line-height:2;">${itens.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>`

const alertBox = (text: string, cor = '#f59e0b') =>
  `<div style="background:#0d1b16;border-radius:10px;padding:14px 16px;margin:12px 0;border:1px solid ${cor}44;">
    <p style="margin:0;font-size:13px;color:#7ab5a0;">${text}</p>
  </div>`

// ═════════════════════════════════════════════════════════════════════════
// 1️⃣  OBRIGATÓRIOS — CONTA
// ═════════════════════════════════════════════════════════════════════════

// 1. Boas-vindas + confirmação de cadastro
export async function sendWelcomeEmail(email: string, nome: string) {
  const content = `
    ${badge('Conta criada com sucesso')}
    ${heading(`Olá, ${nome}! Bem-vindo(a) 💚`)}
    ${sub('Sua conta foi criada. Complete seu perfil para começar a aparecer para outras pessoas.')}
    ${infoBox('Próximos passos:', [
      '📷 Adicione pelo menos 3 fotos',
      '✏️ Preencha sua bio e interesses',
      '🎯 Configure seus filtros',
      '✅ Verifique sua identidade para ganhar o selo',
    ])}
    ${btn(`${APP_URL}/perfil`, 'Completar meu perfil')}
    ${note('Se não foi você que criou esta conta, entre em contato pelo suporte imediatamente.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Bem-vindo(a) ao MeAndYou',
    html: base(content, `Olá ${nome}, sua conta foi criada. Complete seu perfil agora.`),
  })
}

// 2. Verificação de identidade (token customizado — fluxo do app)
export async function sendVerificationEmail(email: string, nome: string, token: string) {
  const link = `${APP_URL}/verificacao?token=${token}`
  const content = `
    ${badge('Verificação de identidade')}
    ${heading('Verifique sua identidade')}
    ${sub(`Olá, ${nome}. Para garantir a segurança de todos, precisamos confirmar que você é uma pessoa real. Este link expira em <strong style="color:#ffffff;">30 minutos</strong>.`)}
    ${alertBox('⚠️ <strong style="color:#ffffff;">Abra este link no seu celular.</strong> O processo usa a câmera do dispositivo.')}
    ${btn(link, 'Verificar minha identidade')}
    ${note('Este link é pessoal e intransferível. Se não solicitou, ignore este email.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Verifique sua identidade no MeAndYou',
    html: base(content, 'Confirme sua identidade para ganhar o selo verificado.'),
  })
}

// 3. Redefinição de senha
export async function sendPasswordResetEmail(email: string, nome: string, token: string) {
  const link = `${APP_URL}/nova-senha?token=${token}`
  const content = `
    ${badge('Redefinição de senha')}
    ${heading('Redefinir sua senha')}
    ${sub(`Olá, ${nome}. Recebemos uma solicitação para redefinir a senha da sua conta. O link expira em <strong style="color:#ffffff;">30 minutos</strong>.`)}
    ${btn(link, 'Redefinir minha senha')}
    ${divider()}
    ${alertBox('🔒 Se não foi você que solicitou, <strong style="color:#ffffff;">ignore este email</strong>. Sua senha não será alterada.')}
    ${note('Nunca compartilhe este link. O MeAndYou jamais pedirá sua senha.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Redefinir senha - MeAndYou',
    html: base(content, 'Solicitação de redefinição de senha recebida.'),
  })
}

// 4. Confirmação de alteração de senha
export async function sendPasswordChangedEmail(email: string, nome: string) {
  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const content = `
    ${badge('Segurança da conta', '#22c55e')}
    ${heading('Sua senha foi alterada')}
    ${sub(`Olá, ${nome}. Sua senha foi alterada com sucesso em ${horario}.`)}
    ${alertBox('⚠️ Se <strong style="color:#ffffff;">não foi você</strong> que fez esta alteração, entre em contato com o suporte imediatamente.', '#ef4444')}
    ${btn(`${APP_URL}/suporte`, 'Reportar acesso indevido', '#ef4444')}
    ${note('Se foi você, pode ignorar este email com segurança.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '🔒 Sua senha foi alterada — MeAndYou',
    html: base(content, 'Sua senha foi alterada. Se não foi você, aja agora.'),
  })
}

// 5. Confirmação de alteração de e-mail
export async function sendEmailChangeConfirmEmail(novoEmail: string, nome: string, token: string) {
  const link = `${APP_URL}/confirmar-email?token=${token}`
  const content = `
    ${badge('Alteração de e-mail')}
    ${heading('Confirme seu novo e-mail')}
    ${sub(`Olá, ${nome}. Recebemos uma solicitação para alterar o e-mail da sua conta para <strong style="color:#ffffff;">${novoEmail}</strong>. Clique para confirmar.`)}
    ${btn(link, 'Confirmar novo e-mail')}
    ${alertBox('⚠️ Se não foi você que solicitou, ignore este email e seu endereço anterior continuará ativo.')}
    ${note('Este link expira em 1 hora.')}
  `
  await resend.emails.send({
    from: FROM, to: novoEmail,
    subject: 'Confirme seu novo e-mail — MeAndYou',
    html: base(content, 'Confirme a alteração do seu endereço de e-mail.'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 1️⃣  OBRIGATÓRIOS — SEGURANÇA
// ═════════════════════════════════════════════════════════════════════════

// 6. Login em novo dispositivo
export async function sendNewDeviceLoginEmail(email: string, nome: string, dispositivo: string, local: string) {
  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const content = `
    ${badge('Novo acesso detectado', '#f59e0b')}
    ${heading('Login em novo dispositivo')}
    ${sub(`Olá, ${nome}. Detectamos um acesso à sua conta a partir de um dispositivo diferente.`)}
    ${infoBox('Detalhes do acesso:', [
      `🖥️ Dispositivo: ${dispositivo}`,
      `📍 Local aproximado: ${local}`,
      `🕐 Horário: ${horario}`,
    ], '#f59e0b')}
    ${alertBox('Se foi você, pode ignorar. Caso contrário, redefina sua senha agora.', '#ef4444')}
    ${btn(`${APP_URL}/recuperar-senha`, 'Redefinir senha por segurança', '#ef4444')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '⚠️ Novo login detectado na sua conta — MeAndYou',
    html: base(content, 'Detectamos um acesso em novo dispositivo. Verifique se foi você.'),
  })
}

// 7. Tentativa de login suspeita
export async function sendSuspiciousLoginEmail(email: string, nome: string, tentativas: number) {
  const content = `
    ${badge('Atividade suspeita', '#ef4444')}
    ${heading('Tentativas de acesso suspeitas')}
    ${sub(`Olá, ${nome}. Detectamos <strong style="color:#ef4444;">${tentativas} tentativas de login com falha</strong> na sua conta nas últimas horas.`)}
    ${alertBox('Se não foi você, alguém pode estar tentando acessar sua conta. Redefina sua senha imediatamente.', '#ef4444')}
    ${btn(`${APP_URL}/recuperar-senha`, 'Redefinir minha senha agora', '#ef4444')}
    ${note('Se foi você que errou a senha, aguarde o desbloqueio automático e tente novamente.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '🚨 Tentativas suspeitas de acesso à sua conta',
    html: base(content, `${tentativas} tentativas de login com falha detectadas.`),
  })
}

// 8. Conta bloqueada temporariamente
export async function sendAccountBlockedEmail(email: string, nome: string, minutosRestantes: number) {
  const content = `
    ${badge('Conta bloqueada', '#ef4444')}
    ${heading('Sua conta foi bloqueada temporariamente')}
    ${sub(`Olá, ${nome}. Por segurança, sua conta foi bloqueada após várias tentativas de login incorretas.`)}
    ${infoBox('O que fazer:', [
      `⏳ Aguarde ${minutosRestantes} minuto(s) para tentar novamente`,
      '🔑 Ou redefina sua senha agora para desbloquear imediatamente',
    ], '#ef4444')}
    ${btn(`${APP_URL}/recuperar-senha`, 'Redefinir senha e desbloquear')}
    ${note('Bloqueios temporários protegem sua conta contra acessos não autorizados.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '🔒 Conta bloqueada temporariamente — MeAndYou',
    html: base(content, 'Sua conta foi bloqueada. Veja como desbloquear.'),
  })
}

// 9. Confirmação de exclusão de conta
export async function sendAccountDeletedEmail(email: string, nome: string) {
  const content = `
    ${badge('Conta excluída', '#6b7280')}
    ${heading(`Até logo, ${nome}`)}
    ${sub('Sua conta e todos os seus dados foram excluídos permanentemente, conforme a LGPD.')}
    ${infoBox('O que foi removido:', [
      'Perfil e informações pessoais',
      'Fotos e documentos enviados',
      'Histórico de conversas e matches',
      'Dados de assinatura',
    ], '#6b7280')}
    ${note('Esta ação é irreversível. Para usar o MeAndYou novamente, será necessário criar uma nova conta.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Sua conta foi excluída — MeAndYou',
    html: base(content, 'Seus dados foram removidos permanentemente conforme a LGPD.'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 1️⃣  OBRIGATÓRIOS — PAGAMENTO
// ═════════════════════════════════════════════════════════════════════════

// 10. Confirmação de compra / plano ativado
export async function sendPlanActivatedEmail(email: string, nome: string, plano: 'Plus' | 'Black', valorPago?: string) {
  const isBlack = plano === 'Black'
  const cor = isBlack ? '#a855f7' : '#3b82f6'
  const features = isBlack
    ? ['10 SuperCurtidas por dia', 'Lupas ilimitadas', 'Acesso ao Backstage (Sugar e Fetiche)', 'Desfazer curtida ilimitado', 'Boost diário automático', '3 Tickets diários para a Roleta', 'Suporte prioritário']
    : ['5 SuperCurtidas por dia', '2 Lupas por dia', 'Desfazer curtida (1/dia)', 'Filtros avançados desbloqueados']
  const content = `
    ${badge(`🎉 Plano ${plano} ativado!`, cor)}
    ${heading(`Seu plano ${plano} está ativo, ${nome}!`)}
    ${sub(`Pagamento confirmado${valorPago ? ` de <strong style="color:#ffffff;">${valorPago}</strong>` : ''}. Confira seus benefícios:`)}
    ${infoBox('Seus benefícios:', features, cor)}
    ${btn(`${APP_URL}/busca`, 'Começar a usar agora')}
    ${note('Em caso de dúvidas sobre cobranças, acesse o suporte.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🎉 Plano ${plano} ativado — MeAndYou`,
    html: base(content, `Seu plano ${plano} foi ativado com sucesso!`),
  })
}

// 11. Recibo / fatura
export async function sendReceiptEmail(
  email: string,
  nome: string,
  plano: string,
  valor: string,
  dataCobranca: string,
  proximaCobranca?: string,
) {
  const content = `
    ${badge('Recibo de pagamento', '#22c55e')}
    ${heading('Pagamento confirmado')}
    ${sub(`Olá, ${nome}. Seu pagamento foi processado com sucesso. Guarde este recibo.`)}
    ${infoBox('Detalhes da transação:', [
      `📦 Plano: ${plano}`,
      `💵 Valor: ${valor}`,
      `📅 Data: ${dataCobranca}`,
      ...(proximaCobranca ? [`🔄 Próxima cobrança: ${proximaCobranca}`] : []),
    ], '#22c55e')}
    ${btn(`${APP_URL}/minha-assinatura`, 'Ver minha assinatura')}
    ${note('Para cancelar sua assinatura ou questionar uma cobrança, acesse o suporte.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `Recibo — ${plano} ${valor} — MeAndYou`,
    html: base(content, `Pagamento de ${valor} confirmado para o plano ${plano}.`),
  })
}

// 12. Lembrete de renovação
export async function sendRenewalReminderEmail(
  email: string,
  nome: string,
  plano: string,
  dataRenovacao: string,
  valor: string,
) {
  const content = `
    ${badge('Renovação em breve', '#f59e0b')}
    ${heading('Sua assinatura será renovada em breve')}
    ${sub(`Olá, ${nome}. Sua assinatura do plano <strong style="color:#ffffff;">${plano}</strong> será renovada automaticamente.`)}
    ${infoBox('Detalhes da renovação:', [
      `📦 Plano: ${plano}`,
      `💵 Valor: ${valor}`,
      `📅 Data de renovação: ${dataRenovacao}`,
    ], '#f59e0b')}
    ${btn(`${APP_URL}/minha-assinatura`, 'Gerenciar assinatura')}
    ${note('Para cancelar antes da renovação, acesse Configurações → Plano → Cancelar assinatura.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `Sua assinatura ${plano} renova em ${dataRenovacao} — MeAndYou`,
    html: base(content, `Renovação do plano ${plano} em ${dataRenovacao}.`),
  })
}

// 13. Falha no pagamento
export async function sendPaymentFailedEmail(email: string, nome: string, plano: string, motivo?: string) {
  const content = `
    ${badge('Falha no pagamento', '#ef4444')}
    ${heading('Não conseguimos processar seu pagamento')}
    ${sub(`Olá, ${nome}. Houve um problema ao processar o pagamento do plano <strong style="color:#ffffff;">${plano}</strong>${motivo ? `: <strong style="color:#ef4444;">${motivo}</strong>` : '.'}`)}
    ${infoBox('O que pode ter acontecido:', [
      'Saldo insuficiente ou limite de crédito',
      'Dados do cartão desatualizados',
      'Cartão expirado ou bloqueado pelo banco',
    ], '#ef4444')}
    ${btn(`${APP_URL}/minha-assinatura`, 'Atualizar forma de pagamento', '#ef4444')}
    ${note('Se o problema persistir, entre em contato com o suporte ou com seu banco.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '⚠️ Falha no pagamento — MeAndYou',
    html: base(content, 'Não conseguimos processar seu pagamento. Veja como resolver.'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 1️⃣  OBRIGATÓRIOS — LEGAL / PRIVACIDADE
// ═════════════════════════════════════════════════════════════════════════

// 14. Atualização dos Termos de Uso
export async function sendTermsUpdatedEmail(email: string, nome: string, dataVigencia: string) {
  const content = `
    ${badge('📄 Termos atualizados')}
    ${heading('Nossos Termos de Uso foram atualizados')}
    ${sub(`Olá, ${nome}. Atualizamos nossos Termos de Uso. As mudanças entram em vigor em <strong style="color:#ffffff;">${dataVigencia}</strong>.`)}
    ${alertBox('Ao continuar usando o MeAndYou após essa data, você concorda com os novos termos.')}
    ${btn(`${APP_URL}/termos`, 'Ler os novos termos')}
    ${note('Se tiver dúvidas, entre em contato pelo suporte.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Atualização dos Termos de Uso — MeAndYou',
    html: base(content, `Termos de Uso atualizados. Vigência a partir de ${dataVigencia}.`),
  })
}

// 15. Atualização da Política de Privacidade
export async function sendPrivacyUpdatedEmail(email: string, nome: string, dataVigencia: string) {
  const content = `
    ${badge('🔏 Política de Privacidade')}
    ${heading('Nossa Política de Privacidade foi atualizada')}
    ${sub(`Olá, ${nome}. Atualizamos nossa Política de Privacidade para melhor atender à LGPD. As mudanças entram em vigor em <strong style="color:#ffffff;">${dataVigencia}</strong>.`)}
    ${alertBox('Ao continuar usando o MeAndYou após essa data, você concorda com a nova política.')}
    ${btn(`${APP_URL}/privacidade`, 'Ler a nova política')}
    ${note('Para solicitações LGPD, acesse o suporte.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Atualização da Política de Privacidade — MeAndYou',
    html: base(content, `Política de Privacidade atualizada. Vigência a partir de ${dataVigencia}.`),
  })
}

// 16. Confirmação de exclusão de dados (LGPD)
export async function sendDataDeletionConfirmedEmail(email: string, nome: string) {
  const content = `
    ${badge('✅ Dados excluídos', '#22c55e')}
    ${heading('Seus dados foram excluídos')}
    ${sub(`Olá, ${nome}. Confirmamos que todos os seus dados pessoais foram removidos permanentemente, conforme a LGPD.`)}
    ${infoBox('O que foi excluído:', [
      'Dados de perfil e informações pessoais',
      'Fotos, documentos e mídias',
      'Histórico de conversas e matches',
      'Dados de pagamento e assinatura',
      'Registros de atividade',
    ], '#22c55e')}
    ${note('Guarde este email como comprovante da exclusão. Esta ação é irreversível.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '✅ Confirmação de exclusão de dados — MeAndYou',
    html: base(content, 'Seus dados foram excluídos conforme solicitado (LGPD).'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 2️⃣  INSTITUCIONAIS — ONBOARDING
// ═════════════════════════════════════════════════════════════════════════

// 17. Dicas de uso (enviado D+2 após cadastro)
export async function sendOnboardingTipsEmail(email: string, nome: string) {
  const content = `
    ${badge('💡 Dicas para você começar')}
    ${heading(`${nome}, aproveite o máximo do MeAndYou`)}
    ${sub('Separamos as melhores dicas para você se destacar e criar conexões reais:')}
    ${infoBox('🎯 Para mais matches:', [
      'Use fotos recentes e de boa qualidade (mínimo 3)',
      'Preencha a bio de forma autêntica',
      'Configure os filtros com o que realmente importa',
      'Verifique sua identidade para ganhar destaque',
    ])}
    ${infoBox('🚀 Recursos que vale usar:', [
      'Roleta diária — gire para ganhar SuperLikes e Boosts',
      'Destaque — veja quem curtiu você antes do match',
      'Streak — entre todo dia e ganhe recompensas crescentes',
    ])}
    ${btn(`${APP_URL}/perfil`, 'Completar meu perfil')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '💡 Dicas para criar conexões reais no MeAndYou',
    html: base(content, 'Veja como aproveitar ao máximo o MeAndYou.'),
  })
}

// 18. Lembrete de perfil incompleto
export async function sendIncompleteProfileEmail(email: string, nome: string, porcentagem: number) {
  const pendentes = [
    porcentagem < 30 ? '📷 Adicione pelo menos 3 fotos' : null,
    porcentagem < 50 ? '✏️ Preencha sua bio' : null,
    porcentagem < 70 ? '🎯 Defina seus interesses e filtros' : null,
    '✅ Verifique sua identidade para ganhar o selo',
  ].filter(Boolean) as string[]
  const content = `
    ${badge(`Perfil ${porcentagem}% completo`, '#f59e0b')}
    ${heading('Seu perfil ainda está incompleto')}
    ${sub(`Olá, ${nome}. Perfis completos recebem <strong style="color:#ffffff;">até 3× mais curtidas</strong>. Faltam poucos passos:`)}
    ${infoBox('O que falta:', pendentes, '#f59e0b')}
    ${btn(`${APP_URL}/perfil`, 'Completar meu perfil')}
    ${note('Leva menos de 3 minutos. Vale muito a pena!')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `Seu perfil está ${porcentagem}% completo — finalize agora`,
    html: base(content, `Complete seu perfil e receba até 3× mais curtidas.`),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 2️⃣  INSTITUCIONAIS — SUPORTE
// ═════════════════════════════════════════════════════════════════════════

// 19. Ticket de suporte aberto
export async function sendSupportTicketOpenedEmail(email: string, nome: string, ticketId: string, assunto: string) {
  const content = `
    ${badge('🎫 Ticket aberto')}
    ${heading('Recebemos sua solicitação')}
    ${sub(`Olá, ${nome}. Recebemos seu contato e nossa equipe irá analisar em breve.`)}
    ${infoBox('Detalhes do ticket:', [
      `🔖 Número: #${ticketId}`,
      `📝 Assunto: ${assunto}`,
      `⏱️ Prazo de resposta: até 24 horas úteis`,
    ])}
    ${btn(`${APP_URL}/suporte`, 'Ver meu ticket')}
    ${note('Você receberá um email assim que houver uma atualização.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `Ticket #${ticketId} aberto — MeAndYou Suporte`,
    html: base(content, `Ticket #${ticketId} aberto. Responderemos em até 24h úteis.`),
  })
}

// 20. Ticket de suporte resolvido
export async function sendSupportTicketResolvedEmail(email: string, nome: string, ticketId: string, resposta: string) {
  const content = `
    ${badge('✅ Ticket respondido', '#22c55e')}
    ${heading('Sua solicitação foi respondida')}
    ${sub(`Olá, ${nome}. O ticket <strong style="color:#ffffff;">#${ticketId}</strong> foi respondido:`)}
    <div style="background:#0d1b16;border-radius:10px;padding:16px;margin:12px 0;border:1px solid #1e3a2e;">
      <p style="margin:0;font-size:14px;color:#7ab5a0;line-height:1.7;">${resposta}</p>
    </div>
    ${btn(`${APP_URL}/suporte`, 'Ver resposta completa')}
    ${note('Se o problema não foi resolvido, responda diretamente pelo suporte no app.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `✅ Ticket #${ticketId} respondido — MeAndYou`,
    html: base(content, `Seu ticket #${ticketId} foi respondido.`),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 2️⃣  INSTITUCIONAIS — VERIFICAÇÃO E FOTOS
// ═════════════════════════════════════════════════════════════════════════

// 21. Verificação aprovada
export async function sendVerificationApprovedEmail(email: string, nome: string) {
  const content = `
    ${badge('✅ Identidade confirmada', '#22c55e')}
    ${heading('Sua verificação foi aprovada!')}
    ${sub(`Parabéns, ${nome}! Sua identidade foi verificada. Seu perfil agora exibe o <strong style="color:#2ec4a0;">selo ✅ verificado</strong>.`)}
    ${infoBox('O que você ganhou:', [
      '✅ Selo verificado visível no perfil',
      '+15 pontos de completude do perfil',
      'Mais destaque nos resultados de busca',
      'Maior confiança para outros usuários',
    ], '#22c55e')}
    ${btn(`${APP_URL}/busca`, 'Explorar perfis agora')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '✅ Identidade verificada — MeAndYou',
    html: base(content, 'Sua identidade foi verificada com sucesso!'),
  })
}

// 22. Verificação reprovada
export async function sendVerificationRejectedEmail(email: string, nome: string, motivo?: string) {
  const content = `
    ${badge('Verificação não aprovada', '#f59e0b')}
    ${heading('Precisamos tentar novamente')}
    ${sub(`Olá, ${nome}. Não conseguimos verificar sua identidade desta vez.${motivo ? ` Motivo: <strong style="color:#f59e0b;">${motivo}</strong>.` : ''}`)}
    ${infoBox('Dicas para a próxima tentativa:', [
      'Use ambiente com boa iluminação',
      'Mantenha o documento sem reflexos ou dobras',
      'Enquadre rosto e documento conforme solicitado',
      'Use o celular com câmera de boa qualidade',
    ], '#f59e0b')}
    ${btn(`${APP_URL}/verificacao`, 'Tentar novamente')}
    ${note('Se o problema persistir, entre em contato pelo suporte.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Verificação não aprovada — tente novamente',
    html: base(content, 'Não conseguimos verificar sua identidade. Veja as dicas.'),
  })
}

// 23. Foto rejeitada pela moderação
export async function sendPhotoRejectedEmail(email: string, nome: string, motivo?: string) {
  const content = `
    ${badge('Foto não aprovada', '#ef4444')}
    ${heading('Uma foto foi removida do seu perfil')}
    ${sub(`Olá, ${nome}. Uma das suas fotos não passou pela moderação${motivo ? ` — <strong style="color:#ef4444;">${motivo}</strong>` : ''} e foi removida.`)}
    ${infoBox('Não é permitido:', [
      'Fotos com nudez ou conteúdo sexual explícito',
      'Fotos de outras pessoas sem consentimento',
      'Imagens com texto de contato (WhatsApp, Instagram etc.)',
      'Capturas de tela ou imagens de baixa qualidade',
    ], '#ef4444')}
    ${btn(`${APP_URL}/perfil`, 'Atualizar minhas fotos')}
    ${note('Se acredita que foi um erro, entre em contato com o suporte para revisão manual.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Uma foto do seu perfil foi removida',
    html: base(content, 'Uma das suas fotos não passou pela moderação.'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 3️⃣  ENGAJAMENTO — MATCHES E CONVERSAS
// ═════════════════════════════════════════════════════════════════════════

// 24. Novo match
export async function sendNewMatchEmail(email: string, nome: string, nomeMatch: string) {
  const content = `
    ${badge('💚 Novo Match!')}
    ${heading(`Você deu match com ${nomeMatch}!`)}
    ${sub(`Boa notícia, ${nome}! Você e <strong style="color:#ffffff;">${nomeMatch}</strong> se curtiram. Agora vocês podem conversar!`)}
    ${btn(`${APP_URL}/conversas`, 'Iniciar conversa')}
    ${note('Quem age primeiro tem mais chances de conexão real. Seja você mesmo!')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `💚 Você deu match com ${nomeMatch}!`,
    html: base(content, `Você e ${nomeMatch} se curtiram. Inicie a conversa agora!`),
  })
}

// 25. Alguém curtiu você
export async function sendNewLikeEmail(email: string, nome: string, qtd: number) {
  const content = `
    ${badge('❤️ Você recebeu curtidas')}
    ${heading(`${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} você!`)}
    ${sub(`Olá, ${nome}! <strong style="color:#ffffff;">${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} seu perfil</strong>. Curta de volta para criar um match!`)}
    ${btn(`${APP_URL}/busca`, 'Ver e curtir de volta')}
    ${note('Use o Destaque para ver quem curtiu você antes de dar match.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `❤️ ${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} você!`,
    html: base(content, `${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} seu perfil.`),
  })
}

// 26. Alguém visitou seu perfil
export async function sendProfileViewEmail(email: string, nome: string, qtdVisitas: number) {
  const content = `
    ${badge('👀 Visitas no seu perfil')}
    ${heading(`${qtdVisitas} ${qtdVisitas === 1 ? 'pessoa visitou' : 'pessoas visitaram'} seu perfil!`)}
    ${sub(`Olá, ${nome}. Seu perfil está chamando atenção!`)}
    ${btn(`${APP_URL}/destaque`, 'Ver quem me visitou')}
    ${note('Perfis com foto verificada e bio completa recebem muito mais visitas.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `👀 ${qtdVisitas} ${qtdVisitas === 1 ? 'pessoa visitou' : 'pessoas visitaram'} seu perfil`,
    html: base(content, `${qtdVisitas} visitas no seu perfil recentemente.`),
  })
}

// 27. Conversa iniciada (primeiro contato)
export async function sendConversationStartedEmail(email: string, nome: string, nomeRemetente: string) {
  const content = `
    ${badge('💬 Nova conversa')}
    ${heading(`${nomeRemetente} iniciou uma conversa!`)}
    ${sub(`Boa notícia, ${nome}! <strong style="color:#ffffff;">${nomeRemetente}</strong> deu o primeiro passo. Não deixe ele(a) esperando!`)}
    ${btn(`${APP_URL}/conversas`, 'Ver a mensagem')}
    ${note('Responder rápido aumenta muito a chance de uma conexão real.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `💬 ${nomeRemetente} te mandou uma mensagem!`,
    html: base(content, `${nomeRemetente} iniciou uma conversa com você.`),
  })
}

// 28. Mensagem não lida
export async function sendUnreadMessageEmail(email: string, nome: string, nomeRemetente: string, qtd: number) {
  const plural = qtd === 1 ? 'mensagem' : 'mensagens'
  const content = `
    ${badge('💬 Mensagem aguardando')}
    ${heading(`${nomeRemetente} enviou ${qtd > 1 ? `${qtd} ` : ''}${plural}`)}
    ${sub(`Olá, ${nome}. <strong style="color:#ffffff;">${nomeRemetente}</strong> está esperando sua resposta. Não deixe a conversa esfriar!`)}
    ${btn(`${APP_URL}/conversas`, 'Responder agora')}
    ${note('Para pausar notificações por email, acesse Configurações no app.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `💬 ${nomeRemetente} enviou uma mensagem`,
    html: base(content, `${nomeRemetente} está esperando sua resposta.`),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 3️⃣  ENGAJAMENTO — ATIVIDADE E REATIVAÇÃO
// ═════════════════════════════════════════════════════════════════════════

// 29. Novos perfis na sua região
export async function sendNewProfilesNearbyEmail(email: string, nome: string, qtd: number, cidade: string) {
  const content = `
    ${badge('🗺️ Novos perfis perto de você')}
    ${heading(`${qtd} novos perfis em ${cidade}`)}
    ${sub(`Olá, ${nome}! <strong style="color:#ffffff;">${qtd} novos usuários</strong> entraram no MeAndYou em ${cidade}. Pode ser alguém especial!`)}
    ${btn(`${APP_URL}/busca`, 'Explorar perfis')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🗺️ ${qtd} novos perfis em ${cidade} — MeAndYou`,
    html: base(content, `${qtd} novos usuários chegaram na sua região.`),
  })
}

// 30. Perfis compatíveis encontrados
export async function sendCompatibleProfilesEmail(email: string, nome: string, qtd: number) {
  const content = `
    ${badge('🎯 Alta compatibilidade')}
    ${heading(`Encontramos ${qtd} perfis compatíveis com você`)}
    ${sub(`Olá, ${nome}! Com base nos seus filtros e interesses, identificamos <strong style="color:#ffffff;">${qtd} pessoas</strong> com alta compatibilidade.`)}
    ${btn(`${APP_URL}/busca`, 'Ver perfis compatíveis')}
    ${note('Quanto mais completo seu perfil, mais precisa fica a compatibilidade.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🎯 ${qtd} perfis compatíveis encontrados para você`,
    html: base(content, `${qtd} perfis com alta compatibilidade esperando.`),
  })
}

// 31. Reativação — curtidas não vistas (5 dias inativo)
export async function sendReactivationLikesEmail(email: string, nome: string, qtd: number) {
  const content = `
    ${badge('👀 Você foi curtido(a)')}
    ${heading(`${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} você!`)}
    ${sub(`Olá, ${nome}. Enquanto você estava fora, <strong style="color:#ffffff;">${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} seu perfil</strong>. Volte para criar matches!`)}
    ${btn(`${APP_URL}/busca`, 'Ver quem me curtiu')}
    ${note('As curtidas ficam salvas — mas não espere demais!')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `👀 ${qtd} ${qtd === 1 ? 'pessoa curtiu' : 'pessoas curtiram'} você enquanto estava fora`,
    html: base(content, `${qtd} curtidas esperando. Volte para criar matches!`),
  })
}

// 32. Reativação — streak em risco (7 dias inativo)
export async function sendReactivationStreakEmail(email: string, nome: string) {
  const content = `
    ${badge('⚠️ Streak em risco', '#f59e0b')}
    ${heading('Seu streak vai resetar!')}
    ${sub(`Olá, ${nome}. Você está há 7 dias sem entrar. Se não entrar <strong style="color:#f59e0b;">hoje</strong>, sua sequência de prêmios reseta do zero.`)}
    ${btn(`${APP_URL}/streak`, 'Salvar meu streak agora')}
    ${note('O streak reseta à meia-noite. Basta fazer login para manter sua sequência.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '⚠️ Seu streak está prestes a resetar — MeAndYou',
    html: base(content, 'Faltam menos de 24h para seu streak resetar. Entre agora!'),
  })
}

// 33. Reativação — matches esperando (10 dias inativo)
export async function sendReactivationMatchesEmail(email: string, nome: string) {
  const content = `
    ${badge('💚 Seus matches estão esperando')}
    ${heading('Sentimos sua falta!')}
    ${sub(`Olá, ${nome}. Faz um tempo que você não aparece. Seus matches estão esperando uma mensagem sua.`)}
    ${btn(`${APP_URL}/conversas`, 'Ver minhas conversas')}
    ${note('Conexões reais precisam de atenção. Que tal mandar uma mensagem hoje?')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '💚 Seus matches estão esperando por você',
    html: base(content, 'Seus matches estão esperando sua mensagem.'),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 3️⃣  ENGAJAMENTO — GAMIFICAÇÃO
// ═════════════════════════════════════════════════════════════════════════

// 34. Ticket disponível para a roleta
export async function sendTicketAvailableEmail(email: string, nome: string, qtd: number) {
  const plural = qtd === 1 ? 'ticket disponível' : 'tickets disponíveis'
  const content = `
    ${badge('🎟️ Prêmio esperando', '#a855f7')}
    ${heading(`Você tem ${qtd} ${plural} na Roleta!`)}
    ${sub(`Olá, ${nome}! Você acumulou <strong style="color:#ffffff;">${qtd} ${plural}</strong> para girar a roleta. Não deixe passar!`)}
    ${infoBox('Prêmios possíveis:', [
      '🌟 SuperLikes extras',
      '🔍 Lupas para ver quem te curtiu',
      '⚡ Boosts de visibilidade',
      '↩️ Rewinds para desfazer curtidas',
    ], '#a855f7')}
    ${btn(`${APP_URL}/roleta`, 'Girar a roleta agora', '#a855f7')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🎟️ Você tem ${qtd} ${plural} para girar!`,
    html: base(content, `${qtd} ${plural} esperando na Roleta.`),
  })
}

// 35. Recompensa recebida
export async function sendRewardReceivedEmail(email: string, nome: string, premio: string, origem: string) {
  const content = `
    ${badge('🎁 Você ganhou!', '#a855f7')}
    ${heading(`Parabéns, ${nome}!`)}
    ${sub(`Você ganhou <strong style="color:#ffffff;">${premio}</strong> como recompensa por <strong style="color:#2ec4a0;">${origem}</strong>. Já disponível na sua conta!`)}
    ${btn(`${APP_URL}/loja`, 'Ver meu saldo')}
    ${note('Continue usando o app para acumular mais recompensas!')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🎁 Você ganhou ${premio} — MeAndYou`,
    html: base(content, `Você ganhou ${premio}. Já disponível na sua conta!`),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 4️⃣  MONETIZAÇÃO
// ═════════════════════════════════════════════════════════════════════════

// 36. Boost expirou
export async function sendBoostExpiredEmail(email: string, nome: string) {
  const content = `
    ${badge('⚡ Boost expirado', '#f59e0b')}
    ${heading('Seu Boost acabou')}
    ${sub(`Olá, ${nome}. Seu Boost de visibilidade expirou. Ative outro para continuar aparecendo para mais pessoas!`)}
    ${btn(`${APP_URL}/loja`, 'Ativar novo Boost')}
    ${note('Usuários Black recebem 1 Boost automático por dia. Confira o plano Black!')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '⚡ Seu Boost acabou — MeAndYou',
    html: base(content, 'Seu boost expirou. Ative outro para aparecer mais.'),
  })
}

// 37. Convite para upgrade
export async function sendUpgradePromptEmail(email: string, nome: string) {
  const content = `
    ${badge('🚀 Desbloqueie recursos exclusivos')}
    ${heading(`${nome}, você está perdendo muita coisa`)}
    ${sub('Usuários com plano Plus ou Black recebem muito mais matches. Veja o que você está deixando passar:')}
    ${infoBox('Com o plano Plus:', [
      '5 SuperCurtidas por dia',
      '2 Lupas para ver quem curtiu você',
      'Desfazer curtida (1/dia)',
      'Filtros avançados desbloqueados',
    ], '#3b82f6')}
    ${infoBox('Com o plano Black:', [
      '10 SuperCurtidas + Boost diário automático',
      'Lupas ilimitadas + 3 Tickets diários',
      'Acesso ao Backstage (Sugar e Fetiche)',
      'Suporte prioritário',
    ], '#a855f7')}
    ${btn(`${APP_URL}/planos`, 'Ver planos e preços')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: '🚀 Desbloqueie recursos exclusivos no MeAndYou',
    html: base(content, 'Veja o que você está perdendo sem um plano premium.'),
  })
}

// 38. Promoção de assinatura
export async function sendSubscriptionPromoEmail(
  email: string,
  nome: string,
  desconto: string,
  plano: string,
  dataExpiracao: string,
  linkCheckout: string,
) {
  const content = `
    ${badge(`🔥 ${desconto} de desconto — oferta limitada`, '#ef4444')}
    ${heading(`${nome}, oferta exclusiva para você!`)}
    ${sub(`O plano <strong style="color:#ffffff;">${plano}</strong> está com <strong style="color:#ef4444;">${desconto} de desconto</strong>. Oferta válida até <strong style="color:#ffffff;">${dataExpiracao}</strong>.`)}
    ${btn(linkCheckout, `Assinar ${plano} com ${desconto} off`, '#ef4444')}
    ${note('Esta oferta é pessoal e intransferível. Válida apenas para novas assinaturas.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🔥 ${desconto} off no plano ${plano} — só até ${dataExpiracao}`,
    html: base(content, `${desconto} off no plano ${plano}. Expira em ${dataExpiracao}.`),
  })
}

// ═════════════════════════════════════════════════════════════════════════
// 5️⃣  GENÉRICOS — MARKETING E INSTITUCIONAL
// ═════════════════════════════════════════════════════════════════════════

// 39. Marketing / campanha (parâmetros livres para envio em massa)
export async function sendMarketingEmail(
  email: string,
  nome: string,
  assunto: string,
  titulo: string,
  corpo: string,
  ctaLabel: string,
  ctaUrl: string,
  previewTexto?: string,
) {
  const content = `
    ${badge('📣 MeAndYou')}
    ${heading(titulo)}
    <div style="font-size:15px;color:#7ab5a0;line-height:1.7;margin-bottom:16px;">
      <p style="margin:0 0 12px;">Olá, ${nome}!</p>
      ${corpo}
    </div>
    ${btn(ctaUrl, ctaLabel)}
    ${divider()}
    ${note('Você recebe este email por ter uma conta no MeAndYou. Para cancelar emails promocionais, acesse Configurações no app.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: assunto,
    html: base(content, previewTexto ?? titulo),
  })
}

// 40. Institucional / comunicado obrigatório
export async function sendInstitutionalEmail(
  email: string,
  nome: string,
  assunto: string,
  titulo: string,
  corpo: string,
  ctaLabel?: string,
  ctaUrl?: string,
) {
  const content = `
    ${badge('📢 Comunicado MeAndYou')}
    ${heading(titulo)}
    <div style="font-size:15px;color:#7ab5a0;line-height:1.7;margin-bottom:16px;">
      <p style="margin:0 0 12px;">Olá, ${nome}!</p>
      ${corpo}
    </div>
    ${ctaLabel && ctaUrl ? btn(ctaUrl, ctaLabel) : ''}
    ${divider()}
    ${note('Este é um email institucional enviado a todos os usuários do MeAndYou. Não é possível cancelar o recebimento deste tipo de comunicado.')}
  `
  await resend.emails.send({
    from: FROM, to: email,
    subject: assunto,
    html: base(content, titulo),
  })
}

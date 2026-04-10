import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — MeAndYou',
  description: 'Termos de uso da plataforma MeAndYou',
}

export default function Termos() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', color: 'var(--text)' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text)',
          textDecoration: 'none',
        }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/modos" style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            ← Voltar ao app
          </Link>
          <Link href="/" style={{ fontSize: '14px', color: 'var(--muted)', textDecoration: 'none' }}>
            Início
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px 100px' }}>

        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '40px',
          fontWeight: 700,
          letterSpacing: '-1.5px',
          marginBottom: '8px',
        }}>
          Termos de Uso
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '48px' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        <Section titulo="1. Aceitação dos termos">
          Ao criar uma conta no MeAndYou, você declara que leu, entendeu e concorda integralmente com estes Termos de Uso.
          Caso não concorde com qualquer disposição, não utilize a plataforma.
          Estes termos constituem um acordo legal entre você ("Usuário") e MeAndYou ("Plataforma", "nós").
        </Section>

        <Section titulo="2. Elegibilidade">
          Para usar o MeAndYou, você deve: (a) ter no mínimo 18 anos de idade comprovados por documento oficial; (b) ser capaz civilmente; (c) não ter sido banido anteriormente da plataforma; (d) possuir CPF válido e ser residente no Brasil. A verificação de identidade é obrigatória para todos os usuários antes de interagir com a plataforma.
        </Section>

        <Section titulo="3. Cadastro e verificação de identidade">
          O cadastro exige: nome completo, e-mail, telefone e senha. Após o cadastro, você deve completar a verificação de identidade pelo celular em até 30 minutos via link enviado por e-mail. A verificação inclui selfie ao vivo (prova de vivacidade) e documento de identidade oficial (RG ou CNH). Permitimos apenas 1 (uma) conta por CPF. Contas duplicadas serão banidas permanentemente. O uso de emuladores, bots ou qualquer método automatizado para criar ou operar contas é proibido.
        </Section>

        <Section titulo="4. Planos e pagamentos">
          O MeAndYou não oferece plano gratuito. Os planos disponíveis são: Essencial (R$10/mês), Plus (R$39/mês) e Black (R$100/mês). Os pagamentos são processados por gateway de pagamentos terceirizado. O acesso a cada plano é válido por 30 dias a partir da data de pagamento. O cancelamento pode ser feito a qualquer momento e o acesso se encerra ao final do período vigente, sem reembolso proporcional. Preços podem ser alterados com aviso prévio de 30 dias. Compras avulsas de SuperLikes e Boosts não são reembolsáveis.
        </Section>

        <Section titulo="5. Conduta do usuário">
          É expressamente proibido: (a) criar perfis falsos ou se passar por outra pessoa; (b) publicar fotos de outras pessoas sem consentimento; (c) assediar, ameaçar ou intimidar outros usuários; (d) compartilhar conteúdo sexual explícito, violento ou ilegal; (e) usar a plataforma para fins comerciais, publicidade ou venda de conteúdo; (f) solicitar dinheiro, dados bancários ou informações pessoais de outros usuários; (g) tentar hackear, reverter ou comprometer a segurança da plataforma. Violações resultarão em banimento permanente por CPF e, nos casos graves, notificação às autoridades competentes.
        </Section>

        <Section titulo="6. Conteúdo e moderação">
          Todas as fotos enviadas passam por moderação automática que bloqueia nudez e conteúdo impróprio. Você concede ao MeAndYou licença não exclusiva para exibir seu conteúdo para outros usuários conforme as regras da plataforma. Nos reservamos o direito de remover qualquer conteúdo sem aviso prévio quando violar estes termos. Denúncias são analisadas em até 24 horas.
        </Section>

        <Section titulo="7. Privacidade e dados">
          O tratamento dos seus dados pessoais é regido pela nossa <Link href="/privacidade" style={{ color: 'var(--accent)' }}>Política de Privacidade</Link>, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Dados biométricos coletados na verificação são utilizados exclusivamente para confirmação de identidade e nunca compartilhados com terceiros.
        </Section>

        <Section titulo="8. Limitação de responsabilidade">
          O MeAndYou é uma plataforma de conexão. Não somos responsáveis pelo comportamento de usuários fora da plataforma, por encontros presenciais ou por quaisquer danos decorrentes de interações entre usuários. Recomendamos sempre marcar encontros em locais públicos e comunicar a alguém de confiança. A plataforma é fornecida "como está" e podemos alterar, suspender ou encerrar funcionalidades a qualquer momento.
        </Section>

        <Section titulo="9. Propriedade intelectual">
          Toda a identidade visual, código, marca MeAndYou, textos e funcionalidades são de propriedade exclusiva da plataforma e protegidos pela legislação de propriedade intelectual. É proibida a reprodução total ou parcial sem autorização expressa por escrito.
        </Section>

        <Section titulo="10. Exclusão de conta e dados">
          Você pode solicitar a exclusão da sua conta e todos os seus dados a qualquer momento, acessando Configurações → Excluir conta. Os dados são excluídos em até 30 dias, exceto aqueles que devemos reter por obrigação legal. Após a exclusão, seu CPF fica bloqueado por 90 dias para recadastro, a fim de evitar abusos.
        </Section>

        <Section titulo="11. Alterações nos termos">
          Podemos atualizar estes termos a qualquer momento. Você será notificado por e-mail e por aviso dentro do app com pelo menos 15 dias de antecedência. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.
        </Section>

        <Section titulo="12. Foro e lei aplicável">
          Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer disputas, renunciando as partes a qualquer outro, por mais privilegiado que seja.
        </Section>

        <Section titulo="13. Contato">
          Para dúvidas sobre estes termos, entre em contato pelo e-mail:{' '}
          <a href="mailto:adminmeandyou@proton.me" style={{ color: 'var(--accent)' }}>
            adminmeandyou@proton.me
          </a>
        </Section>

      </main>

      {/* Footer simples */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '13px',
      }}>
        © {new Date().getFullYear()} MeAndYou ·{' '}
        <Link href="/privacidade" style={{ color: 'var(--muted)' }}>Política de Privacidade</Link>
        {' '}·{' '}
        <Link href="/termos" style={{ color: 'var(--accent)' }}>Termos de Uso</Link>
      </footer>

    </div>
  )
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontFamily: 'var(--font-fraunces)',
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '12px',
        color: 'var(--text)',
      }}>
        {titulo}
      </h2>
      <p style={{
        fontSize: '15px',
        color: 'var(--muted)',
        lineHeight: 1.8,
      }}>
        {children}
      </p>
    </section>
  )
}

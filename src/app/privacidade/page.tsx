import Link from 'next/link'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade — MeAndYou',
  description: 'Política de privacidade e proteção de dados da plataforma MeAndYou',
}

export default function Privacidade() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg)',
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
          <Link href="/dashboard" style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
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
          Política de Privacidade
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '48px' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {/* Resumo destacado */}
        <div style={{
          backgroundColor: 'rgba(225,29,72,0.06)',
          border: '1px solid rgba(225,29,72,0.20)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '48px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} /> Resumo rapido
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
            Coletamos apenas os dados necessários para o funcionamento da plataforma. Não vendemos seus dados.
            Dados biométricos são usados exclusivamente para verificação e nunca compartilhados. Você pode excluir
            sua conta e todos os seus dados a qualquer momento.
          </p>
        </div>

        <Section titulo="1. Quem somos (Controlador dos dados)">
          O MeAndYou é o controlador dos seus dados pessoais. Para questões relacionadas à privacidade e proteção de dados,
          entre em contato com nosso Encarregado de Dados (DPO) pelo e-mail:{' '}
          <a href="mailto:adminmeandyou@proton.me" style={{ color: 'var(--accent)' }}>
            adminmeandyou@proton.me
          </a>
        </Section>

        <Section titulo="2. Dados que coletamos">
          <strong>Dados de cadastro:</strong> nome completo, e-mail, telefone, senha (armazenada com hash seguro).<br /><br />
          <strong>Dados de verificação de identidade:</strong> selfie ao vivo (prova de vivacidade), imagem do documento (RG ou CNH), CPF.
          Esses dados são processados exclusivamente para verificar sua identidade e descartados após confirmação. Armazenamos apenas o resultado (verificado/não verificado).<br /><br />
          <strong>Dados do perfil:</strong> nome de exibição, data de nascimento, bio, localização aproximada (cidade/estado), fotos de perfil, características físicas e preferências que você cadastrar voluntariamente.<br /><br />
          <strong>Dados de uso:</strong> curtidas, matches, mensagens, tempo de uso da plataforma, dispositivo e sistema operacional (para segurança e prevenção de fraudes).<br /><br />
          <strong>Dados de pagamento:</strong> processados diretamente pela Caktopay. Não armazenamos dados de cartão de crédito.
        </Section>

        <Section titulo="3. Como usamos seus dados">
          Seus dados são utilizados para: (a) fornecer e melhorar os serviços da plataforma; (b) verificar sua identidade e prevenir fraudes; (c) conectar você com outros usuários compatíveis; (d) enviar comunicações relacionadas à sua conta (por e-mail via Resend); (e) cumprir obrigações legais e regulatórias; (f) garantir a segurança da plataforma e dos usuários.
        </Section>

        <Section titulo="4. Base legal para tratamento (LGPD)">
          Tratamos seus dados com base em: (a) <strong>Execução de contrato</strong> — para fornecer os serviços contratados; (b) <strong>Consentimento</strong> — para funcionalidades opcionais, revogável a qualquer momento; (c) <strong>Legítimo interesse</strong> — para segurança, prevenção de fraudes e melhoria do serviço; (d) <strong>Cumprimento de obrigação legal</strong> — quando exigido por lei brasileira.
        </Section>

        <Section titulo="5. Dados biométricos">
          A selfie coletada na verificação é processada pela tecnologia face-api.js diretamente no seu dispositivo. A análise ocorre localmente e nenhuma imagem biométrica é transmitida para nossos servidores de forma permanente. Nos termos da LGPD (art. 11), o tratamento de dados sensíveis biométricos é realizado com consentimento explícito obtido no momento da verificação.
        </Section>

        <Section titulo="6. Compartilhamento de dados">
          Não vendemos seus dados. Podemos compartilhar com: (a) <strong>Provedores de serviço</strong>: Supabase (banco de dados), Vercel (hospedagem), Resend (e-mail), LiveKit (videochamada), Caktopay (pagamentos) — todos sob acordos de confidencialidade; (b) <strong>Autoridades</strong>: quando exigido por ordem judicial ou obrigação legal. Todos os prestadores de serviço são obrigados a tratar seus dados com o mesmo nível de proteção aplicado por nós.
        </Section>

        <Section titulo="7. Armazenamento e segurança">
          Seus dados são armazenados em servidores no Brasil e/ou nos EUA (Supabase/Vercel), com criptografia em trânsito (TLS) e em repouso. Senhas são armazenadas com hash bcrypt. Fotos de perfil utilizam URLs com expiração, nunca expostas permanentemente. Aplicamos Row Level Security (RLS) no banco de dados, garantindo que cada usuário acesse apenas seus próprios dados.
        </Section>

        <Section titulo="8. Seus direitos (LGPD — Art. 18)">
          Você tem direito a: (a) confirmar a existência de tratamento dos seus dados; (b) acessar seus dados; (c) corrigir dados incompletos ou desatualizados; (d) solicitar anonimização ou exclusão de dados desnecessários; (e) portabilidade dos dados; (f) revogar consentimento a qualquer momento; (g) excluir sua conta e todos os dados associados. Para exercer seus direitos, acesse Configurações no app ou envie e-mail para{' '}
          <a href="mailto:adminmeandyou@proton.me" style={{ color: 'var(--accent)' }}>adminmeandyou@proton.me</a>.
          Respondemos em até 15 dias úteis.
        </Section>

        <Section titulo="9. Retenção de dados">
          Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta: dados de perfil são removidos em até 30 dias; dados de log e segurança são retidos por até 6 meses; dados necessários por obrigação legal podem ser retidos pelo prazo legal aplicável.
        </Section>

        <Section titulo="10. Cookies e rastreamento">
          Utilizamos cookies exclusivamente para: autenticação da sessão (essenciais) e segurança. Não utilizamos cookies de publicidade ou rastreamento de terceiros. Anúncios não fazem parte do modelo de negócio do MeAndYou.
        </Section>

        <Section titulo="11. Menores de idade">
          O MeAndYou é destinado exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores. Caso identifiquemos uma conta de menor, ela será imediatamente encerrada e todos os dados excluídos.
        </Section>

        <Section titulo="12. Alterações nesta política">
          Podemos atualizar esta política periodicamente. Você será notificado por e-mail e por aviso no app com pelo menos 15 dias de antecedência para alterações relevantes. A versão mais recente estará sempre disponível em meandyou.com.br/privacidade.
        </Section>

        <Section titulo="13. Contato e DPO">
          Para exercer seus direitos, tirar dúvidas ou fazer reclamações sobre o tratamento dos seus dados, entre em contato com nosso Encarregado de Proteção de Dados (DPO):{' '}
          <a href="mailto:adminmeandyou@proton.me" style={{ color: 'var(--accent)' }}>
            adminmeandyou@proton.me
          </a>.
          Também é possível apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) em{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            www.gov.br/anpd
          </a>.
        </Section>

        {/* Acao de exclusao de dados */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            Excluir minha conta e dados
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '16px' }}>
            Voce pode solicitar a exclusao permanente da sua conta e de todos os seus dados pessoais a qualquer momento, em conformidade com a LGPD. Apos a exclusao, voce receberá um comprovante por email.
          </p>
          <Link
            href="/deletar-conta"
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              padding: '10px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            Solicitar exclusao de dados
          </Link>
        </div>

      </main>

      {/* Footer simples */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '13px',
      }}>
        © {new Date().getFullYear()} MeAndYou ·{' '}
        <Link href="/privacidade" style={{ color: 'var(--accent)' }}>Política de Privacidade</Link>
        {' '}·{' '}
        <Link href="/termos" style={{ color: 'var(--muted)' }}>Termos de Uso</Link>
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
      <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.8 }}>
        {children}
      </p>
    </section>
  )
}

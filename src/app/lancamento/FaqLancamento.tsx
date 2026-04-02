'use client'

import { useState } from 'react'

const faqLancamento = [
  { q: 'Os 2 meses grátis são realmente grátis? Sem pegadinha?', a: 'Sim. Você entra, usa o Plano Essencial completo por 2 meses sem pagar nada. Após o período, o plano custa R$9,97/mês. Você pode cancelar antes do fim do período gratuito e não paga nada. Sem fidelidade, sem multa, sem truque.' },
  { q: 'O que acontece depois dos 2 meses?', a: 'Você recebe um aviso antes do período encerrar. Se quiser continuar, o Plano Essencial é cobrado a R$9,97/mês. Se não quiser, cancela com dois cliques, direto no app, sem precisar falar com ninguém. Simples assim.' },
  { q: 'Por que a plataforma é paga se tem o período gratuito?', a: 'Porque o modelo pago atrai quem sabe o que quer. Aplicativos abertos viram bagunça — perfis falsos, pessoas inativas, perda de tempo. O lançamento gratuito é temporário, específico para este momento, e em troca do seu feedback real enquanto a plataforma ainda está sendo ajustada. Depois do lançamento, só planos pagos.' },
  { q: 'O Emblema de Fundador é realmente vitalício?', a: 'Sim. Ele é gravado permanentemente no seu perfil. Quando o lançamento encerrar, ninguém mais recebe esse emblema. Raridade Lendária — a mais alta do sistema. Você carrega para sempre como prova de que esteve aqui desde o início.' },
  { q: 'O que inclui o Plano Essencial durante o lançamento?', a: '20 curtidas por dia, 1 SuperCurtida por dia, 1 ticket de roleta diário, videochamada nativa, verificação de identidade e acesso a todos os modos básicos do app. O mesmo Plano Essencial que será cobrado após o período.' },
  { q: 'Por que não existe um plano gratuito permanente?', a: 'Porque o gratuito permanente atrai quem não sabe o que quer. Um valor acessível (a partir de R$9,97) cria um filtro imediato. Quem investe para estar aqui, por menor que seja o valor, tem outro nível de intenção. Você percebe a diferença já na primeira mensagem.' },
  { q: 'Como funciona a verificação de identidade?', a: 'Selfie ao vivo com sequência de movimentos detectada em tempo real (impossível usar foto ou vídeo), documento de identidade (RG ou CNH) e validação de CPF. Só 1 conta por CPF, sem duplicatas. Se alguém for banido, o bloqueio é feito no CPF — não adianta criar outro e-mail.' },
  { q: 'O app funciona para todas as orientações e gêneros?', a: 'Completamente. Nosso sistema de filtros foi desenhado para abraçar todas as orientações sexuais, identidades de gênero e formatos de relacionamento. É você quem dita quem entra e quem sai da sua tela.' },
  { q: 'Posso cancelar a assinatura quando eu quiser?', a: 'Com dois cliques, direto no aplicativo. Sem burocracia, sem precisar mandar e-mail ou falar com atendente. Você cancela na hora e continua usando normalmente até o final do período já pago. Zero fidelidade, zero multa, zero dor de cabeça.' },
]

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 0' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', fontWeight: 600, fontSize: '15px', color: '#F8F9FA',
          fontFamily: "var(--font-jakarta), sans-serif", textAlign: 'left', padding: 0,
        }}
      >
        {pergunta}
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: aberto ? '#E11D48' : 'rgba(225,29,72,0.12)',
          border: '1px solid rgba(225,29,72,0.3)',
          color: aberto ? '#fff' : '#E11D48',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0, fontWeight: 700,
          transform: aberto ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.3s, background 0.2s, color 0.2s',
        }}>+</span>
      </button>
      {aberto && (
        <p style={{
          fontSize: '14px', color: 'rgba(248,249,250,0.55)',
          lineHeight: 1.75, marginTop: '14px', paddingRight: '44px',
        }}>{resposta}</p>
      )}
    </div>
  )
}

export default function FaqLancamento() {
  return (
    <section className="lp-faq">
      <div className="lp-faq-inner">
        <p className="lp-section-label">FAQ</p>
        <h2 className="lp-section-title">Dúvidas sobre o lançamento</h2>
        <div className="lp-faq-list">
          {faqLancamento.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'

const faqLancamento = [
  { q: 'Os 2 meses gratis sao realmente gratis? Sem pegadinha?', a: 'Sim. Voce entra, usa o Plano Essencial completo por 2 meses sem pagar nada. Apos o periodo, o plano custa R$9,97/mes. Voce pode cancelar antes do fim do periodo gratuito e nao paga nada. Sem fidelidade, sem multa, sem truque.' },
  { q: 'O que acontece depois dos 2 meses?', a: 'Voce recebe um aviso antes do periodo encerrar. Se quiser continuar, o Plano Essencial e cobrado a R$9,97/mes. Se nao quiser, cancela com dois cliques, direto no app, sem precisar falar com ninguem. Simples assim.' },
  { q: 'Por que a plataforma e paga se tem o periodo gratuito?', a: 'Porque o modelo pago atrai quem sabe o que quer. Aplicativos abertos viram bagunça — perfis falsos, pessoas inativas, perda de tempo. O lancamento gratuito e temporario, especifico para este momento, e em troca do seu feedback real enquanto a plataforma ainda esta sendo ajustada. Depois do lancamento, so planos pagos.' },
  { q: 'O Emblema de Fundador e realmente vitalicio?', a: 'Sim. Ele e gravado permanentemente no seu perfil. Quando o lancamento encerrar, ninguem mais recebe esse emblema. Raridade Lendaria — a mais alta do sistema. Voce carrega para sempre como prova de que esteve aqui desde o inicio.' },
  { q: 'O que inclui o Plano Essencial durante o lancamento?', a: '20 curtidas por dia, 1 SuperCurtida por dia, 1 ticket de roleta diario, videochamada nativa, verificacao de identidade e acesso a todos os modos basicos do app. O mesmo Plano Essencial que sera cobrado apos o periodo.' },
  { q: 'Por que nao existe um plano gratuito permanente?', a: 'Porque o gratuito permanente atrai quem nao sabe o que quer. Um valor acessivel (a partir de R$9,97) cria um filtro imediato. Quem investe para estar aqui, por menor que seja o valor, tem outro nivel de intencao. Voce percebe a diferenca ja na primeira mensagem.' },
  { q: 'Como funciona a verificacao de identidade?', a: 'Selfie ao vivo com sequencia de movimentos detectada em tempo real (impossivel usar foto ou video), documento de identidade (RG ou CNH) e validacao de CPF. So 1 conta por CPF, sem duplicatas. Se alguem for banido, o bloqueio e feito no CPF — nao adianta criar outro e-mail.' },
  { q: 'O app funciona para todas as orientacoes e generos?', a: 'Completamente. Nosso sistema de filtros foi desenhado para abracar todas as orientacoes sexuais, identidades de genero e formatos de relacionamento. E voce quem dita quem entra e quem sai da sua tela.' },
  { q: 'Posso cancelar a assinatura quando eu quiser?', a: 'Com dois cliques, direto no aplicativo. Sem burocracia, sem precisar mandar e-mail ou falar com atendente. Voce cancela na hora e continua usando normalmente ate o final do periodo ja pago. Zero fidelidade, zero multa, zero dor de cabeca.' },
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
        <h2 className="lp-section-title">Duvidas sobre o lancamento</h2>
        <div className="lp-faq-list">
          {faqLancamento.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
        </div>
      </div>
    </section>
  )
}

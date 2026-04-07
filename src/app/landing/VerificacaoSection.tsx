'use client'

export default function VerificacaoSection() {
  return (
    <section className="lp-verification" id="verificacao">
      <div className="lp-verification-inner">
        <div>
          <p className="lp-section-label">Verificação rigorosa</p>
          <h2 className="lp-section-title">Só entra<br />quem é <span style={{ color: 'var(--accent)' }}>real.</span></h2>
          <p style={{ color: 'var(--muted)', fontSize: '16px', marginTop: '14px', lineHeight: 1.7 }}>
            Desenvolvemos o processo de verificação mais rigoroso do mercado.
          </p>
        </div>
        <div className="lp-verify-steps">
          {[
            { n: '1', t: 'Selfie ao vivo', d: 'Sequência de movimentos detectada em tempo real. Impossível usar foto ou vídeo.' },
            { n: '2', t: 'Documento de identidade', d: 'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.' },
            { n: '3', t: 'Validação de CPF', d: 'Checagem automática. Apenas 1 conta por CPF, sem duplicatas.' },
            { n: '4', t: 'Monitoramento contínuo', d: 'Algoritmo anti-fraude ativo. Denúncias respondidas em até 24h.' },
          ].map(item => (
            <div key={item.n} className="lp-verify-step lp-anim">
              <div className="lp-vstep-num">{item.n}</div>
              <div><h4>{item.t}</h4><p>{item.d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

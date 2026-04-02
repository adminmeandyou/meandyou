'use client'

export default function PilaresLancamento() {
  return (
    <section className="lp-pilares-section">
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <h2>Aqui tudo funciona <em style={{color:'var(--accent)',fontStyle:'italic'}}>diferente.</em></h2>
          <p>E voce vai descobrir isso nos proximos 2 meses, sem pagar nada.</p>
        </div>
        <div className="lp-pilares-grid">
          {[
            { num: '01', titulo: 'Voce controla tudo', texto: 'Voce decide quem aparece, quem fica e quem sai. Nada acontece por acaso. Do primeiro dia do seu periodo gratuito.' },
            { num: '02', titulo: 'Do seu jeito', texto: 'Nem todo mundo quer se conectar da mesma forma. Aqui voce escolhe como. Relacoes, encontros, amizades ou apenas conversa.' },
            { num: '03', titulo: 'Antes, durante e depois', texto: 'Voce tem controle antes de conversar, durante a interacao e ate depois de um encontro. Seguranca em cada etapa.' },
            { num: '04', titulo: 'Seu tempo vale algo', texto: 'Cada acesso, cada interacao gera beneficios dentro do app. Voce comeca a acumular desde o primeiro dia — mesmo no periodo gratuito.' },
          ].map((card, i) => (
            <div key={i} className="lp-pilar-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="lp-pilar-num">{card.num}</div>
              <h3 className="lp-pilar-title">{card.titulo}</h3>
              <p className="lp-pilar-text">{card.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

export default function PilaresLancamento() {
  return (
    <section className="lp-pilares-section">
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <h2>Aqui tudo funciona diferente.</h2>
          <p>E você vai descobrir isso nos próximos 2 meses, sem pagar nada.</p>
        </div>
        <div className="lp-pilares-grid">
          {[
            { num: '01', titulo: 'Você controla tudo', texto: 'Você decide quem aparece, quem fica e quem sai. Nada acontece por acaso. Do primeiro dia do seu período gratuito.' },
            { num: '02', titulo: 'Do seu jeito', texto: 'Nem todo mundo quer se conectar da mesma forma. Aqui você escolhe como. Relações, encontros, amizades ou apenas conversa.' },
            { num: '03', titulo: 'Antes, durante e depois', texto: 'Você tem controle antes de conversar, durante a interação e até depois de um encontro. Segurança em cada etapa.' },
            { num: '04', titulo: 'Seu tempo vale algo', texto: 'Cada acesso, cada interação gera benefícios dentro do app. Você começa a acumular desde o primeiro dia — mesmo no período gratuito.' },
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

'use client'

export default function PilaresSection() {
  return (
    <section className="lp-pilares-section">
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <h2>Aqui tudo funciona <em style={{color:'var(--accent)',fontStyle:'italic'}}>diferente.</em></h2>
          <p>Você não entra para tentar. Você entra para escolher.</p>
        </div>
        <div className="lp-pilares-grid">
          {[
            { num: '01', titulo: 'Você controla tudo', texto: 'Você decide quem aparece, quem fica e quem sai. Nada acontece por acaso.' },
            { num: '02', titulo: 'Do seu jeito', texto: 'Nem todo mundo quer se conectar da mesma forma. Aqui você escolhe como.' },
            { num: '03', titulo: 'Antes, durante e depois', texto: 'Você tem controle antes de conversar, durante a interação e até depois de um encontro.' },
            { num: '04', titulo: 'Seu tempo vale algo', texto: 'Seu uso se transforma em benefícios, vantagens e destaque dentro do app.' },
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

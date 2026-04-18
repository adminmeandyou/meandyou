'use client'

export default function LupasSection() {
  return (
    <section className="lp-pilares-section">
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <p className="lp-section-label">Ferramentas que só quem assina tem</p>
          <h2>Veja antes. Erre menos.</h2>
          <p>Recursos pensados para quem não quer depender só da sorte.</p>
        </div>
        <div className="lp-pilares-grid">
          {[
            {
              num: '01',
              titulo: 'Lupa no Destaque',
              texto: 'Toca na Lupa e você vê quem realmente está no seu tipo dentro do Destaque, sem perder tempo com quem não tem a ver. Plus: 1 por dia. Black: 2 por dia.',
            },
            {
              num: '02',
              titulo: 'Desfazer curtida',
              texto: 'Passou um perfil sem querer ou se arrependeu? Plus e Black desfazem 1 curtida por dia e trazem o perfil de volta. Sem drama.',
            },
            {
              num: '03',
              titulo: 'Ver quem curtiu você',
              texto: 'No Plus e no Black, você vê a lista completa de quem já demonstrou interesse e pode dar match direto, sem precisar cruzar pela busca.',
            },
            {
              num: '04',
              titulo: 'Boost de visibilidade',
              texto: 'Sobe seu perfil no topo da fila por 30 minutos. Plus: 1 ativo por vez. Black: 2 simultâneos. Ganhe mais Boosts na roleta ou na loja.',
            },
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

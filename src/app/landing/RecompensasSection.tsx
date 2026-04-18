'use client'

export default function RecompensasSection() {
  return (
    <section className="lp-pilares-section">
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <p className="lp-section-label">Você usa, você ganha</p>
          <h2>Recompensas de verdade,<br />todos os dias.</h2>
          <p>Roleta, streak e indicações pagam em recursos que você usa no app.</p>
        </div>
        <div className="lp-pilares-grid">
          {[
            {
              num: '01',
              titulo: 'Roleta diária',
              texto: 'Prêmios reais: 3 SuperCurtidas, 1 Boost, 5 Lupas, 2 Desfazer, 3 tickets extras, 1 dia de Modo Invisível, upgrade temporário para plano superior. Essencial: 1 giro/dia. Plus: 2 giros. Black: 3 giros.',
            },
            {
              num: '02',
              titulo: 'Streak de acesso',
              texto: 'Calendário mensal. A cada dia seguido no app, o prêmio cresce. Dia 7: 3 SuperCurtidas. Dia 14: 1 Boost. Dia 30: 1 dia de plano superior grátis. Perdeu um dia? Começa de novo.',
            },
            {
              num: '03',
              titulo: 'Indique amigos',
              texto: 'Cada amigo que entrar pelo seu link e se cadastrar te dá 1 SuperCurtida. Indicou 3? Ganha 1 Boost. Seu amigo recebe 3 tickets de boas-vindas pra girar a roleta.',
            },
            {
              num: '04',
              titulo: 'Presentes de amigos',
              texto: 'Tem conexão de amizade no app? Amigos podem te mandar SuperCurtidas, Boosts e Lupas de presente. Um gesto discreto que aparece com o nome de quem mandou.',
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

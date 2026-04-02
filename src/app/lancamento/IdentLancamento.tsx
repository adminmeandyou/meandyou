'use client'

export default function IdentLancamento() {
  return (
    <section className="lp-ident-section">
      <div className="lp-ident-inner">
        <h2 className="lp-ident-title lp-anim">Em algum momento,<br />voce ja sentiu isso.</h2>
        <div className="lp-ident-bullets">
          {[
            'Ter que se adaptar so para conseguir atencao',
            'Conversar sem saber o que a outra pessoa realmente quer',
            'Investir tempo e energia em algo que nao vai para frente',
            'Sentir que esta sempre no lugar errado',
          ].map((texto, i) => (
            <div key={i} className="lp-ident-bullet lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="lp-ident-bullet-dot" />
              <span className="lp-ident-bullet-text">{texto}</span>
            </div>
          ))}
        </div>
        <p className="lp-ident-closing lp-anim">
          O problema nunca foi voce.<br /><em>Era o ambiente. E agora voce tem a chance de testar o ambiente certo — antes de todo mundo.</em>
        </p>
      </div>
    </section>
  )
}

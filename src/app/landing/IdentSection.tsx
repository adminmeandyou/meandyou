'use client'

export default function IdentSection() {
  return (
    <section className="lp-ident-section">
      <div className="lp-ident-inner">
        <h2 className="lp-ident-title lp-anim">Em algum momento,<br />você já sentiu isso.</h2>
        <div className="lp-ident-bullets">
          {[
            'Ter que se adaptar só para conseguir atenção',
            'Conversar sem saber o que a outra pessoa realmente quer',
            'Investir tempo e energia em algo que não vai para frente',
            'Sentir que está sempre no lugar errado',
          ].map((texto, i) => (
            <div key={i} className="lp-ident-bullet lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="lp-ident-bullet-dot" />
              <span className="lp-ident-bullet-text">{texto}</span>
            </div>
          ))}
        </div>
        <p className="lp-ident-closing lp-anim">
          O problema nunca foi você.<br /><em>Era o ambiente.</em>
        </p>
      </div>
    </section>
  )
}

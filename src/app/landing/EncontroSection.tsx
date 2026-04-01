'use client'

export default function EncontroSection() {
  return (
    <section className="lp-enc-v2">
      <div className="lp-enc-v2-inner">
        <div className="lp-enc-v2-header lp-anim">
          <p className="lp-section-label">Do match ao encontro</p>
          <h2 className="lp-enc-v2-title">Quando fizer sentido,<br />você avança.</h2>
          <p className="lp-enc-v2-text">Do primeiro contato ao encontro, tudo acontece dentro de um ambiente controlado.</p>
          <p className="lp-enc-v2-comp">Sem exposição desnecessária. Sem pressão.</p>
        </div>
        <div className="lp-enc-v2-steps">
          {[
            { num: '01', titulo: 'Match', texto: 'Vocês dois querem conversar. O app confirma antes de abrir o canal.' },
            { num: '02', titulo: 'Conversa', texto: 'O contato começa no app, no seu ritmo, sem pressão para avançar.' },
            { num: '03', titulo: 'Videochamada', texto: 'Quando sentir que faz sentido, você vê quem é a pessoa. Ainda dentro do app.' },
            { num: '04', titulo: 'Encontro', texto: 'Só quando você quiser. Com registro privado, check-in automático e botão de emergência.' },
          ].map((step, i, arr) => (
            <div key={i} className="lp-enc-v2-step lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="lp-enc-v2-step-left">
                <div className="lp-enc-v2-step-dot">{step.num}</div>
                {i < arr.length - 1 && <div className="lp-enc-v2-step-line" />}
              </div>
              <div className="lp-enc-v2-step-body">
                <div className="lp-enc-v2-step-title">{step.titulo}</div>
                <p className="lp-enc-v2-step-text">{step.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

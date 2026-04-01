'use client'

export default function ProvaSocialSection() {
  return (
    <section className="lp-social-v2">
      <div className="lp-social-v2-inner">
        <div className="lp-social-v2-header lp-anim">
          <p className="lp-section-label">O que as pessoas dizem</p>
          <h2 className="lp-social-v2-title">Quem entrou,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>não quer sair.</em></h2>
        </div>
        <div className="lp-social-v2-msgs">
          {[
            { right: false, avatarCls: 'a', name: 'Mariana, 34', txt: 'Finalmente um app em que eu não preciso ficar adivinhando o que a pessoa quer. Todo mundo já entra sabendo.' },
            { right: true, avatarCls: 'b', name: 'Rafael, 41', txt: 'Os filtros são o que fazem a diferença. Zero perda de tempo com perfis que não fazem sentido.' },
            { right: false, avatarCls: 'c', name: 'Camila, 29', txt: 'A videochamada antes de encontrar alguém foi um divisor de águas pra mim. Cheguei no café sem nenhuma surpresa.' },
            { right: true, avatarCls: 'd', name: 'Thiago, 43', txt: 'Matching por intenção real muda tudo. Sem joguinho, sem ambiguidade. Direto ao ponto.' },
            { right: false, avatarCls: 'e', name: 'Ana, 37', txt: 'Nunca me senti tão no controle de quem entra na minha vida. Recomendo para todo mundo.' },
          ].map((m, i) => (
            <div key={i} className={`lp-social-v2-msg${m.right ? ' lp-social-v2-msg--right' : ''} lp-anim`} style={{ animationDelay: `${i * 150}ms` }}>
              <div className={`lp-social-v2-avatar lp-social-v2-avatar--${m.avatarCls || 'a'}`} />
              <div>
                <div className={`lp-social-v2-bubble lp-social-v2-bubble--${m.right ? 'right' : 'left'}`}>{m.txt}</div>
                <div className={`lp-social-v2-meta${m.right ? '' : ' lp-social-v2-meta--left'}`}>{m.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

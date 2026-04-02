'use client'

export default function ProvaSocialLancamento() {
  return (
    <section className="lp-social-v2">
      <div className="lp-social-v2-inner">
        <div className="lp-social-v2-header lp-anim">
          <p className="lp-section-label">Quem já entrou</p>
          <h2 className="lp-social-v2-title">Quem chegou cedo,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>não quer sair.</em></h2>
        </div>
        <div className="lp-social-v2-msgs">
          {[
            { right: false, avatarCls: 'a', name: 'Mariana, 34', txt: 'Entrei no lançamento sem expectativa. Já na primeira semana entendi por que é diferente. Nem precisa explicar — você sente quando entra.' },
            { right: true, avatarCls: 'b', name: 'Rafael, 41', txt: 'Dois meses grátis era só o gancho. Mas os filtros são bons demais. Já assinei antes de terminar o período gratuito.' },
            { right: false, avatarCls: 'c', name: 'Camila, 29', txt: 'O emblema de Fundador aparece no perfil e as pessoas perguntam. Me sinto parte de algo que está crescendo. Ainda bem que entrei cedo.' },
            { right: true, avatarCls: 'd', name: 'Thiago, 43', txt: 'Plataforma paga sem plano grátis é exatamente o filtro que faltava. Todo mundo aqui sabe o que quer.' },
            { right: false, avatarCls: 'e', name: 'Ana, 37', txt: 'Nunca me senti tão no controle de quem entra na minha vida. E o melhor: entrei de graça, com emblema lendário e tudo.' },
          ].map((m, i) => (
            <div key={i} className={`lp-social-v2-msg${m.right ? ' lp-social-v2-msg--right' : ''} lp-anim`} style={{ animationDelay: `${i * 150}ms` }}>
              {!m.right && <div className={`lp-social-v2-avatar lp-social-v2-avatar--${m.avatarCls || 'a'}`} />}
              <div style={{ maxWidth: 'calc(100% - 50px)' }}>
                <div className={`lp-social-v2-bubble lp-social-v2-bubble--${m.right ? 'right' : 'left'}`}>{m.txt}</div>
                <div className={`lp-social-v2-meta${m.right ? '' : ' lp-social-v2-meta--left'}`}>{m.name}</div>
              </div>
              {m.right && <div className={`lp-social-v2-avatar lp-social-v2-avatar--${m.avatarCls || 'a'}`} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

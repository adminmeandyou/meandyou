'use client'

export default function PlanosSection() {
  const plans = [
    {
      badge: 'Essencial', badgeCls: 'free', ctaCls: 'free',
      nome: 'Grátis', desc: 'Para explorar e sentir como funciona.',
      feats: [
        { ok: true, txt: '10 curtidas por dia' },
        { ok: true, txt: 'Acesso ao Descobrir' },
        { ok: true, txt: 'Videochamada nativa' },
        { ok: false, txt: 'Filtros avançados' },
        { ok: false, txt: 'Ver quem curtiu você' },
      ],
    },
    {
      badge: 'Mais escolhido', badgeCls: 'featured', ctaCls: 'featured', featured: true,
      nome: 'Plus', desc: 'Para quem quer controle total da experiência.',
      feats: [
        { ok: true, txt: 'Curtidas ilimitadas' },
        { ok: true, txt: 'Filtros avançados completos' },
        { ok: true, txt: 'Ver quem curtiu você' },
        { ok: true, txt: 'Roleta diária e SuperCurtidas' },
        { ok: true, txt: 'Modo invisível' },
      ],
    },
    {
      badge: 'Black', badgeCls: 'black', ctaCls: 'black',
      nome: 'Black', desc: 'Para quem quer o máximo — sem restrições.',
      feats: [
        { ok: true, txt: 'Tudo do Plus' },
        { ok: true, txt: 'Acesso ao Backstage' },
        { ok: true, txt: 'Destaque no topo do feed' },
        { ok: true, txt: 'Lupa e Rewind ilimitados' },
        { ok: true, txt: 'Boosts mensais inclusos' },
      ],
    },
  ]

  return (
    <section className="lp-plans-v2">
      <div className="lp-plans-v2-inner">
        <div className="lp-plans-v2-header lp-anim">
          <p className="lp-section-label">Planos</p>
          <h2 className="lp-plans-v2-title">Escolha o nível de controle<br />que você quer ter.</h2>
          <p className="lp-plans-v2-sub">Cada plano libera uma forma diferente de viver o app.</p>
        </div>
        <div className="lp-plans-v2-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`lp-plans-v2-card lp-anim${plan.featured ? ' lp-plans-v2-card--featured' : plan.badgeCls === 'black' ? ' lp-plans-v2-card--black' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <span className={`lp-plans-v2-badge lp-plans-v2-badge--${plan.badgeCls}`}>{plan.badge}</span>
              <div className="lp-plans-v2-name">{plan.nome}</div>
              <p className="lp-plans-v2-desc">{plan.desc}</p>
              <ul className="lp-plans-v2-feats">
                {plan.feats.map((f, j) => (
                  <li key={j}>
                    <span className={f.ok ? (plan.featured ? 'acc' : 'ok') : ''} style={!f.ok ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(248,249,250,0.18)' } : {}}>
                      {f.ok ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </span>
                    {f.txt}
                  </li>
                ))}
              </ul>
              <div className={`lp-plans-v2-cta lp-plans-v2-cta--${plan.ctaCls}`}>
                {plan.badgeCls === 'free' ? 'Começar grátis' : 'Assinar agora'}
              </div>
            </div>
          ))}
        </div>
        <p className="lp-plans-v2-highlight lp-anim">Mais usado por quem quer ter controle total da experiência</p>
        <p className="lp-plans-v2-micro lp-anim">Você pode cancelar a qualquer momento</p>
      </div>
    </section>
  )
}

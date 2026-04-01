'use client'

export default function PlanosSection() {
  const plans = [
    {
      badge: 'Essencial', badgeCls: 'free', ctaCls: 'free',
      nome: 'Essencial',
      area: 'Pista',
      preco: '9,97',
      desc: 'O plano de entrada. Para começar a explorar com pessoas verificadas e intenções reais.',
      feats: [
        { ok: true,  txt: '20 curtidas por dia' },
        { ok: true,  txt: '1 SuperCurtida por dia' },
        { ok: true,  txt: '1 ticket de roleta por dia' },
        { ok: true,  txt: 'Videochamada nativa' },
        { ok: true,  txt: 'Verificação de identidade' },
        { ok: false, txt: 'Filtros avançados' },
        { ok: false, txt: 'Ver quem curtiu você' },
        { ok: false, txt: 'Desfazer curtida' },
      ],
    },
    {
      badge: 'Mais escolhido', badgeCls: 'featured', ctaCls: 'featured', featured: true,
      nome: 'Plus',
      area: 'Área VIP',
      preco: '39,97',
      desc: 'A experiência completa de filtragem. Para quem quer controle total da conexão.',
      feats: [
        { ok: true,  txt: '50 curtidas por dia' },
        { ok: true,  txt: '5 SuperCurtidas por dia' },
        { ok: true,  txt: '2 tickets de roleta por dia' },
        { ok: true,  txt: '1 Lupa por dia no Destaque' },
        { ok: true,  txt: 'Todos os filtros avançados' },
        { ok: true,  txt: 'Filtro de exclusão' },
        { ok: true,  txt: 'Ver quem curtiu você' },
        { ok: true,  txt: 'Desfazer curtida' },
        { ok: false, txt: 'Acesso ao Backstage' },
      ],
    },
    {
      badge: 'Black', badgeCls: 'black', ctaCls: 'black',
      nome: 'Black',
      area: 'Backstage',
      preco: '99,97',
      desc: 'Você acessa tudo — sem restrições. Com área exclusiva Backstage e o máximo do algoritmo.',
      feats: [
        { ok: true, gold: true,  txt: 'Curtidas ilimitadas' },
        { ok: true, gold: true,  txt: '10 SuperCurtidas por dia' },
        { ok: true, gold: true,  txt: '3 tickets de roleta por dia' },
        { ok: true, gold: true,  txt: '2 Lupas por dia no Destaque' },
        { ok: true, gold: false, txt: 'Tudo do Plus' },
        { ok: true, gold: true,  txt: 'Acesso ao Backstage' },
        { ok: true, gold: true,  txt: 'Modo Casal (exclusivo Black)' },
        { ok: true, gold: true,  txt: '2 Boosts simultâneos' },
        { ok: true, gold: true,  txt: 'Destaque máximo no feed' },
        { ok: true, gold: true,  txt: 'Suporte prioritário 24h' },
      ],
    },
  ]

  return (
    <section className="lp-plans-v2">
      <div className="lp-plans-v2-inner">
        <div className="lp-plans-v2-header lp-anim">
          <p className="lp-section-label">Planos</p>
          <h2 className="lp-plans-v2-title">Escolha o nível de controle que você quer ter.</h2>
          <p className="lp-plans-v2-sub">Cada plano libera uma forma diferente de viver o app.</p>
        </div>
        <div className="lp-plans-v2-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`lp-plans-v2-card lp-anim${plan.featured ? ' lp-plans-v2-card--featured' : plan.badgeCls === 'black' ? ' lp-plans-v2-card--black' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <span className={`lp-plans-v2-badge lp-plans-v2-badge--${plan.badgeCls}`}>{plan.badge}</span>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
                <div className="lp-plans-v2-name">{plan.nome}</div>
                <span style={{ fontSize:11, fontWeight:500, color: plan.badgeCls === 'black' ? 'rgba(245,158,11,0.55)' : 'rgba(248,249,250,0.30)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{plan.area}</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color: plan.badgeCls === 'black' ? '#F59E0B' : plan.featured ? 'var(--accent)' : 'rgba(248,249,250,0.45)' }}>R$</span>
                <span style={{ fontSize:36, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color: plan.badgeCls === 'black' ? '#F59E0B' : plan.featured ? 'var(--accent)' : 'var(--text)', fontFamily:'var(--font-fraunces),serif' }}>{plan.preco}</span>
                <span style={{ fontSize:12, color:'rgba(248,249,250,0.35)', fontWeight:400 }}>/mês</span>
              </div>
              <p className="lp-plans-v2-desc">{plan.desc}</p>
              <ul className="lp-plans-v2-feats">
                {plan.feats.map((f, j) => (
                  <li key={j} style={!f.ok ? { color:'rgba(248,249,250,0.25)' } : f.gold ? { color:'rgba(248,249,250,0.85)' } : {}}>
                    <span
                      className={f.ok ? (plan.featured ? 'acc' : 'ok') : ''}
                      style={
                        !f.ok
                          ? { background:'rgba(255,255,255,0.04)', color:'rgba(248,249,250,0.18)' }
                          : f.gold
                          ? { background:'rgba(245,158,11,0.12)', color:'#F59E0B' }
                          : {}
                      }
                    >
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
              <a href="/planos" className={`lp-plans-v2-cta lp-plans-v2-cta--${plan.ctaCls}`} style={{ textDecoration:'none' }}>
                {plan.badgeCls === 'free' ? 'Assinar o Essencial' : plan.badgeCls === 'black' ? 'Assinar o Black' : 'Assinar o Plus'}
              </a>
            </div>
          ))}
        </div>
        <p className="lp-plans-v2-highlight lp-anim">Mais usado por quem quer ter controle total da experiência</p>
        <p className="lp-plans-v2-micro lp-anim">Você pode cancelar a qualquer momento</p>
      </div>
    </section>
  )
}

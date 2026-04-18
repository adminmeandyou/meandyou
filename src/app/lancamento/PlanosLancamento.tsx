'use client'

import { formatBRL, pick, type SiteConfigPublic, type LandingContentMap } from '../landing/types'

type Feat = { ok: boolean; gold?: boolean; txt: string }

interface PlanosProps {
  config: SiteConfigPublic
  content: LandingContentMap
}

function applyDiscount(valor: number, pct: number): number {
  if (!pct || pct <= 0) return valor
  return Math.round(valor * (1 - pct / 100) * 100) / 100
}

export default function PlanosLancamento({ config, content }: PlanosProps) {
  const pct = config.lancamento_desconto_pct || 0
  const plusOriginal = formatBRL(config.preco_plus)
  const blackOriginal = formatBRL(config.preco_black)
  const plusDesconto = formatBRL(applyDiscount(config.preco_plus, pct))
  const blackDesconto = formatBRL(applyDiscount(config.preco_black, pct))
  const essencialPreco = formatBRL(config.preco_essencial)

  const tituloLinha1 = pick(content, 'planos', 'titulo_linha1', 'Comece grátis.')
  const tituloLinha2 = pick(content, 'planos', 'titulo_linha2', 'Faça upgrade quando quiser.')
  const subtitulo = pick(
    content,
    'planos',
    'subtitulo',
    'O Essencial é seu por 2 meses, sem pagar nada. Depois, você escolhe o que faz mais sentido.',
  )

  const plans: Array<{
    badge: string; badgeCls: string; ctaCls: string; featured?: boolean; lancamento?: boolean
    nome: string; area: string; preco: string; precoRiscado?: string; desc: string; feats: Feat[]; ctaText: string; nota?: string
  }> = [
    {
      badge: '2 meses GRÁTIS', badgeCls: 'free', ctaCls: 'free', lancamento: true,
      nome: 'Essencial',
      area: 'Pista',
      preco: 'Grátis',
      precoRiscado: essencialPreco,
      desc: 'O plano de entrada. Use tudo por 2 meses sem pagar nada. Depois decide se quer continuar.',
      ctaText: 'Começar grátis agora',
      nota: `Após o período: R$${essencialPreco}/mês · Cancele quando quiser`,
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
      badge: pct > 0 ? `${pct}% OFF no lançamento` : 'Mais escolhido', badgeCls: 'featured', ctaCls: 'featured', featured: true,
      nome: 'Plus',
      area: 'Área VIP',
      preco: plusDesconto,
      precoRiscado: pct > 0 ? plusOriginal : undefined,
      desc: 'A experiência completa de filtragem. Para quem quer controle total desde o início.',
      ctaText: 'Assinar o Plus',
      feats: [
        { ok: true,  txt: '50 curtidas por dia' },
        { ok: true,  txt: '5 SuperCurtidas por dia' },
        { ok: true,  txt: '2 tickets de roleta por dia' },
        { ok: true,  txt: '1 Lupa por dia no Destaque' },
        { ok: true,  txt: 'Todos os filtros avançados' },
        { ok: true,  txt: 'Filtro de exclusão' },
        { ok: true,  txt: 'Ver quem curtiu você' },
        { ok: true,  txt: 'Desfazer curtida (1x por dia)' },
        { ok: false, txt: 'Acesso ao Backstage' },
      ],
    },
    {
      badge: pct > 0 ? `${pct}% OFF no lançamento` : 'Black', badgeCls: 'black', ctaCls: 'black',
      nome: 'Black',
      area: 'Backstage',
      preco: blackDesconto,
      precoRiscado: pct > 0 ? blackOriginal : undefined,
      desc: 'Você acessa tudo, sem restrições. Com área exclusiva Backstage e o máximo do algoritmo.',
      ctaText: 'Assinar o Black',
      feats: [
        { ok: true, gold: true,  txt: 'Curtidas ilimitadas' },
        { ok: true, gold: true,  txt: '10 SuperCurtidas por dia' },
        { ok: true, gold: true,  txt: '3 tickets de roleta por dia' },
        { ok: true, gold: true,  txt: '2 Lupas por dia no Destaque' },
        { ok: true, gold: true,  txt: 'Tudo do Plus' },
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
          <h2 className="lp-plans-v2-title">{tituloLinha1}<br />{tituloLinha2}</h2>
          <p className="lp-plans-v2-sub">{subtitulo}</p>
        </div>
        <div className="lp-plans-v2-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`lp-plans-v2-card lp-anim${plan.featured ? ' lp-plans-v2-card--featured' : plan.badgeCls === 'black' ? ' lp-plans-v2-card--black' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <span className={`lp-plans-v2-badge lp-plans-v2-badge--${plan.badgeCls}`} style={plan.lancamento ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981' } : {}}>{plan.badge}</span>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
                <div className="lp-plans-v2-name">{plan.nome}</div>
                <span style={{ fontSize:11, fontWeight:500, color: plan.badgeCls === 'black' ? 'rgba(245,158,11,0.55)' : 'rgba(248,249,250,0.30)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{plan.area}</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                {plan.precoRiscado && (
                  <span style={{ fontSize:14, color:'rgba(248,249,250,0.25)', textDecoration:'line-through', fontWeight:500 }}>R${plan.precoRiscado}</span>
                )}
                <span style={{ fontSize: plan.lancamento ? 28 : 36, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color: plan.lancamento ? '#10b981' : plan.badgeCls === 'black' ? '#F59E0B' : plan.featured ? 'var(--accent)' : 'var(--text)', fontFamily:'var(--font-fraunces),serif' }}>{plan.lancamento ? plan.preco : `R$${plan.preco}`}</span>
                {!plan.lancamento && <span style={{ fontSize:12, color:'rgba(248,249,250,0.35)', fontWeight:400 }}>/mês</span>}
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
                          : plan.lancamento
                          ? { background:'rgba(16,185,129,0.12)', color:'#10b981' }
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
              <a
                href="/cadastro"
                className={`lp-plans-v2-cta lp-plans-v2-cta--${plan.ctaCls}`}
                style={plan.lancamento ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', textDecoration:'none' } : { textDecoration:'none' }}
              >
                {plan.ctaText}
              </a>
              {plan.nota && (
                <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(248,249,250,0.35)', textAlign: 'center', lineHeight: 1.5 }}>{plan.nota}</p>
              )}
            </div>
          ))}
        </div>
        <p className="lp-plans-v2-highlight lp-anim">Comece grátis no Essencial. Faça upgrade a qualquer momento.</p>
        <p className="lp-plans-v2-micro lp-anim">Você pode cancelar a qualquer momento, sem burocracia</p>
      </div>
    </section>
  )
}

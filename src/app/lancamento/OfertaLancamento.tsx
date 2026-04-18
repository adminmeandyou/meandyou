'use client'

import { formatBRL, pick, type SiteConfigPublic, type LandingContentMap } from '../landing/types'

interface OfertaProps {
  config: SiteConfigPublic
  content: LandingContentMap
}

export default function OfertaLancamento({ config, content }: OfertaProps) {
  const preco = formatBRL(config.preco_essencial)

  const label = pick(content, 'oferta', 'label', 'Por dentro do lançamento')
  const titulo1 = pick(content, 'oferta', 'titulo_linha1', 'Não é um app gratuito.')
  const titulo2 = pick(content, 'oferta', 'titulo_linha2', 'É uma oportunidade.')
  const paragrafo1 = pick(
    content,
    'oferta',
    'paragrafo1',
    'O MeAndYou é uma plataforma paga. E vai continuar sendo. Quem paga, leva a experiência a sério. E isso muda o nível de todo mundo dentro do app.',
  )
  const paragrafo2 = pick(
    content,
    'oferta',
    'paragrafo2',
    `Mas antes de abrir para o mundo, precisamos de pessoas reais testando, explorando, e nos dizendo o que ainda pode melhorar. Então fizemos uma troca justa: você usa tudo por 2 meses. Nós coletamos feedback real. Depois, se quiser continuar, é R$${preco}/mês. Se não quiser, cancela. Sem pressão, sem truque.`,
  )
  const card1Titulo = pick(content, 'oferta', 'card1_titulo', '2 meses grátis')
  const card1Desc = pick(
    content,
    'oferta',
    'card1_desc',
    'Plano Essencial completo, sem pagar nada. Você acessa, testa, usa de verdade.',
  )
  const card2Titulo = pick(content, 'oferta', 'card2_titulo', 'Emblema de Fundador')
  const card2Desc = pick(
    content,
    'oferta',
    'card2_desc',
    'Lendário. Vitalício. Nunca mais será concedido. Você carrega no perfil para sempre.',
  )
  const card3Titulo = pick(content, 'oferta', 'card3_titulo', `Depois: só R$${preco}/mês`)
  const card3Desc = pick(
    content,
    'oferta',
    'card3_desc',
    'Plano Essencial após o período. Cancele a qualquer momento, sem burocracia.',
  )
  const ctaTexto = pick(content, 'oferta', 'cta', 'Quero participar do lançamento')
  const ctaMicro = pick(
    content,
    'oferta',
    'cta_micro',
    `2 meses grátis · Plano Essencial · Depois R$${preco}/mês · Cancele quando quiser`,
  )

  return (
    <section className="lp-section-v2 lp-section-v2--dark">
      <div className="lp-section-inner-v2">
        <div className="lp-anim" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p className="lp-section-label" style={{ marginBottom: 16 }}>{label}</p>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 20, color: 'var(--text)' }}>
            {titulo1}<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{titulo2}</em>
          </h2>
          <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: 'rgba(248,249,250,0.60)', lineHeight: 1.8, marginBottom: 12 }}>
            {paragrafo1}
          </p>
          <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: 'rgba(248,249,250,0.60)', lineHeight: 1.8, marginBottom: 40 }}>
            {paragrafo2}
          </p>
        </div>

        <div className="lp-anim" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          maxWidth: 760,
          margin: '0 auto',
        }}>
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>,
              iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.25)',
              titulo: card1Titulo,
              desc: card1Desc,
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
              iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)', iconBorder: 'rgba(245,158,11,0.25)',
              titulo: card2Titulo,
              desc: card2Desc,
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              iconColor: 'var(--accent)', iconBg: 'rgba(225,29,72,0.12)', iconBorder: 'rgba(225,29,72,0.25)',
              titulo: card3Titulo,
              desc: card3Desc,
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(19,22,31,0.95)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: item.iconBg, border: `1px solid ${item.iconBorder}`,
                color: item.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{item.titulo}</div>
                <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.50)', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-anim" style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/cadastro" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 12,
            background: 'linear-gradient(135deg, #E11D48, #be123c)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(225,29,72,0.30)',
          }}>
            {ctaTexto}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </a>
          <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(248,249,250,0.35)' }}>
            {ctaMicro}
          </p>
        </div>
      </div>
    </section>
  )
}

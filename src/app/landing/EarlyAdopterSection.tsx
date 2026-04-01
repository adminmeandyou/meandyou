'use client'

import { IcMedal, IcArrow } from './icons'

export default function EarlyAdopterSection() {
  return (
    <section className="lp-section-v2 lp-section-v2--dark">
      <div className="lp-section-inner-v2">
        <div className="lp-early-wrap lp-anim">
          <div className="lp-early-badge-v2" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcMedal size={36} /></div>
          <h2 className="lp-early-title-v2">Você está chegando no<br /><span>momento certo.</span></h2>
          <p className="lp-early-text-v2">O MeAndYou acabou de chegar. Todo usuário que entrar agora durante o lançamento recebe um <strong style={{ color: 'var(--gold)' }}>Emblema de Fundador exclusivo e vitalício</strong>. Ele nunca mais será concedido. Você carrega no perfil para sempre como prova de que esteve aqui desde o começo.</p>
          <a href="/planos" className="lp-btn-gold-v2" style={{ marginTop: 8 }}>
            Quero meu emblema de fundador <IcArrow />
          </a>
        </div>
      </div>
    </section>
  )
}

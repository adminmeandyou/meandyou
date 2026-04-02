'use client'

import { IcArrow } from '../landing/icons'

export default function EarlyLancamento() {
  return (
    <section className="lp-section-v2 lp-section-v2--dark">
      <div className="lp-section-inner-v2">
        <div className="lp-early-wrap lp-anim">

          {/* Emblema visual */}
          <div style={{
            width: 80, height: 80, margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 30%, rgba(245,158,11,0.25), rgba(245,158,11,0.05))',
            border: '2px solid rgba(245,158,11,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(245,158,11,0.20)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>

          {/* Pill de raridade */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 100,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lendário · Vitalício · Só no lançamento</span>
          </div>

          <h2 className="lp-early-title-v2">
            Este emblema nunca mais<br /><span style={{ color: '#F59E0B' }}>será oferecido.</span>
          </h2>

          <p className="lp-early-text-v2" style={{ maxWidth: 560, margin: '0 auto 16px' }}>
            O MeAndYou está lançando agora. Todo usuário que entrar durante o lançamento recebe automaticamente o <strong style={{ color: '#F59E0B' }}>Emblema de Fundador — raridade Lendária</strong>.
          </p>
          <p className="lp-early-text-v2" style={{ maxWidth: 560, margin: '0 auto 16px' }}>
            Ele aparece no seu perfil para todos verem. Quando o lançamento encerrar, ninguém mais recebe. Quem já tem, carrega para sempre. É uma prova permanente de que você esteve aqui desde o começo.
          </p>
          <p className="lp-early-text-v2" style={{ maxWidth: 560, margin: '0 auto 32px', color: 'rgba(248,249,250,0.40)', fontSize: 14 }}>
            No futuro, quando o app estiver cheio, as pessoas vão ver esse emblema no seu perfil e vão saber: essa pessoa é uma Fundadora.
          </p>

          <a href="/cadastro" className="lp-btn-gold-v2" style={{ marginTop: 8 }}>
            Quero meu emblema de Fundador <IcArrow />
          </a>

          <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(248,249,250,0.30)' }}>
            Junto com 2 meses grátis do Plano Essencial
          </p>
        </div>
      </div>
    </section>
  )
}

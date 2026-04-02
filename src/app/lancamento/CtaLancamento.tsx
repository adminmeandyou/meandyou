'use client'

export default function CtaLancamento() {
  return (
    <section className="lp-cta-final">
      <div className="lp-cta-final-inner">
        <div className="lp-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 100,
          background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
          marginBottom: 20,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.06em' }}>LANCAMENTO · VAGAS LIMITADAS</span>
        </div>

        <h2 className="lp-cta-final-title lp-anim">Seus 2 meses<br />comecam agora.</h2>
        <p className="lp-cta-final-sub lp-anim">
          Entre, explore tudo, e veja o que muda quando as conexoes sao intencionais. Seu emblema de Fundador ja esta esperando por voce.
        </p>
        <a href="/cadastro" className="lp-cta-final-btn lp-anim">Comecar meu periodo gratis</a>
        <p className="lp-cta-final-micro lp-anim">
          Plano Essencial · 2 meses gratis · Depois R$9,97/mes · Cancele quando quiser
        </p>
        <p className="lp-cta-final-micro lp-anim" style={{ marginTop: 6, color: 'rgba(245,158,11,0.55)', fontSize: 13 }}>
          + Emblema de Fundador Lendario, gratis, vitalicio
        </p>
      </div>
    </section>
  )
}

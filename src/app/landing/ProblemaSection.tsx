'use client'

export default function ProblemaSection() {
  return (
    <section style={{ padding: '100px 56px', background: 'var(--bg-card-grad)', borderTop: '1px solid var(--border-premium)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

        <div className="lp-anim">
          <p className="lp-section-label">Por que acontece</p>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(30px, 3.8vw, 50px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.08, marginBottom: 32 }}>
            O ambiente errado transforma a pessoa certa em ruído.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
            {[
              'Ter que se adaptar só para conseguir atenção',
              'Conversar sem saber o que a outra pessoa realmente quer',
              'Investir tempo e energia em algo que não vai para frente',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(244,63,94,0.12)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
                <span style={{ fontSize: 16, color: 'rgba(248,249,250,0.62)', lineHeight: 1.65 }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-fraunces), serif', fontStyle: 'italic', lineHeight: 1.4 }}>
            O problema nunca foi você.<br />Era o ambiente.
          </p>
        </div>

        <div className="lp-anim" style={{ transitionDelay: '0.1s' }}>
          <p className="lp-section-label">A diferença aqui</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { num: '01', titulo: 'Você controla o radar', texto: 'Decide quem aparece, quem fica e quem sai. Nada acontece por acaso.' },
              { num: '02', titulo: 'Intenções claras desde o início', texto: 'Cada pessoa já entra sabendo o que quer. Zero adivinhação.' },
              { num: '03', titulo: 'Antes, durante e depois', texto: 'Controle em todas as etapas: do primeiro contato ao encontro.' },
              { num: '04', titulo: 'Seu uso vira benefícios', texto: 'Cada acesso e interação acumula vantagens e destaque no app.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '22px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 12, fontWeight: 700, color: 'var(--accent)', opacity: 0.6, minWidth: 28, paddingTop: 3, letterSpacing: '0.05em' }}>{item.num}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>{item.titulo}</div>
                  <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.52)', lineHeight: 1.65, margin: 0 }}>{item.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

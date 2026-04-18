'use client'

export default function ModoInvisivelSection() {
  return (
    <section className="lp-gamif-v2">
      <div className="lp-gamif-v2-inner">
        <div className="lp-gamif-v2-header lp-anim">
          <p className="lp-section-label">Itens avulsos da loja</p>
          <h2 className="lp-gamif-v2-title">Privacidade e alcance<br />quando você quiser.</h2>
          <p className="lp-gamif-v2-sub">Compra única, direto na loja do app.</p>
          <p className="lp-gamif-v2-text">Sem assinatura extra. Você ativa só quando precisar.</p>
        </div>
        <div className="lp-gamif-v2-grid">
          {[
            {
              anim: 'glow',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
              titulo: 'Modo Invisível',
              texto: 'Navegue sem aparecer para os outros. Você continua curtindo normalmente, mas ninguém sabe que você está online.',
              tag: 'Compra avulsa',
            },
            {
              anim: 'float',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
              titulo: 'Explorar outra cidade',
              texto: 'Vai viajar? Curte à distância? Desbloqueia perfis da cidade que você escolher por um período definido.',
              tag: 'Sem sair do lugar',
            },
            {
              anim: 'pulse',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
              titulo: 'Pacote de SuperCurtidas',
              texto: 'Acabou a sua cota do dia? Compre avulso pela loja e envie aquela SuperCurtida importante na hora certa.',
              tag: 'Sem esperar amanhã',
            },
            {
              anim: 'spin',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
              titulo: 'Pacote de Desfazer',
              texto: 'Errou a curtida e seu plano já usou o desfazer do dia? Pegue um pacote na loja e traga o perfil de volta.',
              tag: 'Errou? Resolve',
            },
          ].map((item, i) => (
            <div key={i} className="lp-gamif-v2-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`lp-gamif-v2-icon ${item.anim}`} style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.25)' }}>{item.icon}</div>
              <div>
                <div className="lp-gamif-v2-card-title">{item.titulo}</div>
                <p className="lp-gamif-v2-card-text">{item.texto}</p>
                <span className="lp-gamif-v2-card-tag">{item.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

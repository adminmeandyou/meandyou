'use client'

export default function AmigosSection() {
  return (
    <section className="lp-gamif-v2">
      <div className="lp-gamif-v2-inner">
        <div className="lp-gamif-v2-header lp-anim">
          <p className="lp-section-label">Amizade também é conexão</p>
          <h2 className="lp-gamif-v2-title">Nem tudo precisa<br />virar romance.</h2>
          <p className="lp-gamif-v2-sub">Às vezes a química é pra conversa mesmo.</p>
          <p className="lp-gamif-v2-text">Se depois de um tempo rolar só amizade, você pode transformar o match em amigo e continuar trocando dentro do app, com limites claros.</p>
        </div>
        <div className="lp-gamif-v2-grid">
          {[
            {
              anim: 'float',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
              titulo: 'Chat de amigos por 30 dias',
              texto: 'Conversa segue ativa por 30 dias. Se não trocar mensagem nesse tempo, a amizade expira e libera espaço.',
              tag: 'Sem pressão',
            },
            {
              anim: 'spin',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>,
              titulo: 'Enviar um presente',
              texto: 'Mande uma SuperCurtida, Boost ou Lupa para um amigo como mimo. Chega como notificação com seu nome.',
              tag: 'Gesto simpático',
            },
            {
              anim: 'pulse',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
              titulo: 'Chamar atenção',
              texto: 'Um toque rápido pra lembrar que você existe. O amigo recebe uma vibração e uma notificação discreta.',
              tag: 'Sem textão',
            },
            {
              anim: 'glow',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
              titulo: 'Avaliar como foi',
              texto: 'Dê estrelas de forma privada. Sua nota influencia o algoritmo e ajuda a proteger quem se comporta bem.',
              tag: 'Anônimo',
            },
          ].map((item, i) => (
            <div key={i} className="lp-gamif-v2-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`lp-gamif-v2-icon ${item.anim}`} style={{ color: '#E11D48', background: 'rgba(225,29,72,0.10)', borderColor: 'rgba(225,29,72,0.25)' }}>{item.icon}</div>
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

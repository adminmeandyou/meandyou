'use client'

export default function GamificacaoSection() {
  return (
    <section className="lp-gamif-v2">
      <div className="lp-gamif-v2-inner">
        <div className="lp-gamif-v2-header lp-anim">
          <p className="lp-section-label">Muito mais do que curtidas</p>
          <h2 className="lp-gamif-v2-title">Seu tempo aqui<br /><em style={{color:'#10b981',fontStyle:'italic'}}>vale algo</em>.</h2>
          <p className="lp-gamif-v2-sub">Enquanto voce usa, voce evolui dentro do app.</p>
          <p className="lp-gamif-v2-text">A cada acesso, interacao ou conexao, voce acumula beneficios, desbloqueia recursos e ganha destaque.</p>
        </div>
        <div className="lp-gamif-v2-grid">
          {[
            {
              anim: 'spin',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
              titulo: 'Roleta diaria',
              texto: 'Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e ate 1 dia de plano superior. Cada plano da mais tickets por dia.',
              tag: 'Todo dia',
            },
            {
              anim: 'float',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
              titulo: 'Streak de acesso',
              texto: 'Entre todos os dias e desbloqueie recompensas crescentes no calendario mensal. Sequencia de 30 dias tem premios raros.',
              tag: 'Acesso diario',
            },
            {
              anim: 'pulse',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
              titulo: 'Indique e ganhe',
              texto: 'Cada amigo que entrar pelo seu link te rende 1 SuperCurtida. Indicou 3? Ganhe 1 Boost. Quem entrou ganha 3 tickets de boas-vindas.',
              tag: 'Por indicacao',
            },
            {
              anim: 'glow',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
              titulo: 'Emblemas colecionaveis',
              texto: 'Conquistas que aparecem no seu perfil. Raridades Comum, Incomum, Raro e Lendario. Quanto mais voce usa e interage, mais emblemas raros voce desbloqueia.',
              tag: 'Aparecem no perfil',
            },
          ].map((item, i) => (
            <div key={i} className="lp-gamif-v2-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`lp-gamif-v2-icon ${item.anim}`} style={{color:'#10b981',background:'rgba(16,185,129,0.10)',borderColor:'rgba(16,185,129,0.25)'}}>{item.icon}</div>
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

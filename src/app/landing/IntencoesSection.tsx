'use client'

export default function IntencoesSection() {
  return (
    <section className="lp-intencoes-v2">
      <div className="lp-intencoes-v2-inner">
        <div className="lp-intencoes-v2-header lp-anim">
          <p className="lp-section-label">Intenções</p>
          <h2 className="lp-intencoes-v2-title">Sem dúvida.<br />Sem joguinho.</h2>
          <p className="lp-intencoes-v2-text">
            Cada pessoa já entra com clareza do que quer.<br />
            Você não precisa adivinhar nem perder tempo tentando entender.
          </p>
          <p className="lp-intencoes-v2-compl">Ou faz sentido, ou não aparece.</p>
        </div>
        <div className="lp-intencoes-grid-v2">
          {[
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
              iconBg: 'rgba(225,29,72,0.12)', iconBorder: 'rgba(225,29,72,0.28)', iconColor: 'var(--accent)',
              titulo: 'Relacionamento sério',
              desc: 'Busca comprometimento e construir algo de verdade com alguém.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
              iconBg: 'rgba(59,130,246,0.12)', iconBorder: 'rgba(59,130,246,0.28)', iconColor: 'rgb(96,165,250)',
              titulo: 'Encontros casuais',
              desc: 'Sem compromisso, com respeito e clareza desde o primeiro contato.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
              iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.28)', iconColor: '#10b981',
              titulo: 'Amizade',
              desc: 'Expandir o círculo social com pessoas reais e verificadas.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
              iconBg: 'rgba(139,92,246,0.12)', iconBorder: 'rgba(139,92,246,0.28)', iconColor: 'rgb(167,139,250)',
              titulo: 'Companhia para evento',
              desc: 'Casamento, jantar, festa ou qualquer compromisso social.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
              iconBg: 'rgba(236,72,153,0.12)', iconBorder: 'rgba(236,72,153,0.28)', iconColor: 'rgb(244,114,182)',
              titulo: 'Romance',
              desc: 'Conexão emocional profunda, construída com cuidado e intenção.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
              iconBg: 'rgba(245,158,11,0.10)', iconBorder: 'rgba(245,158,11,0.25)', iconColor: '#F59E0B',
              titulo: 'Sugar',
              desc: 'Relações com benefícios mútuos definidos desde o início, sem surpresas.',
            },
          ].map((item, i) => (
            <div key={i} className="lp-intencao-card-v2 lp-anim" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="lp-intencao-icon-v2" style={{ background: item.iconBg, border: `1px solid ${item.iconBorder}`, color: item.iconColor }}>{item.icon}</div>
              <div>
                <div className="lp-intencao-title-v2">{item.titulo}</div>
                <p className="lp-intencao-desc-v2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

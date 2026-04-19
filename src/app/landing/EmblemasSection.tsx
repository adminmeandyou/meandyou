'use client'

type Emblema = {
  nome: string
  desc: string
  raridade: 'comum' | 'incomum' | 'raro' | 'lendario'
  icon: React.ReactNode
}

const COLOR: Record<Emblema['raridade'], { c: string; bg: string; bd: string; label: string }> = {
  comum:    { c: 'rgba(248,249,250,0.45)', bg: 'rgba(255,255,255,0.04)', bd: 'rgba(255,255,255,0.08)', label: 'Comum' },
  incomum:  { c: 'rgba(248,249,250,0.70)', bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.12)', label: 'Incomum' },
  raro:     { c: 'var(--text)',             bg: 'rgba(255,255,255,0.08)', bd: 'rgba(255,255,255,0.18)', label: 'Raro' },
  lendario: { c: 'var(--accent)',           bg: 'var(--accent-soft)',     bd: 'var(--accent-border)',   label: 'Lendário' },
}

export default function EmblemasSection() {
  const emblemas: Emblema[] = [
    {
      nome: 'Identidade Verificada',
      desc: 'Selfie ao vivo + documento validado. Aparece no topo do perfil.',
      raridade: 'raro',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>,
    },
    {
      nome: 'Fundador',
      desc: 'Emblema vitalício para quem assinou no lançamento do app.',
      raridade: 'lendario',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    },
    {
      nome: 'Conversador',
      desc: 'Manteve conversa fluida por mais de 5 mensagens em vários matches.',
      raridade: 'incomum',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    },
    {
      nome: 'Match Maker',
      desc: 'Conseguiu 10 matches respondidos. Mostra que sua energia funciona.',
      raridade: 'lendario',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    },
    {
      nome: 'Perfil Completo',
      desc: '9 fotos aprovadas, bio, tags e filtros configurados.',
      raridade: 'raro',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    },
    {
      nome: 'Bio Detalhada',
      desc: 'Escreveu uma bio com mais de 100 caracteres contando sobre si.',
      raridade: 'incomum',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
    {
      nome: 'Streak de 30 dias',
      desc: 'Abriu o app todo dia por um mês inteiro. Disciplina.',
      raridade: 'raro',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2c1 5 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 3-6 1 2 2 3 2 6" /></svg>,
    },
    {
      nome: 'Indicou 3 Amigos',
      desc: 'Três amigos entraram pelo seu link e completaram o cadastro.',
      raridade: 'comum',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
  ]

  return (
    <section className="lp-pilares-section" style={{ background: 'var(--bg-card2)' }}>
      <div className="lp-pilares-inner">
        <div className="lp-pilares-header lp-anim">
          <p className="lp-section-label">Colecione conquistas</p>
          <h2>Emblemas que aparecem<br />no seu perfil.</h2>
          <p>São visíveis para quem visita você. Raridade importa.</p>
        </div>
        <div className="lp-pilares-grid">
          {emblemas.map((em, i) => {
            const c = COLOR[em.raridade]
            return (
              <div key={i} className="lp-pilar-card lp-anim" style={{ animationDelay: `${i * 70}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c.c, background: c.bg, border: `1px solid ${c.bd}`,
                  }}>{em.icon}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: c.c,
                    background: c.bg, border: `1px solid ${c.bd}`,
                    padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{c.label}</span>
                </div>
                <h3 className="lp-pilar-title">{em.nome}</h3>
                <p className="lp-pilar-text">{em.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

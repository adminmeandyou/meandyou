'use client'

import { useState } from 'react'

const TABS = ['Ferramentas', 'Recompensas', 'Loja']

const ferramentas = [
  { titulo: 'Lupa no Destaque', sub: 'Plus: 1/dia · Black: 2/dia', texto: 'Veja quem está no seu tipo dentro do Destaque sem perder tempo com quem não combina.' },
  { titulo: 'Desfazer curtida', sub: '1x por dia · Plus e Black', texto: 'Passou um perfil sem querer? Desfaz a curtida e traz o perfil de volta. Sem drama.' },
  { titulo: 'Ver quem curtiu você', sub: 'Plus e Black', texto: 'Lista completa de quem demonstrou interesse. Match direto, sem precisar cruzar pela busca.' },
  { titulo: 'Boost de visibilidade', sub: 'Plus: 1 ativo · Black: 2 simultâneos', texto: 'Sobe seu perfil no topo da fila por 30 minutos. Ganhe mais Boosts na roleta ou na loja.' },
]

const recompensas = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    titulo: 'Roleta diária', sub: 'Essencial: 1 · Plus: 2 · Black: 3 giros',
    texto: 'SuperCurtidas, Lupas, Boosts, Desfazer ou até 1 dia de plano superior. Prêmios reais todo dia.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    titulo: 'Streak de acesso', sub: 'Calendário mensal de prêmios',
    texto: 'Dia 7: 3 SuperCurtidas. Dia 14: 1 Boost. Dia 30: 1 dia de plano superior grátis.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    titulo: 'Indicação', sub: '3 amigos = 1 Boost',
    texto: 'Cada amigo que entrar pelo seu link te dá 1 SuperCurtida. Indicou 3? Ganha 1 Boost.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    titulo: 'Emblemas colecionáveis', sub: 'Comum · Incomum · Raro · Lendário',
    texto: 'Conquistas que aparecem no perfil. Quanto mais você usa e interage, mais emblemas raros você desbloqueia.',
  },
]

const loja = [
  { titulo: 'Modo Invisível', sub: 'Compra avulsa', texto: 'Navegue sem aparecer para os outros. Curte normalmente, mas ninguém sabe que você está online.' },
  { titulo: 'Explorar outra cidade', sub: 'Sem sair do lugar', texto: 'Vai viajar? Desbloqueia perfis da cidade que escolher por um período definido.' },
  { titulo: 'Pacote de SuperCurtidas', sub: 'Sem esperar amanhã', texto: 'Acabou a cota do dia? Compre avulso pela loja e envie aquela SuperCurtida importante.' },
  { titulo: 'Pacote de Desfazer', sub: 'Errou? Resolve', texto: 'Plano já usou o desfazer do dia? Pegue um pacote na loja e traga o perfil de volta.' },
]

const tabContent = [ferramentas, recompensas, loja]
const tabColors = [
  { c: '#E11D48', bg: 'rgba(225,29,72,0.10)', border: 'rgba(225,29,72,0.22)' },
  { c: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)' },
  { c: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' },
]

export default function RecursosSection() {
  const [tab, setTab] = useState(0)
  const items = tabContent[tab]
  const col = tabColors[tab]

  return (
    <section style={{ padding: '100px 56px', background: 'var(--bg-card-grad)', borderTop: '1px solid var(--border-premium)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div className="lp-anim" style={{ marginBottom: 48 }}>
          <p className="lp-section-label">Recursos e vantagens</p>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12 }}>
            Quanto mais você usa,<br />mais o app trabalha por você.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>Ferramentas exclusivas, recompensas diárias e itens avulsos da loja.</p>
        </div>

        {/* Tabs */}
        <div className="lp-anim" style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: tab === i ? tabColors[i].bg : 'transparent',
                borderColor: tab === i ? tabColors[i].border : 'var(--border-premium)',
                color: tab === i ? tabColors[i].c : 'rgba(248,249,250,0.45)',
                fontFamily: 'var(--font-jakarta), sans-serif',
                transition: 'all 0.2s',
              }}
            >{t}</button>
          ))}
        </div>

        {/* Grid de items */}
        <div key={tab} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {items.map((item: { titulo: string; sub: string; texto: string; icon?: React.ReactNode }, i: number) => (
            <div key={i} className="lp-anim" style={{
              animationDelay: `${i * 80}ms`,
              background: 'var(--bg)', border: `1px solid var(--border-premium)`, borderRadius: 18, padding: '24px 24px',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = col.border)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-premium)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {item.icon && (
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: col.bg, border: `1px solid ${col.border}`, color: col.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.titulo}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: col.c, background: col.bg, border: `1px solid ${col.border}`, padding: '2px 9px', borderRadius: 100 }}>{item.sub}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.55)', lineHeight: 1.65, margin: 0 }}>{item.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

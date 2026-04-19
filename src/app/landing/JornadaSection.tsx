'use client'

import { useState } from 'react'
import { IcZap, IcFilter, IcStar, IcUsers } from './icons'

const modos = [
  {
    num: '01', icon: <IcZap />, title: 'Descobrir',
    text: 'Swipe rápido, decisão instantânea. Curta, passe ou mande uma SuperCurtida. Só perfis verificados no seu radar.',
    preview: 'Perfis verificados. Decisão em segundos.',
    color: '#E11D48', colorSoft: 'rgba(225,29,72,0.12)', colorBorder: 'rgba(225,29,72,0.25)', colorGlow: 'rgba(225,29,72,0.30)',
  },
  {
    num: '02', icon: <IcFilter />, title: 'Busca avançada',
    text: 'Mais de 100 filtros. Você define corpo, estilo, hábitos, intenções. Quem não combina não aparece.',
    preview: 'Você define o tipo. O app filtra o que não encaixa.',
    color: '#A855F7', colorSoft: 'rgba(168,85,247,0.12)', colorBorder: 'rgba(168,85,247,0.25)', colorGlow: 'rgba(168,85,247,0.30)',
  },
  {
    num: '03', icon: <IcStar />, title: 'Match do dia',
    text: 'Todo dia o app analisa seu perfil e entrega uma seleção cirúrgica. Sem sorte. Com precisão.',
    preview: 'Uma seleção nova todo dia, feita só para você.',
    color: '#F59E0B', colorSoft: 'rgba(245,158,11,0.10)', colorBorder: 'rgba(245,158,11,0.25)', colorGlow: 'rgba(245,158,11,0.28)',
  },
  {
    num: '04', icon: <IcUsers />, title: 'Salas',
    text: 'Entre em salas públicas com até 20 pessoas ou crie a sua, privada ou aberta. Conexão em tempo real.',
    preview: 'Salas públicas ou personalizadas. Você decide quem entra.',
    color: '#10B981', colorSoft: 'rgba(16,185,129,0.10)', colorBorder: 'rgba(16,185,129,0.22)', colorGlow: 'rgba(16,185,129,0.25)',
  },
]

const intencoes = [
  { titulo: 'Relacionamento sério', color: '#E11D48', bg: 'rgba(225,29,72,0.10)', border: 'rgba(225,29,72,0.22)' },
  { titulo: 'Encontros casuais', color: 'rgb(96,165,250)', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.22)' },
  { titulo: 'Amizade', color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)' },
  { titulo: 'Romance', color: 'rgb(244,114,182)', bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.22)' },
  { titulo: 'Companhia para evento', color: 'rgb(167,139,250)', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.22)' },
  { titulo: 'Sugar', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' },
]

const jornada = [
  { num: '01', titulo: 'Match', texto: 'Ambos confirmam interesse. Só então o canal de conversa abre.' },
  { num: '02', titulo: 'Conversa', texto: 'No app, no seu ritmo, sem pressão para avançar.' },
  { num: '03', titulo: 'Videochamada', texto: 'Você vê quem é a pessoa antes de qualquer encontro.' },
  { num: '04', titulo: 'Encontro', texto: 'Só quando você quiser. Com check-in automático e emergência em 1 toque.' },
]

export default function JornadaSection() {
  const [modoAtivo, setModoAtivo] = useState(0)
  const modo = modos[modoAtivo]

  return (
    <section className="lp-modos-section">
      <div className="lp-modos-inner">

        <div className="lp-modos-header lp-anim">
          <h2>Nem todo momento pede<br />a mesma forma de conexão.</h2>
          <p>Explore, busque com precisão, entre em salas ou receba sugestões. Tudo no mesmo ambiente.</p>
        </div>

        <div className="lp-modos-layout">
          <div className="lp-modos-tabs">
            {modos.map((m, i) => (
              <div
                key={i}
                className={`lp-modo-tab${modoAtivo === i ? ' active' : ''}`}
                onMouseEnter={() => setModoAtivo(i)}
                onClick={() => setModoAtivo(i)}
                style={modoAtivo === i ? { borderColor: m.colorBorder, background: m.colorSoft } as React.CSSProperties : {}}
              >
                <span className="lp-modo-tab-num" style={modoAtivo === i ? { color: m.color } : {}}>{m.num}</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  {modoAtivo === i && (
                    <span className="lp-modo-tab-num-bg" style={{ color: m.color }}>{m.num}</span>
                  )}
                  <div className="lp-modo-tab-title" style={modoAtivo === i ? { color: '#fff' } : {}}>{m.title}</div>
                  <div className="lp-modo-tab-text">{m.text}</div>
                </div>
                {modoAtivo === i && (
                  <span className="lp-modo-tab-bar" style={{ background: m.color }} />
                )}
              </div>
            ))}
          </div>

          <div key={modoAtivo} className="lp-modos-preview lp-anim" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${modo.colorSoft} 0%, var(--bg-card) 65%)`,
            borderColor: modo.colorBorder,
            boxShadow: `0 0 60px ${modo.colorGlow}, 0 8px 32px rgba(0,0,0,0.4)`,
          }}>
            <div className="lp-modos-preview-icon" style={{
              background: modo.colorSoft, borderColor: modo.colorBorder, color: modo.color,
              boxShadow: `0 0 24px ${modo.colorGlow}`,
            }}>
              {modo.icon}
            </div>
            <div className="lp-modos-preview-title" style={{ color: modo.color }}>{modo.title}</div>
            <div className="lp-modos-preview-sub">{modo.preview}</div>
          </div>
        </div>

        {/* Intenções como pills */}
        <div className="lp-anim" style={{ marginTop: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(248,249,250,0.35)', marginBottom: 16 }}>Cada pessoa já entra com uma intenção declarada</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {intencoes.map((it, i) => (
              <span key={i} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, color: it.color, background: it.bg, border: `1px solid ${it.border}` }}>
                {it.titulo}
              </span>
            ))}
          </div>
        </div>

        {/* Jornada do match ao encontro */}
        <div className="lp-anim" style={{ marginTop: 72, borderTop: '1px solid var(--border-premium)', paddingTop: 56 }}>
          <p className="lp-section-label" style={{ marginBottom: 8 }}>Do match ao encontro</p>
          <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 36 }}>
            Tudo acontece dentro de um ambiente controlado.
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, var(--accent), rgba(225,29,72,0.15))' }} />
            {jornada.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-fraunces), serif', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{step.num}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{step.titulo}</div>
                <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.52)', lineHeight: 1.6, margin: 0 }}>{step.texto}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

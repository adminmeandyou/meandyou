'use client'

import { useState } from 'react'
import { IcZap, IcFilter, IcStar, IcUsers } from '../landing/icons'

const modos = [
  {
    num: '01', icon: <IcZap />, title: 'Descobrir',
    text: 'Swipe rapido, decisao instantanea. Curta, passe ou mande uma SuperCurtida. So perfis verificados no seu radar.',
    preview: 'Perfis verificados. Decisao em segundos.',
    color: '#E11D48', colorSoft: 'rgba(225,29,72,0.12)', colorBorder: 'rgba(225,29,72,0.25)', colorGlow: 'rgba(225,29,72,0.30)',
  },
  {
    num: '02', icon: <IcFilter />, title: 'Busca Avancada',
    text: 'Mais de 100 filtros. Voce define tudo — corpo, estilo, habitos, intencoes. Quem nao combina, nao aparece.',
    preview: 'Voce define o tipo. O app filtra tudo que nao encaixa.',
    color: '#A855F7', colorSoft: 'rgba(168,85,247,0.12)', colorBorder: 'rgba(168,85,247,0.25)', colorGlow: 'rgba(168,85,247,0.30)',
  },
  {
    num: '03', icon: <IcStar />, title: 'Match do Dia',
    text: 'Todo dia, o app analisa seu perfil e te entrega uma selecao cirurgica. Sem sorte. Com precisao.',
    preview: 'Uma selecao nova todo dia, feita so para voce.',
    color: '#F59E0B', colorSoft: 'rgba(245,158,11,0.10)', colorBorder: 'rgba(245,158,11,0.25)', colorGlow: 'rgba(245,158,11,0.28)',
  },
  {
    num: '04', icon: <IcUsers />, title: 'Salas',
    text: 'Entre em salas publicas com ate 20 pessoas ou crie a sua — privada ou aberta para todos. Conexao em tempo real.',
    preview: 'Salas publicas ou personalizadas. Voce decide quem entra.',
    color: '#10B981', colorSoft: 'rgba(16,185,129,0.10)', colorBorder: 'rgba(16,185,129,0.22)', colorGlow: 'rgba(16,185,129,0.25)',
  },
]

export default function ModosLancamento() {
  const [modoAtivo, setModoAtivo] = useState(0)
  const modo = modos[modoAtivo]

  return (
    <section className="lp-modos-section">
      <div className="lp-modos-inner">
        <div className="lp-modos-header lp-anim">
          <h2>Quatro formas de se conectar.<br /><em style={{color:'var(--accent)',fontStyle:'italic'}}>Todas incluidas nos 2 meses gratis.</em></h2>
          <p>Voce muda a forma de se conectar conforme o momento. E testa cada uma sem pagar nada.</p>
        </div>
        <p className="lp-modos-desc lp-anim">
          Explorar rapido, buscar com precisao, entrar em salas ou receber sugestoes diarias. Tudo dentro do mesmo app, disponivel agora no acesso antecipado.
        </p>
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
              background: modo.colorSoft,
              borderColor: modo.colorBorder,
              color: modo.color,
              boxShadow: `0 0 24px ${modo.colorGlow}`,
            }}>
              {modo.icon}
            </div>
            <div className="lp-modos-preview-title" style={{ color: modo.color }}>{modo.title}</div>
            <div className="lp-modos-preview-sub">{modo.preview}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

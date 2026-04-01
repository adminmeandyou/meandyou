'use client'

import { useState } from 'react'
import { IcZap, IcFilter, IcStar, IcUsers } from './icons'

export default function ModosSection() {
  const [modoAtivo, setModoAtivo] = useState(0)

  const modos = [
    { num: '01', icon: <IcZap />, title: 'Descobrir', text: 'Explore perfis com swipe. Curta, passe ou envie uma SuperCurtida. O modo mais rápido, com perfis verificados.' },
    { num: '02', icon: <IcFilter />, title: 'Busca Avançada', text: 'Mais de 100 filtros: corpo, estilo, personalidade, hábitos e intenções. Inclua quem quer ver, exclua quem não combina.' },
    { num: '03', icon: <IcStar />, title: 'Match do Dia', text: 'Todo dia, uma curadoria personalizada baseada no seu perfil, seus filtros e seu comportamento dentro do app.' },
    { num: '04', icon: <IcUsers />, title: 'Salas', text: 'Entre em salas temáticas por interesse ou humor e descubra quem está no mesmo astral que você neste momento.' },
  ]

  const previewIcons = [<IcZap key={0} />, <IcFilter key={1} />, <IcStar key={2} />, <IcUsers key={3} />]
  const previewTitles = ['Descobrir', 'Busca Avançada', 'Match do Dia', 'Salas']
  const previewSubs = [
    'Explore perfis com swipe. O modo mais rápido com perfis verificados.',
    'Mais de 100 filtros para encontrar exatamente quem faz sentido.',
    'Uma curadoria personalizada todo dia, só para você.',
    'Salas temáticas para quem está no mesmo astral agora.',
  ]

  return (
    <section className="lp-modos-section">
      <div className="lp-modos-inner">
        <div className="lp-modos-header lp-anim">
          <h2>Nem todo momento pede<br />a mesma forma de conexão.</h2>
          <p>Aqui você muda a forma de se conectar conforme o momento.</p>
        </div>
        <p className="lp-modos-desc lp-anim">
          Explorar rápido, buscar com precisão, entrar em salas ou receber sugestões. Tudo dentro do mesmo ambiente.
        </p>
        <div className="lp-modos-layout">
          <div className="lp-modos-tabs">
            {modos.map((m, i) => (
              <div
                key={i}
                className={`lp-modo-tab${modoAtivo === i ? ' active' : ''}`}
                onMouseEnter={() => setModoAtivo(i)}
                onClick={() => setModoAtivo(i)}
              >
                <span className="lp-modo-tab-num">{m.num}</span>
                <div>
                  <div className="lp-modo-tab-title">{m.title}</div>
                  <div className="lp-modo-tab-text">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-modos-preview lp-anim">
            <div className="lp-modos-preview-icon">{previewIcons[modoAtivo]}</div>
            <div className="lp-modos-preview-title">{previewTitles[modoAtivo]}</div>
            <div className="lp-modos-preview-sub">{previewSubs[modoAtivo]}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

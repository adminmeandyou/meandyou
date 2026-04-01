'use client'

import { useState, useEffect } from 'react'

const filtroTags = ['Tem pets', 'Não fuma', 'Pratica esporte', 'Bebe socialmente', 'Quer relacionamento', 'Viaja com frequência', 'Sem filhos', 'Vegetariana(o)', 'Trabalha remoto', 'Gosta de trilha', 'Gosta de cinema', 'Gosta de comida japonesa', 'Gosta de balada', 'Solteiro(a)', 'Gosta de séries', 'Tem cachorro']

export default function FiltrosSection() {
  const [filtroSimAtivos, setFiltroSimAtivos] = useState<number[]>([0, 2])
  const [filtroSimRejeitados, setFiltroSimRejeitados] = useState<number[]>([])
  const [filtroSlider, setFiltroSlider] = useState(34)

  useEffect(() => {
    const totalTags = 16
    let tagIdx = 0
    const tagTimer = setInterval(() => {
      const i = tagIdx % totalTags
      setFiltroSimAtivos(prev => {
        if (prev.includes(i)) {
          setFiltroSimRejeitados(r => [...r, i])
          setTimeout(() => setFiltroSimRejeitados(r => r.filter(x => x !== i)), 700)
          return prev.filter(x => x !== i)
        }
        return [...prev, i]
      })
      tagIdx++
    }, 1100)
    let sliderDir = 1
    const sliderTimer = setInterval(() => {
      setFiltroSlider(v => {
        const next = v + sliderDir * 2
        if (next >= 46) { sliderDir = -1; return 44 }
        if (next <= 20) { sliderDir = 1; return 22 }
        return next
      })
    }, 120)
    return () => { clearInterval(tagTimer); clearInterval(sliderTimer) }
  }, [])

  return (
    <section className="lp-filtros-v2">
      <div className="lp-filtros-v2-inner">
        <div className="lp-filtros-v2-left lp-anim">
          <p className="lp-section-label">FILTROS</p>
          <h2 className="lp-filtros-v2-title">Se não combina,<br />nem aparece.</h2>
          <p className="lp-filtros-v2-text">
            Você define exatamente o que faz sentido para você.<br />
            O resto simplesmente não entra no seu radar.
          </p>
          <p className="lp-filtros-v2-compl">Menos ruído. Mais conexão real.</p>
          <span className="lp-filtros-v2-micro">Você define. O app obedece.</span>
        </div>
        <div className="lp-filtros-v2-right lp-anim" style={{ transitionDelay: '0.1s' }}>
          <div className="lp-filtros-demo">
            <div className="lp-filtros-demo-header">
              <span>Filtros ativos</span>
              <span className="lp-filtros-count">{filtroSimAtivos.length}</span>
            </div>
            <div className="lp-filtros-tags">
              {filtroTags.map((tag, i) => (
                <span
                  key={i}
                  className={`lp-filtro-tag${filtroSimAtivos.includes(i) ? ' ativo' : filtroSimRejeitados.includes(i) ? ' rejeitado' : ''}`}
                  onClick={() => setFiltroSimAtivos(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                >
                  {filtroSimAtivos.includes(i) && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                  {tag}
                </span>
              ))}
            </div>
            <div className="lp-filtros-slider-wrap">
              <div className="lp-filtros-slider-label">
                <span>Idade</span>
                <span className="lp-filtros-slider-val">20 a {filtroSlider} anos</span>
              </div>
              <div className="lp-filtros-slider-track">
                <div
                  className="lp-filtros-slider-fill"
                  style={{ width: `${((filtroSlider - 18) / (60 - 18)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

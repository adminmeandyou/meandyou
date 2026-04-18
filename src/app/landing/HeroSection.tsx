'use client'

import { useState, useRef } from 'react'
import { swipeCards } from './data'
import type { SiteConfigPublic, LandingContentMap } from './types'
import { pick } from './types'

interface HeroProps {
  userCity: string
  config: SiteConfigPublic
  content: LandingContentMap
}

export default function HeroSection({ userCity, config, content }: HeroProps) {
  void config
  const badge = pick(content, 'hero', 'badge', 'Conexões sem máscaras')
  const tituloParte1 = pick(content, 'hero', 'titulo_parte1', 'Sem máscaras.')
  const tituloParte2 = pick(content, 'hero', 'titulo_parte2', 'Do seu jeito.')
  const sub = pick(content, 'hero', 'sub', 'Você escolhe com quem fala, como fala e pra quê.')
  const complemento = pick(content, 'hero', 'complemento', 'Relacionamento, casual, sexo, amizade ou networking. Cada um na sua intenção — sem bots, sem fakes, sem julgamento.')
  const ctaTexto = pick(content, 'hero', 'cta_texto', 'Começar agora')
  const ctaSecundarioTexto = pick(content, 'hero', 'cta_secundario', 'Saber mais')
  const [currentCard, setCurrentCard] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const swipeLock = useRef(false)

  const handleSwipe = (dir: 'left' | 'right' | 'up') => {
    if (swipeLock.current) return
    swipeLock.current = true
    setSwipeDir(dir)
    setTimeout(() => {
      setCurrentCard(c => (c + 1) % swipeCards.length)
      setSwipeDir(null)
      swipeLock.current = false
    }, 420)
  }

  const prev = swipeCards[(currentCard + swipeCards.length - 1) % swipeCards.length]
  const next = swipeCards[(currentCard + 1) % swipeCards.length]
  const card = swipeCards[currentCard]

  return (
    <section className="lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.55), rgba(8,9,14,0.80)), url('/backgrounds/hero.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="lp-hero">
        <div>
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            {badge}
          </div>
          <h1>{tituloParte1}<br /><em style={{color:'var(--accent)',fontStyle:'italic'}}>{tituloParte2}</em></h1>
          <p className="lp-hero-sub">{sub}</p>
          <p className="lp-hero-complement">{complemento}</p>
          <div className="lp-actions">
            <a href="/cadastro" className="lp-btn-main">
              {ctaTexto}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
            <a href="#como-funciona" className="lp-btn-outline">{ctaSecundarioTexto}</a>
          </div>
          <div className="lp-hero-social-proof">
            <span className="lp-hero-social-proof-dot" />
            <span><strong className="lp-hero-proof-number">+1.000</strong> pessoas já estão usando {userCity ? <>em <strong className="lp-hero-proof-number">{userCity}</strong></> : 'na sua região mesmo'}</span>
          </div>
        </div>

        <div className="lp-hero-right">
          <div className="lp-deck-wrap">
            {/* Card borrado da esquerda */}
            <div className="lp-deck-side lp-deck-left">
              <div style={{ width:'100%', height:'100%', background: prev.placeholder }}>
                <img src={prev.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
            </div>

            {/* Phone principal */}
            <div
              key={currentCard}
              className={`lp-phone${swipeDir === 'left' ? ' card-swipe-left' : swipeDir === 'right' ? ' card-swipe-right' : swipeDir === 'up' ? ' card-swipe-up' : ''}`}
              style={{ position:'relative', zIndex:2 }}>
              <span className="lp-swipe-label nope">PASSAR</span>
              <span className="lp-swipe-label like">CURTIR</span>
              <span className="lp-swipe-label super">SUPER</span>
              <div className="lp-phone-header">
                <div className="lp-phone-logo">
                  <img src="/logo.png" alt="MeAndYou" style={{ height: '28px', maxWidth: '140px', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize:'10px', opacity:0.6, marginTop:'3px', color: 'var(--muted)' }}>Conexões reais</div>
              </div>
              <div className="lp-phone-card">
                <div className="lp-phone-img" style={{ background: card.placeholder }}>
                  <img src={card.photo} alt={card.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                  <div className="lp-v-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Verificado
                  </div>
                </div>
                <div className="lp-phone-info">
                  <div className="lp-phone-name">{card.name}</div>
                  <div className="lp-phone-tags">
                    {card.tags.map((t,i) => <span key={i} className="lp-phone-tag">{t}</span>)}
                  </div>
                </div>
                <p className="lp-phone-bio">{card.bio}</p>
              </div>
              <div className="lp-phone-actions">
                <button className="lp-ph-btn no" onClick={() => handleSwipe('left')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button className="lp-ph-btn super" onClick={() => handleSwipe('up')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
                <button className="lp-ph-btn yes" onClick={() => handleSwipe('right')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </div>

            {/* Card borrado da direita */}
            <div className="lp-deck-side lp-deck-right">
              <div style={{ width:'100%', height:'100%', background: next.placeholder }}>
                <img src={next.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
            </div>
          </div>

          {/* Notificações removidas daqui — exibidas apenas no canto fixo (page.tsx) */}
        </div>
      </div>
    </section>
  )
}

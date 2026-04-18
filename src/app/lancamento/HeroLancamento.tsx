'use client'

import { useState, useRef, useEffect } from 'react'
import { swipeCards } from '../landing/data'
import { formatBRL, pick, type SiteConfigPublic, type LandingContentMap } from '../landing/types'

interface HeroProps {
  userCity: string
  notifList: Array<{id: number, text: string, exiting: boolean}>
  config: SiteConfigPublic
  content: LandingContentMap
}

const LAUNCH_END_FALLBACK = new Date('2026-05-15T00:00:00')
const VAGAS_TOTAL = 1000
const VAGAS_BASE = 847

function pad(n: number) { return String(n).padStart(2, '0') }

export default function HeroLancamento({ userCity, notifList, config, content }: HeroProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const swipeLock = useRef(false)

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [vagasPreenchidas, setVagasPreenchidas] = useState(VAGAS_BASE)

  const launchEnd = config.lancamento_fim
    ? new Date(config.lancamento_fim)
    : LAUNCH_END_FALLBACK

  useEffect(() => {
    const update = () => {
      const diff = launchEnd.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [launchEnd])

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.65) {
        setVagasPreenchidas(v => Math.min(v + 1, VAGAS_TOTAL - 10))
      }
    }, 12000)
    return () => clearInterval(id)
  }, [])

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
  const vagasPct = Math.round((vagasPreenchidas / VAGAS_TOTAL) * 100)

  const precoEssencial = formatBRL(config.preco_essencial)
  const badgeTxt = pick(content, 'hero', 'badge', 'Lançamento · Acesso antecipado disponível')
  const titulo1 = pick(content, 'hero', 'titulo', 'Você decide')
  const titulo2 = pick(content, 'hero', 'titulo2', 'quem entra')
  const titulo3 = pick(content, 'hero', 'titulo3', 'no seu mundo.')
  const subtitulo = pick(
    content,
    'hero',
    'subtitulo',
    'Filtros avançados, videochamada, salas e muito mais. Antes do lançamento oficial, você testa tudo de graça por 2 meses e ainda ganha um emblema de Fundador que ninguém mais vai ter.',
  )
  const complemento = pick(
    content,
    'hero',
    'complemento',
    'A plataforma é paga. Mas agora, antes de abrir para o mundo, precisamos de pessoas reais testando. A troca é justa.',
  )
  const ctaTexto = pick(content, 'hero', 'cta_primario', 'Garantir meu acesso grátis')
  const microcopyPrefixo = pick(
    content,
    'hero',
    'microcopy_prefixo',
    'Plano Essencial · 2 meses grátis · Depois',
  )
  const microcopySufixo = pick(
    content,
    'hero',
    'microcopy_sufixo',
    '/mês · Cancele quando quiser',
  )

  return (
    <section className="lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.55), rgba(8,9,14,0.80)), url('/backgrounds/hero.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="lp-hero">
        <div>
          <div className="lp-badge" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.30)', color: '#F59E0B' }}>
            <span className="lp-badge-dot" style={{ background: '#F59E0B' }} />
            {badgeTxt}
          </div>

          <h1>
            <em style={{color:'var(--accent)',fontStyle:'italic'}}>{titulo1}</em> {titulo2}<br />
            <em style={{color:'var(--text)',fontStyle:'italic'}}>{titulo3}</em>
          </h1>
          <p className="lp-hero-sub">{subtitulo}</p>
          <p className="lp-hero-complement">{complemento}</p>

          {timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds > 0 && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
            }}>
              {[
                { val: timeLeft.days, label: 'dias' },
                { val: timeLeft.hours, label: 'horas' },
                { val: timeLeft.minutes, label: 'min' },
                { val: timeLeft.seconds, label: 'seg' },
              ].map(({ val, label }) => (
                <div key={label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 56, padding: '10px 14px',
                  background: 'rgba(19,22,31,0.90)',
                  border: '1px solid rgba(225,29,72,0.25)',
                  borderRadius: 10,
                }}>
                  <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 700, lineHeight: 1, color: '#E11D48', letterSpacing: '-1px' }}>{pad(val)}</span>
                  <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.40)', letterSpacing: '0.06em', marginTop: 3 }}>{label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.45)', fontWeight: 500 }}>para o lançamento encerrar</span>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24, maxWidth: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.55)', fontWeight: 500 }}>
                <strong style={{ color: 'var(--text)' }}>{vagasPreenchidas.toLocaleString('pt-BR')}</strong> vagas preenchidas de {VAGAS_TOTAL.toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: 12, color: '#E11D48', fontWeight: 700 }}>{vagasPct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                width: `${vagasPct}%`,
                background: 'linear-gradient(90deg, #E11D48, #F43F5E)',
                transition: 'width 1s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(248,249,250,0.35)', marginTop: 5 }}>
              Quando chegar em 1.000, o lançamento encerra
            </p>
          </div>

          <div className="lp-actions">
            <a href="/cadastro" className="lp-btn-main">
              {ctaTexto}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          </div>
          <p className="lp-hero-microcopy">
            {microcopyPrefixo} <strong>R${precoEssencial}</strong>{microcopySufixo}
          </p>
          <div className="lp-hero-social-proof">
            <span className="lp-hero-social-proof-dot" />
            <span><strong className="lp-hero-proof-number">+1.000</strong> pessoas já garantiram seu acesso {userCity ? <>em <strong className="lp-hero-proof-number">{userCity}</strong></> : 'na sua região'}</span>
          </div>
        </div>

        <div className="lp-hero-right">
          <div className="lp-deck-wrap">
            <div className="lp-deck-side lp-deck-left">
              <div style={{ width:'100%', height:'100%', background: prev.placeholder }}>
                <img src={prev.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
            </div>

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
                <div style={{ fontSize:'10px', opacity:0.6, marginTop:'3px', color: 'var(--muted)' }}>Acesso antecipado</div>
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
                <button className="lp-ph-btn no" onClick={() => handleSwipe('left')} style={{ cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button className="lp-ph-btn super" onClick={() => handleSwipe('up')} style={{ cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
                <button className="lp-ph-btn yes" onClick={() => handleSwipe('right')} style={{ cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </div>

            <div className="lp-deck-side lp-deck-right">
              <div style={{ width:'100%', height:'100%', background: next.placeholder }}>
                <img src={next.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
            </div>
          </div>

          <div className="lp-notif-area">
            {notifList.map(n => (
              <div key={n.id} className={`lp-notif-item ${n.exiting ? 'lp-notif-exit' : 'lp-notif-enter'}`}>
                <span className="lp-fc-dot" />{n.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

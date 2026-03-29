'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', fontWeight: 600, fontSize: '16px', color: '#F8F9FA',
          fontFamily: 'var(--font-jakarta), sans-serif', textAlign: 'left',
          padding: '28px 0',
        }}
      >
        {pergunta}
        <span style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: aberto ? '#E11D48' : 'rgba(255,255,255,0.06)',
          color: aberto ? '#fff' : 'rgba(248,249,250,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, fontWeight: 300,
          transform: aberto ? 'rotate(45deg)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: aberto ? '300px' : '0', overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s',
        opacity: aberto ? 1 : 0,
      }}>
        <p style={{
          fontSize: '15px', color: 'rgba(248,249,250,0.5)',
          lineHeight: 1.8, paddingBottom: '28px', paddingRight: '48px',
        }}>{resposta}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const animRef = useRef(false)
  const [navVisible, setNavVisible] = useState(true)
  const [navScrolled, setNavScrolled] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const lastScrollY = useRef(0)

  // Card deck
  const [currentCard, setCurrentCard] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const swipeLock = useRef(false)

  // PWA Install
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installDone, setInstallDone] = useState(false)

  // Formulario de contato
  const [contatoNome, setContatoNome] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoAssunto, setContatoAssunto] = useState('')
  const [contatoMensagem, setContatoMensagem] = useState('')
  const [contatoEnviando, setContatoEnviando] = useState(false)
  const [contatoEnviado, setContatoEnviado] = useState(false)
  const [contatoErro, setContatoErro] = useState('')

  async function handleContatoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setContatoErro('')
    if (!contatoNome.trim() || !contatoEmail.trim() || !contatoAssunto || !contatoMensagem.trim()) {
      setContatoErro('Preencha todos os campos.')
      return
    }
    setContatoEnviando(true)
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: contatoNome, email: contatoEmail, assunto: contatoAssunto, mensagem: contatoMensagem }),
      })
      const json = await res.json()
      if (!res.ok) { setContatoErro(json.error ?? 'Erro ao enviar.'); return }
      setContatoEnviado(true)
      setContatoNome(''); setContatoEmail(''); setContatoAssunto(''); setContatoMensagem('')
    } catch {
      setContatoErro('Erro ao enviar. Tente novamente.')
    } finally {
      setContatoEnviando(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) { router.push('/dashboard') } else { setChecking(false) } })
      .catch(() => setChecking(false))
  }, [router])

  // Scroll reveal
  useEffect(() => {
    if (checking || animRef.current) return
    animRef.current = true
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).classList.add('lp-visible')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    document.querySelectorAll('.lp-anim').forEach(el => {
      if (prefersReduced) { (el as HTMLElement).classList.add('lp-visible'); return }
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [checking])

  // Nav scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setNavScrolled(currentY > 40)
      if (currentY < 60) setNavVisible(true)
      else if (currentY < lastScrollY.current) setNavVisible(true)
      else setNavVisible(false)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // PWA
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallDone(true)
    setInstallPrompt(null)
  }

  // Swipe
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

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090E' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '36px', color: '#f0ece4' }}>
          MeAnd<span style={{ color: '#E11D48' }}>You</span>
        </h1>
      </div>
    )
  }

  const swipeCards = [
    { name: 'Julia, 26', photo: '/julia.jpg', tags: ['Gamer', 'Vegana', 'SP'], bio: 'Gamer nas horas vagas, vegana ha 3 anos. Procuro conexao genuina.', placeholder: 'linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%)' },
    { name: 'Roberto, 55', photo: '/Roberto.jpg', tags: ['Eletricista', 'RJ', 'Fuma'], bio: 'Eletricista de mao cheia, churrasco todo fim de semana.', placeholder: 'linear-gradient(160deg,#0a1020 0%,#1a2a4a 50%,#0d1830 100%)' },
    { name: 'Ana Paula, 38', photo: '/ana-paula.jpg', tags: ['Mae', 'Pet', 'Secretaria'], bio: 'Mae de 2, tutora de um golden louco e secretaria.', placeholder: 'linear-gradient(160deg,#120a1a 0%,#2d1545 50%,#1a0e30 100%)' },
  ]

  const faqItems = [
    { q: 'Por que nao existe um plano gratuito?', a: 'Porque o gratuito atrai quem nao sabe o que quer. Aplicativos abertos viram bagunca: perfis falsos, pessoas inativas e perda de tempo. Cobrar um valor acessivel cria um filtro imediato. Quem investe para estar aqui tem outro nivel de intencao.' },
    { q: 'Como funciona a verificacao de identidade?', a: 'Exigimos selfie ao vivo com sequencia de movimentos, leitura de documento fisico e validacao de CPF na criacao da conta. Se alguem quebra as regras e e banido, o bloqueio e feito direto no CPF. Nao adianta criar outro e-mail.' },
    { q: 'O que e a area Backstage do Camarote Black?', a: 'E o seu espaco privado para desejos especificos. Uma area com filtros exclusivos: Sugar, BDSM, Swing, fetiches e poliamor. Voce so ve e e visto por quem marcou as exatas mesmas intencoes. Zero exposicao desnecessaria.' },
    { q: 'Como funcionam os filtros de incluir e excluir?', a: 'Clicou na tag, ficou verde: voce quer ver aquele perfil. Clicou de novo, ficou vermelho: perfil bloqueado. Clicou a terceira vez: volta ao neutro. Voce molda a sua busca em segundos.' },
    { q: 'Posso cancelar quando quiser?', a: 'Com dois cliques, direto no aplicativo. Sem burocracia, sem atendente. Voce cancela na hora e continua usando ate o final do periodo pago. Zero fidelidade, zero multa.' },
    { q: 'O app funciona para todas as orientacoes?', a: 'Completamente. Nosso sistema foi desenhado para todas as orientacoes sexuais, identidades de genero e formatos de relacionamento. O espaco e livre e se adapta ao que voce procura.' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.meandyou.com.br/#organization',
        name: 'MeAndYou',
        url: 'https://www.meandyou.com.br',
        logo: 'https://www.meandyou.com.br/logo.png',
        description: 'App de relacionamentos brasileiro com verificacao real de identidade e os filtros mais completos do Brasil.',
        contactPoint: { '@type': 'ContactPoint', email: 'adminmeandyou@proton.me', contactType: 'customer support', availableLanguage: 'Portuguese' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question', name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

  const card = swipeCards[currentCard]
  const nextCard = swipeCards[(currentCard + 1) % swipeCards.length]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        :root {
          --bg: #08090E; --bg-card: #0F1117; --bg-card2: #13161F;
          --accent: #E11D48; --accent-soft: rgba(225,29,72,0.08); --accent-border: rgba(225,29,72,0.20);
          --gold: #F59E0B; --gold-soft: rgba(245,158,11,0.08); --gold-border: rgba(245,158,11,0.20);
          --text: #F8F9FA; --text-muted: rgba(248,249,250,0.45); --text-dim: rgba(248,249,250,0.25);
          --border: rgba(255,255,255,0.06); --border-soft: rgba(255,255,255,0.03);
          --accent-grad: linear-gradient(135deg, #E11D48 0%, #be123c 100%);
          --ease: cubic-bezier(0.16,1,0.3,1);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

        .lp { background: var(--bg); color: var(--text); font-family: var(--font-jakarta), sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px; max-width: 100%;
          background: transparent;
          transition: all 0.5s var(--ease);
        }
        .lp-nav.scrolled {
          background: rgba(8,9,14,0.8); backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-bottom: 1px solid var(--border);
          padding: 14px 40px;
        }
        .lp-logo { font-family: var(--font-fraunces), serif; font-weight: 700; font-size: 24px; color: var(--text); letter-spacing: -0.5px; text-decoration: none; }
        .lp-logo span { color: var(--accent); }
        .lp-nav-links { display: flex; gap: 0; list-style: none; }
        .lp-nav-links a {
          color: rgba(248,249,250,0.5); text-decoration: none; font-size: 13px;
          font-weight: 500; padding: 8px 16px; letter-spacing: 0.3px;
          transition: color 0.3s;
        }
        .lp-nav-links a:hover { color: var(--text); }
        .lp-nav-cta {
          background: var(--text); color: var(--bg); padding: 10px 24px;
          border-radius: 100px; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 0.3s var(--ease);
          letter-spacing: 0.2px;
        }
        .lp-nav-cta:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }

        /* ── ANIMATIONS ── */
        @keyframes heroIn { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes phoneIn { from { opacity:0; transform:translateY(60px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(48px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes blurIn { from { opacity:0; filter:blur(20px); transform:translateY(24px); } to { opacity:1; filter:blur(0); transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes slideLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes swipeLeft { to { transform: translateX(-120%) rotate(-12deg); opacity: 0; } }
        @keyframes swipeRight { to { transform: translateX(120%) rotate(12deg); opacity: 0; } }
        @keyframes swipeUp { to { transform: translateY(-100%) scale(0.8); opacity: 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes glowPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }

        .lp-anim { opacity: 0; }
        .lp-anim.lp-visible { animation: fadeUp 0.8s var(--ease) both; }
        .lp-anim.lp-visible[data-anim="blur"] { animation: blurIn 0.9s var(--ease) both; }
        .lp-anim.lp-visible[data-anim="scale"] { animation: scaleIn 0.7s var(--ease) both; }
        .lp-anim.lp-visible[data-anim="left"] { animation: slideLeft 0.8s var(--ease) both; }
        .lp-anim.lp-visible[data-anim="right"] { animation: slideRight 0.8s var(--ease) both; }
        .lp-anim.lp-visible[data-delay="1"] { animation-delay: 0.1s; }
        .lp-anim.lp-visible[data-delay="2"] { animation-delay: 0.2s; }
        .lp-anim.lp-visible[data-delay="3"] { animation-delay: 0.3s; }
        .lp-anim.lp-visible[data-delay="4"] { animation-delay: 0.4s; }
        .lp-anim.lp-visible[data-delay="5"] { animation-delay: 0.5s; }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 140px 56px 120px; position: relative; overflow: hidden;
        }
        .lp-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(225,29,72,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-hero-inner {
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
          align-items: center; max-width: 1200px; width: 100%;
        }
        .lp-hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;
          color: var(--accent); margin-bottom: 32px;
          animation: heroIn 0.6s var(--ease) both;
        }
        .lp-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease-in-out infinite; }
        .lp-hero h1 {
          font-family: var(--font-fraunces), serif; font-size: clamp(48px, 5.5vw, 80px);
          font-weight: 700; line-height: 1.02; letter-spacing: -3px;
          margin-bottom: 28px; animation: heroIn 0.6s 0.1s var(--ease) both;
        }
        .lp-hero h1 em { font-style: italic; color: var(--accent); }
        .lp-hero-sub {
          font-size: 18px; font-weight: 400; color: rgba(248,249,250,0.5);
          max-width: 440px; line-height: 1.7; margin-bottom: 48px;
          animation: heroIn 0.6s 0.2s var(--ease) both;
        }
        .lp-hero-actions { display: flex; gap: 16px; flex-wrap: wrap; animation: heroIn 0.6s 0.3s var(--ease) both; }
        .lp-btn-main {
          background: var(--accent-grad); color: #fff; padding: 16px 36px; border-radius: 100px;
          font-weight: 600; font-size: 15px; text-decoration: none; display: inline-flex;
          align-items: center; gap: 10px;
          box-shadow: 0 0 0 1px rgba(225,29,72,0.3), 0 8px 32px rgba(225,29,72,0.25);
          transition: all 0.3s var(--ease); cursor: pointer; border: none;
          font-family: var(--font-jakarta), sans-serif; letter-spacing: 0.2px;
        }
        .lp-btn-main:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(225,29,72,0.4), 0 16px 48px rgba(225,29,72,0.35); }
        .lp-btn-ghost {
          background: transparent; color: rgba(248,249,250,0.6); padding: 16px 32px;
          border-radius: 100px; font-weight: 500; font-size: 15px; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: color 0.3s; cursor: pointer; border: none;
          font-family: var(--font-jakarta), sans-serif;
        }
        .lp-btn-ghost:hover { color: var(--text); }
        .lp-hero-stats {
          display: flex; gap: 40px; margin-top: 64px; animation: heroIn 0.6s 0.4s var(--ease) both;
        }
        .lp-stat-num { font-family: var(--font-fraunces), serif; font-size: 32px; font-weight: 700; color: var(--text); letter-spacing: -1px; }
        .lp-stat-label { font-size: 12px; color: var(--text-dim); margin-top: 4px; letter-spacing: 0.5px; }

        /* Phone */
        .lp-hero-phone { position: relative; display: flex; justify-content: center; animation: phoneIn 0.9s 0.2s var(--ease) both; }
        .lp-phone {
          width: 280px; height: 580px; background: var(--bg-card);
          border-radius: 40px; border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          overflow: hidden; position: relative;
        }
        .lp-phone-glow {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          animation: glowPulse 4s ease-in-out infinite; pointer-events: none; z-index: -1;
        }
        .lp-phone-header {
          background: var(--bg); padding: 40px 20px 12px; text-align: center;
          border-bottom: 1px solid var(--border);
        }
        .lp-phone-card {
          margin: 10px; background: var(--bg-card2); border-radius: 18px; overflow: hidden;
          border: 1px solid var(--border); position: relative;
        }
        .lp-phone-card.swiping-left { animation: swipeLeft 0.42s var(--ease) forwards; }
        .lp-phone-card.swiping-right { animation: swipeRight 0.42s var(--ease) forwards; }
        .lp-phone-card.swiping-up { animation: swipeUp 0.42s var(--ease) forwards; }
        .lp-phone-img {
          height: 220px; background-size: cover; background-position: top center;
          position: relative; overflow: hidden;
        }
        .lp-phone-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
        .lp-v-badge {
          position: absolute; top: 10px; right: 10px; background: var(--accent); color: #fff;
          border-radius: 100px; padding: 4px 10px; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; gap: 4px;
        }
        .lp-phone-info { padding: 14px 16px 10px; }
        .lp-phone-name { font-family: var(--font-fraunces), serif; font-size: 18px; font-weight: 700; }
        .lp-phone-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
        .lp-phone-tag { background: rgba(225,29,72,0.08); color: var(--accent); border-radius: 100px; padding: 3px 10px; font-size: 10px; font-weight: 600; }
        .lp-phone-bio { font-size: 11px; color: var(--text-muted); line-height: 1.5; padding: 0 16px 12px; }
        .lp-phone-actions { display: flex; justify-content: center; gap: 14px; padding: 8px 16px 16px; }
        .lp-ph-btn {
          width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; border: none; cursor: pointer; transition: all 0.2s var(--ease);
        }
        .lp-ph-btn:hover { transform: scale(1.12); }
        .lp-ph-btn.no { background: rgba(244,63,94,0.08); color: #F43F5E; border: 1px solid rgba(244,63,94,0.15); }
        .lp-ph-btn.super { background: var(--gold-soft); color: var(--gold); border: 1px solid var(--gold-border); }
        .lp-ph-btn.yes { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
        .lp-swipe-label {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-12deg);
          font-size: 28px; font-weight: 800; letter-spacing: 3px; padding: 6px 20px;
          border-radius: 8px; border: 3px solid; z-index: 10; pointer-events: none;
        }

        /* ── SECTIONS ── */
        .lp-section { padding: 140px 56px; position: relative; }
        .lp-section-inner { max-width: 1100px; margin: 0 auto; }
        .lp-label { font-size: 11px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: var(--accent); margin-bottom: 20px; }
        .lp-h2 { font-family: var(--font-fraunces), serif; font-size: clamp(36px, 4.5vw, 60px); font-weight: 700; letter-spacing: -2px; line-height: 1.05; margin-bottom: 20px; }
        .lp-h2 em { color: var(--accent); font-style: italic; }
        .lp-subtitle { font-size: 17px; color: var(--text-muted); line-height: 1.7; max-width: 520px; }

        /* ── VALUE PROPS (3 blocks asymmetric) ── */
        .lp-value { border-top: 1px solid var(--border); }
        .lp-value-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0; align-items: center;
          border-bottom: 1px solid var(--border); min-height: 500px;
        }
        .lp-value-row.reverse { direction: rtl; }
        .lp-value-row.reverse > * { direction: ltr; }
        .lp-value-text { padding: 80px 72px; }
        .lp-value-visual {
          height: 100%; display: flex; align-items: center; justify-content: center;
          background: var(--bg-card); border-left: 1px solid var(--border); position: relative;
          overflow: hidden; min-height: 500px;
        }
        .lp-value-row.reverse .lp-value-visual { border-left: none; border-right: 1px solid var(--border); }
        .lp-value-num {
          font-family: var(--font-fraunces), serif; font-size: 120px; font-weight: 700;
          color: rgba(225,29,72,0.04); position: absolute; top: 20px; right: 30px; line-height: 1;
        }
        .lp-value-icon {
          width: 80px; height: 80px; border-radius: 24px;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); animation: float 6s ease-in-out infinite;
        }
        .lp-value-text h3 {
          font-family: var(--font-fraunces), serif; font-size: clamp(28px, 3vw, 42px);
          font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px;
        }
        .lp-value-text p { font-size: 16px; color: var(--text-muted); line-height: 1.8; max-width: 420px; }
        .lp-value-text p strong { color: rgba(248,249,250,0.8); font-weight: 600; }

        /* ── HOW IT WORKS ── */
        .lp-how { background: var(--bg-card); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lp-how-header { text-align: center; margin-bottom: 80px; }
        .lp-steps {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
          position: relative;
        }
        .lp-step {
          text-align: center; padding: 0 32px; position: relative;
        }
        .lp-step::after {
          content: ''; position: absolute; top: 32px; right: 0; width: 1px;
          height: 40px; background: var(--border);
        }
        .lp-step:last-child::after { display: none; }
        .lp-step-num {
          width: 64px; height: 64px; border-radius: 50%;
          border: 1px solid var(--accent-border); background: var(--accent-soft);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; font-family: var(--font-fraunces), serif;
          font-size: 22px; font-weight: 700; color: var(--accent);
          transition: all 0.4s var(--ease);
        }
        .lp-step:hover .lp-step-num {
          background: var(--accent); color: #fff; border-color: var(--accent);
          transform: scale(1.1); box-shadow: 0 8px 32px rgba(225,29,72,0.3);
        }
        .lp-step h3 { font-family: var(--font-fraunces), serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.5px; }
        .lp-step p { font-size: 14px; color: var(--text-muted); line-height: 1.7; }

        /* ── FILTERS DEMO ── */
        .lp-filters { border-top: 1px solid var(--border); }
        .lp-filters-header { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: end; margin-bottom: 64px; }
        .lp-filter-demo {
          display: flex; flex-wrap: wrap; gap: 10px;
          padding: 40px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 24px;
        }
        .lp-ftag {
          border-radius: 100px; padding: 10px 20px; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.3s var(--ease); border: 1px solid transparent;
          user-select: none;
        }
        .lp-ftag.neu { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: var(--border); }
        .lp-ftag.inc { background: rgba(46,196,160,0.10); color: #2ec4a0; border-color: rgba(46,196,160,0.25); }
        .lp-ftag.exc { background: rgba(244,63,94,0.06); color: #F43F5E; border-color: rgba(244,63,94,0.20); }
        .lp-ftag:hover { transform: translateY(-2px); }
        .lp-filter-counter {
          font-family: var(--font-fraunces), serif; font-size: 72px; font-weight: 700;
          color: var(--text); letter-spacing: -3px; line-height: 1;
        }
        .lp-filter-counter span { color: var(--accent); }
        .lp-filter-hint { font-size: 13px; color: var(--text-dim); margin-top: 24px; }

        /* ── TESTIMONIALS ── */
        .lp-testi { border-top: 1px solid var(--border); background: var(--bg-card); }
        .lp-testi-header { text-align: center; margin-bottom: 72px; }
        .lp-testi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .lp-testi-card {
          background: var(--bg); border: 1px solid var(--border); border-radius: 24px;
          padding: 40px; transition: all 0.4s var(--ease); position: relative;
        }
        .lp-testi-card:hover { border-color: var(--accent-border); transform: translateY(-4px); }
        .lp-testi-card.featured {
          grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr; gap: 40px;
          align-items: center; border-color: var(--accent-border);
          background: linear-gradient(135deg, var(--bg) 0%, rgba(225,29,72,0.03) 100%);
        }
        .lp-testi-quote {
          font-size: 80px; font-family: var(--font-fraunces), serif; color: rgba(225,29,72,0.15);
          line-height: 1; position: absolute; top: 16px; left: 28px;
        }
        .lp-testi-featured-quote { font-size: 120px; font-family: var(--font-fraunces), serif; color: rgba(225,29,72,0.1); line-height: 1; flex-shrink: 0; }
        .lp-testi-text { font-size: 16px; color: rgba(248,249,250,0.7); line-height: 1.8; margin-bottom: 24px; }
        .lp-testi-author { display: flex; align-items: center; gap: 12px; }
        .lp-testi-av {
          width: 44px; height: 44px; border-radius: 50%; background: var(--accent-soft);
          border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          font-family: var(--font-fraunces), serif; font-size: 16px; font-weight: 700; color: var(--accent);
        }
        .lp-testi-name { font-size: 14px; font-weight: 600; }
        .lp-testi-role { font-size: 12px; color: var(--text-dim); }

        /* ── PLANS ── */
        .lp-plans { border-top: 1px solid var(--border); }
        .lp-plans-header { text-align: center; margin-bottom: 72px; }
        .lp-plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .lp-plan-card {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px;
          padding: 44px 36px; position: relative; transition: all 0.4s var(--ease);
        }
        .lp-plan-card:hover { transform: translateY(-6px); border-color: rgba(255,255,255,0.1); }
        .lp-plan-card.mid { border-color: var(--accent-border); }
        .lp-plan-card.mid:hover { box-shadow: 0 24px 64px rgba(225,29,72,0.12); }
        .lp-plan-card.vip { border-color: var(--gold-border); }
        .lp-plan-card.vip:hover { box-shadow: 0 24px 64px rgba(245,158,11,0.10); }
        .lp-plan-badge {
          position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
          font-size: 10px; font-weight: 700; padding: 6px 20px; border-radius: 100px;
          letter-spacing: 1.5px; text-transform: uppercase; white-space: nowrap;
        }
        .lp-plan-name { font-family: var(--font-fraunces), serif; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .lp-plan-price {
          font-family: var(--font-fraunces), serif; font-size: 56px; font-weight: 700;
          letter-spacing: -2px; line-height: 1; margin: 16px 0 4px;
        }
        .lp-plan-price sup { font-size: 20px; vertical-align: super; }
        .lp-plan-period { font-size: 13px; color: var(--text-dim); margin-bottom: 28px; }
        .lp-plan-feats { list-style: none; margin-bottom: 32px; padding: 0; border-top: 1px solid var(--border); padding-top: 24px; }
        .lp-plan-feats li {
          font-size: 14px; color: var(--text-muted); padding: 8px 0;
          display: flex; align-items: center; gap: 10px;
        }
        .lp-plan-feats li::before {
          content: ''; width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-soft); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23E11D48' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: center;
        }
        .lp-plan-feats li.gold::before {
          background-color: var(--gold-soft);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
        }
        .lp-plan-btn {
          display: block; text-align: center; padding: 14px; border-radius: 100px;
          font-weight: 600; font-size: 14px; text-decoration: none; cursor: pointer;
          transition: all 0.3s var(--ease); border: none;
          font-family: var(--font-jakarta), sans-serif; width: 100%;
        }
        .lp-plan-btn.outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .lp-plan-btn.outline:hover { border-color: rgba(255,255,255,0.15); }
        .lp-plan-btn.accent { background: var(--accent-grad); color: #fff; box-shadow: 0 4px 20px rgba(225,29,72,0.2); }
        .lp-plan-btn.accent:hover { box-shadow: 0 8px 32px rgba(225,29,72,0.35); transform: translateY(-1px); }
        .lp-plan-btn.gold { background: var(--gold); color: #fff; }
        .lp-plan-btn.gold:hover { box-shadow: 0 8px 32px rgba(245,158,11,0.3); transform: translateY(-1px); }

        /* ── SECURITY ── */
        .lp-security {
          border-top: 1px solid var(--border); background: var(--bg-card);
          position: relative; overflow: hidden;
        }
        .lp-security::before {
          content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(225,29,72,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-security-inner { text-align: center; position: relative; }
        .lp-security-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 800px; margin: 48px auto 0; text-align: left; }
        .lp-security-item {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 24px; border-radius: 16px; border: 1px solid var(--border);
          background: var(--bg); transition: all 0.3s var(--ease);
        }
        .lp-security-item:hover { border-color: var(--accent-border); }
        .lp-security-icon { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
        .lp-security-item strong { font-size: 14px; display: block; margin-bottom: 4px; }
        .lp-security-item p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        /* ── FAQ ── */
        .lp-faq { border-top: 1px solid var(--border); }
        .lp-faq-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 80px; align-items: start; }
        .lp-faq-list { border-top: 1px solid var(--border); }

        /* ── CTA FINAL ── */
        .lp-cta {
          padding: 160px 56px; text-align: center; position: relative; overflow: hidden;
          border-top: 1px solid var(--border);
        }
        .lp-cta::before {
          content: ''; position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%);
          width: 800px; height: 400px;
          background: radial-gradient(ellipse, rgba(225,29,72,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-cta h2 { font-family: var(--font-fraunces), serif; font-size: clamp(40px, 5vw, 72px); font-weight: 700; letter-spacing: -3px; line-height: 1.05; margin-bottom: 24px; }
        .lp-cta h2 em { color: var(--accent); font-style: italic; }
        .lp-cta p { font-size: 17px; color: var(--text-muted); margin-bottom: 48px; }

        /* ── FOOTER ── */
        .lp-footer { border-top: 1px solid var(--border); padding: 64px 56px 40px; }
        .lp-footer-inner { max-width: 1100px; margin: 0 auto; }
        .lp-footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .lp-footer-brand { font-size: 14px; color: var(--text-dim); line-height: 1.7; max-width: 280px; margin-top: 16px; }
        .lp-footer h4 { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 20px; }
        .lp-footer a { display: block; font-size: 14px; color: var(--text-muted); text-decoration: none; padding: 4px 0; transition: color 0.2s; }
        .lp-footer a:hover { color: var(--text); }
        .lp-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; border-top: 1px solid var(--border); }
        .lp-footer-copy { font-size: 12px; color: var(--text-dim); }

        /* ── CONTACT ── */
        .lp-footer-contact { padding: 48px 0 0; border-top: 1px solid var(--border); margin-top: 48px; }
        .lp-contact-form { display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 12px; align-items: end; }
        .lp-contact-form input, .lp-contact-form select, .lp-contact-form textarea {
          background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px;
          color: var(--text); font-family: var(--font-jakarta), sans-serif; font-size: 14px; padding: 12px 16px;
          outline: none; transition: border-color 0.2s; appearance: none; -webkit-appearance: none;
        }
        .lp-contact-form input:focus, .lp-contact-form select:focus, .lp-contact-form textarea:focus { border-color: var(--accent-border); }
        .lp-contact-form textarea { resize: none; height: 46px; }
        .lp-contact-form option { background: var(--bg-card); }
        .lp-contact-btn {
          background: var(--accent-grad); color: #fff; border: none; border-radius: 12px;
          padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: var(--font-jakarta), sans-serif; transition: all 0.3s var(--ease);
          white-space: nowrap;
        }
        .lp-contact-btn:hover { transform: translateY(-1px); }

        /* ── HAMBURGER ── */
        .lp-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
        .lp-hamburger span { display: block; width: 20px; height: 1.5px; background: var(--text); margin: 5px 0; transition: all 0.3s; }
        .lp-hamburger.open span:first-child { transform: rotate(45deg) translate(4px, 4px); }
        .lp-hamburger.open span:nth-child(2) { opacity: 0; }
        .lp-hamburger.open span:last-child { transform: rotate(-45deg) translate(4px, -4px); }
        .lp-mobile-menu {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 199;
          background: rgba(8,9,14,0.95); backdrop-filter: blur(24px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 32px;
        }
        .lp-mobile-menu a {
          font-size: 20px; color: var(--text-muted); text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .lp-mobile-menu a:hover { color: var(--text); }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .lp-hero-inner { grid-template-columns: 1fr; text-align: center; gap: 48px; }
          .lp-hero-sub { margin: 0 auto 48px; }
          .lp-hero-actions { justify-content: center; }
          .lp-hero-stats { justify-content: center; }
          .lp-hero { padding: 120px 32px 80px; }
          .lp-value-row, .lp-value-row.reverse { grid-template-columns: 1fr; direction: ltr; }
          .lp-value-row.reverse > * { direction: ltr; }
          .lp-value-visual { min-height: 300px; border-left: none; border-top: 1px solid var(--border); }
          .lp-value-row.reverse .lp-value-visual { border-right: none; border-top: 1px solid var(--border); }
          .lp-value-text { padding: 48px 32px; }
          .lp-steps { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .lp-step::after { display: none; }
          .lp-filters-header { grid-template-columns: 1fr; gap: 40px; }
          .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-testi-card.featured { grid-template-columns: 1fr; }
          .lp-plan-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
          .lp-security-grid { grid-template-columns: 1fr; }
          .lp-faq-layout { grid-template-columns: 1fr; gap: 40px; }
          .lp-section { padding: 80px 24px; }
          .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .lp-nav { padding: 16px 24px; }
          .lp-nav.scrolled { padding: 12px 24px; }
          .lp-nav-links { display: none; }
          .lp-nav-cta { display: none; }
          .lp-hamburger { display: block; }
          .lp-contact-form { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .lp-steps { grid-template-columns: 1fr; }
          .lp-footer-top { grid-template-columns: 1fr; }
          .lp-footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
          .lp-hero h1 { letter-spacing: -2px; }
        }
      `}</style>

      <div className="lp">
        {/* ── NAV ── */}
        <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`} style={{ transform: navVisible ? 'none' : 'translateY(-120%)' }}>
          <a href="#" className="lp-logo">MeAnd<span>You</span></a>
          <ul className="lp-nav-links">
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#filtros">Filtros</a></li>
            <li><a href="#planos">Planos</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <a href="/cadastro" className="lp-nav-cta">Criar conta</a>
          <button className={`lp-hamburger${menuAberto ? ' open' : ''}`} onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </nav>

        {menuAberto && (
          <div className="lp-mobile-menu" onClick={() => setMenuAberto(false)}>
            <a href="#como-funciona">Como funciona</a>
            <a href="#filtros">Filtros</a>
            <a href="#planos">Planos</a>
            <a href="#faq">FAQ</a>
            <a href="/cadastro" style={{ color: 'var(--accent)', fontWeight: 700 }}>Criar conta</a>
            <a href="/login">Entrar</a>
          </div>
        )}

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div>
              <div className="lp-hero-tag">
                <span className="lp-hero-dot" />
                Verificacao real de identidade
              </div>
              <h1>
                Encontre<br />
                <em>quem existe</em><br />
                de verdade
              </h1>
              <p className="lp-hero-sub">
                Sem perfis falsos. Sem contas gratuitas. Cada pessoa aqui
                investiu para estar. Voce sente a diferenca ja na primeira
                mensagem.
              </p>
              <div className="lp-hero-actions">
                <a href="/cadastro" className="lp-btn-main">
                  Comecar agora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
                <a href="/login" className="lp-btn-ghost">Ja tenho conta</a>
              </div>
              <div className="lp-hero-stats">
                <div>
                  <div className="lp-stat-num">100+</div>
                  <div className="lp-stat-label">Filtros de busca</div>
                </div>
                <div>
                  <div className="lp-stat-num">6</div>
                  <div className="lp-stat-label">Etapas de verificacao</div>
                </div>
                <div>
                  <div className="lp-stat-num">0</div>
                  <div className="lp-stat-label">Contas gratuitas</div>
                </div>
              </div>
            </div>

            <div className="lp-hero-phone">
              <div className="lp-phone-glow" />
              <div className="lp-phone">
                <div className="lp-phone-header">
                  <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
                  </span>
                </div>
                {/* Back card */}
                <div style={{ margin: '10px', background: 'var(--bg-card2)', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border)', position: 'absolute', left: 0, right: 0, top: 52, transform: 'scale(0.94)', opacity: 0.4, zIndex: 0 }}>
                  <div style={{ height: '220px', background: nextCard.placeholder }} />
                </div>
                {/* Active card */}
                <div className={`lp-phone-card${swipeDir === 'left' ? ' swiping-left' : swipeDir === 'right' ? ' swiping-right' : swipeDir === 'up' ? ' swiping-up' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
                  {swipeDir === 'left' && <div className="lp-swipe-label" style={{ color: '#F43F5E', borderColor: '#F43F5E' }}>NOPE</div>}
                  {swipeDir === 'right' && <div className="lp-swipe-label" style={{ color: '#2ec4a0', borderColor: '#2ec4a0' }}>CURTIR</div>}
                  {swipeDir === 'up' && <div className="lp-swipe-label" style={{ color: 'var(--gold)', borderColor: 'var(--gold)', transform: 'translate(-50%,-50%) rotate(0deg)' }}>SUPER</div>}
                  <div className="lp-phone-img" style={{ background: card.placeholder }}>
                    <img src={card.photo} alt={card.name} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="lp-v-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      Verificado
                    </div>
                  </div>
                  <div className="lp-phone-info">
                    <div className="lp-phone-name">{card.name}</div>
                    <div className="lp-phone-tags">
                      {card.tags.map(t => <span key={t} className="lp-phone-tag">{t}</span>)}
                    </div>
                  </div>
                  <div className="lp-phone-bio">{card.bio}</div>
                </div>
                <div className="lp-phone-actions">
                  <button className="lp-ph-btn no" onClick={() => handleSwipe('left')} aria-label="Passar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <button className="lp-ph-btn super" onClick={() => handleSwipe('up')} aria-label="Super">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>
                  <button className="lp-ph-btn yes" onClick={() => handleSwipe('right')} aria-label="Curtir">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VALUE PROPOSITIONS ── */}
        <section className="lp-section lp-value">
          {/* Block 1 - Verification */}
          <div className="lp-value-row">
            <div className="lp-value-text">
              <div className="lp-label lp-anim" data-anim="left">Verificacao</div>
              <h3 className="lp-anim" data-anim="left" data-delay="1">Cada rosto aqui<br />e <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>real</em></h3>
              <p className="lp-anim" data-anim="left" data-delay="2">
                Selfie ao vivo com 6 movimentos obrigatorios. Validacao de CPF.
                Banimento permanente por documento. <strong>Nao existe segunda chance para quem quebra as regras.</strong>
              </p>
            </div>
            <div className="lp-value-visual">
              <div className="lp-value-num">01</div>
              <div className="lp-value-icon lp-anim" data-anim="scale">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
            </div>
          </div>

          {/* Block 2 - Filters */}
          <div className="lp-value-row reverse">
            <div className="lp-value-text">
              <div className="lp-label lp-anim" data-anim="right">Filtros</div>
              <h3 className="lp-anim" data-anim="right" data-delay="1">Mais de 100 filtros.<br />Voce <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>decide</em> quem ve</h3>
              <p className="lp-anim" data-anim="right" data-delay="2">
                Cor dos olhos, religiao, estilo de vida, vicios, hobbies, tipo corporal.
                <strong> Incluir quem voce quer. Excluir quem voce nao quer.</strong> Com um toque.
              </p>
            </div>
            <div className="lp-value-visual">
              <div className="lp-value-num">02</div>
              <div className="lp-value-icon lp-anim" data-anim="scale">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </div>
            </div>
          </div>

          {/* Block 3 - Security */}
          <div className="lp-value-row">
            <div className="lp-value-text">
              <div className="lp-label lp-anim" data-anim="left">Seguranca</div>
              <h3 className="lp-anim" data-anim="left" data-delay="1">Construido para<br />voce se sentir <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>seguro(a)</em></h3>
              <p className="lp-anim" data-anim="left" data-delay="2">
                Protecao DDoS, captcha no cadastro, moderacao de fotos por IA,
                botao de emergencia 190 e <strong>1 conta por CPF no Brasil inteiro</strong>.
              </p>
            </div>
            <div className="lp-value-visual">
              <div className="lp-value-num">03</div>
              <div className="lp-value-icon lp-anim" data-anim="scale">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section lp-how" id="como-funciona">
          <div className="lp-section-inner">
            <div className="lp-how-header">
              <div className="lp-label lp-anim">Como funciona</div>
              <h2 className="lp-h2 lp-anim" data-delay="1">Quatro passos. <em>Zero complicacao.</em></h2>
            </div>
            <div className="lp-steps">
              {[
                { n: '1', t: 'Crie sua conta', d: 'E-mail, senha e CPF. Sem redes sociais, sem atalhos.' },
                { n: '2', t: 'Verifique sua identidade', d: 'Selfie ao vivo com 6 movimentos no celular. Leva menos de 1 minuto.' },
                { n: '3', t: 'Monte seu perfil', d: 'Fotos, bio, filtros de aparencia, estilo de vida e intencoes.' },
                { n: '4', t: 'Comece a explorar', d: 'Swipe, filtre, converse. Tudo com pessoas verificadas.' },
              ].map((s, i) => (
                <div key={s.n} className="lp-step lp-anim" data-delay={String(i + 1)}>
                  <div className="lp-step-num">{s.n}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FILTERS SHOWCASE ── */}
        <section className="lp-section lp-filters" id="filtros">
          <div className="lp-section-inner">
            <div className="lp-filters-header">
              <div>
                <div className="lp-label lp-anim">Filtros</div>
                <h2 className="lp-h2 lp-anim" data-delay="1">Busca <em>cirurgica</em></h2>
                <p className="lp-subtitle lp-anim" data-delay="2">
                  Clique para incluir. Clique de novo para excluir. De novo para resetar. Simples assim.
                </p>
              </div>
              <div className="lp-anim" data-anim="right" data-delay="2" style={{ textAlign: 'right' }}>
                <div className="lp-filter-counter">100<span>+</span></div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>filtros de busca em 26 categorias</p>
              </div>
            </div>
            <div className="lp-filter-demo lp-anim" data-anim="blur" data-delay="3">
              {[
                'Vegano(a)', 'Nao fuma', 'Gamer', 'Tem filhos', 'Nao quer filhos',
                'Evangélico(a)', 'Ateu / Ateia', 'Introvertido(a)', 'Faz academia',
                'Trabalho remoto', 'Possuo tatuagem', 'Curto anime', 'Sertanejo',
                'Relacionamento sério', 'Casual', 'K-pop', 'Olhos verdes',
                'Cabelo crespo', 'Heterossexual', 'Bissexual',
              ].map(tag => (
                <span
                  key={tag}
                  className="lp-ftag neu"
                  onClick={(e) => {
                    const el = e.currentTarget
                    if (el.classList.contains('neu')) { el.classList.remove('neu'); el.classList.add('inc') }
                    else if (el.classList.contains('inc')) { el.classList.remove('inc'); el.classList.add('exc') }
                    else { el.classList.remove('exc'); el.classList.add('neu') }
                  }}
                >{tag}</span>
              ))}
            </div>
            <p className="lp-filter-hint lp-anim" data-delay="4" style={{ marginTop: '20px', textAlign: 'center' }}>
              Verde = incluir &middot; Vermelho = excluir &middot; Cinza = neutro
            </p>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section lp-testi">
          <div className="lp-section-inner">
            <div className="lp-testi-header">
              <div className="lp-label lp-anim">Depoimentos</div>
              <h2 className="lp-h2 lp-anim" data-delay="1">Quem usa, <em>recomenda</em></h2>
            </div>
            <div className="lp-testi-grid">
              <div className="lp-testi-card featured lp-anim" data-anim="scale">
                <div className="lp-testi-featured-quote">&ldquo;</div>
                <div>
                  <p className="lp-testi-text" style={{ fontSize: '18px' }}>
                    Pela primeira vez nao precisei ficar desconfiada se o cara era real.
                    A verificacao muda completamente a experiencia. Encontrei meu namorado
                    aqui em 3 semanas.
                  </p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">C</div>
                    <div>
                      <div className="lp-testi-name">Camila, 29</div>
                      <div className="lp-testi-role">Sao Paulo, SP</div>
                    </div>
                  </div>
                </div>
              </div>
              {[
                { text: 'Os filtros sao absurdos. Eu filtrei por religiao, estilo de vida e cidade e so apareceu gente que fazia sentido. Nunca vi isso em outro app.', name: 'Rafael, 34', city: 'Curitiba, PR', initial: 'R' },
                { text: 'Pago R$10 por mes e a qualidade dos perfis e incomparavel com qualquer app gratuito. Aqui todo mundo leva a serio.', name: 'Juliana, 26', city: 'Belo Horizonte, MG', initial: 'J' },
              ].map((t, i) => (
                <div key={i} className="lp-testi-card lp-anim" data-delay={String(i + 2)}>
                  <div className="lp-testi-quote">&ldquo;</div>
                  <p className="lp-testi-text" style={{ paddingTop: '24px' }}>{t.text}</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">{t.initial}</div>
                    <div>
                      <div className="lp-testi-name">{t.name}</div>
                      <div className="lp-testi-role">{t.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section className="lp-section lp-plans" id="planos">
          <div className="lp-section-inner">
            <div className="lp-plans-header">
              <div className="lp-label lp-anim">Planos</div>
              <h2 className="lp-h2 lp-anim" data-delay="1">Sem conta gratuita. <em>Por design.</em></h2>
              <p className="lp-subtitle lp-anim" data-delay="2" style={{ margin: '0 auto' }}>Quem paga para estar aqui tem outro nivel de intencao.</p>
            </div>
            <div className="lp-plan-grid">
              {/* Essencial */}
              <div className="lp-plan-card lp-anim" data-delay="1">
                <div className="lp-plan-name">Essencial</div>
                <div className="lp-plan-price"><sup>R$</sup>10</div>
                <div className="lp-plan-period">por mes</div>
                <ul className="lp-plan-feats">
                  <li>Ate 10 fotos</li>
                  <li>5 curtidas por dia</li>
                  <li>1 SuperCurtida por dia</li>
                  <li>1 ticket de roleta por dia</li>
                  <li>1 hora de videochamada</li>
                  <li>1 filtro ativo por vez</li>
                </ul>
                <a href="https://cakto.com.br/cip6fy9_797209" className="lp-plan-btn outline">Assinar Essencial</a>
              </div>
              {/* Plus */}
              <div className="lp-plan-card mid lp-anim" data-delay="2">
                <div className="lp-plan-badge" style={{ background: 'var(--accent-grad)', color: '#fff' }}>Melhor custo-beneficio</div>
                <div className="lp-plan-name">Plus</div>
                <div className="lp-plan-price"><sup>R$</sup>39</div>
                <div className="lp-plan-period">por mes</div>
                <ul className="lp-plan-feats">
                  <li>Tudo do Essencial</li>
                  <li>30 curtidas por dia</li>
                  <li>4 SuperCurtidas por dia</li>
                  <li>Ver quem curtiu voce</li>
                  <li>Desfazer curtida (1/dia)</li>
                  <li>Filtros acumulados</li>
                  <li>5h de videochamada</li>
                </ul>
                <a href="https://cakto.com.br/3arwn9f" className="lp-plan-btn accent">Assinar Plus</a>
              </div>
              {/* Black */}
              <div className="lp-plan-card vip lp-anim" data-delay="3">
                <div className="lp-plan-badge" style={{ background: 'var(--gold)', color: '#fff' }}>Exclusivo</div>
                <div className="lp-plan-name" style={{ color: 'var(--gold)' }}>Camarote Black</div>
                <div className="lp-plan-price"><sup>R$</sup>100</div>
                <div className="lp-plan-period">por mes</div>
                <ul className="lp-plan-feats">
                  <li className="gold">Tudo do Plus</li>
                  <li className="gold">Curtidas ilimitadas</li>
                  <li className="gold">10 SuperCurtidas por dia</li>
                  <li className="gold">Area Backstage exclusiva</li>
                  <li className="gold">10h de videochamada</li>
                  <li className="gold">Suporte prioritario 24h</li>
                  <li className="gold">2 lupas por dia</li>
                </ul>
                <a href="https://cakto.com.br/hftqkrj" className="lp-plan-btn gold">Assinar Black</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECURITY ── */}
        <section className="lp-section lp-security">
          <div className="lp-section-inner lp-security-inner">
            <div className="lp-label lp-anim">Seguranca</div>
            <h2 className="lp-h2 lp-anim" data-delay="1">10 camadas de <em>protecao</em></h2>
            <div className="lp-security-grid">
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t: 'Cloudflare WAF', d: 'DDoS, bots e scraping bloqueados na borda.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, t: '1 conta por CPF', d: 'Banimento permanente por documento.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, t: 'Liveness detection', d: '6 movimentos obrigatorios na selfie.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, t: 'Row Level Security', d: 'Cada usuario ve so seus dados.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, t: 'Moderacao de fotos', d: 'IA bloqueia nudez e conteudo improprio.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>, t: 'Botao de emergencia', d: 'Disca 190 com um toque no app.' },
              ].map((item, i) => (
                <div key={i} className="lp-security-item lp-anim" data-delay={String((i % 4) + 1)}>
                  <div className="lp-security-icon">{item.icon}</div>
                  <div>
                    <strong>{item.t}</strong>
                    <p>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section lp-faq" id="faq">
          <div className="lp-section-inner">
            <div className="lp-faq-layout">
              <div>
                <div className="lp-label lp-anim">FAQ</div>
                <h2 className="lp-h2 lp-anim" data-delay="1">Perguntas<br /><em>frequentes</em></h2>
                <p className="lp-subtitle lp-anim" data-delay="2">
                  Nao encontrou o que procura?{' '}
                  <a href="/ajuda" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Visite a Central de Ajuda</a>
                </p>
              </div>
              <div className="lp-faq-list lp-anim" data-delay="2">
                {faqItems.map((item, i) => (
                  <FaqItem key={i} pergunta={item.q} resposta={item.a} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="lp-cta">
          <h2 className="lp-anim">
            Sua pessoa real<br />esta <em>esperando</em>
          </h2>
          <p className="lp-anim" data-delay="1">A partir de R$10/mes. Cancele quando quiser.</p>
          <div className="lp-anim" data-delay="2">
            <a href="/cadastro" className="lp-btn-main" style={{ fontSize: '16px', padding: '18px 44px' }}>
              Criar minha conta
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          {(installPrompt && !installDone) && (
            <button onClick={handleInstall} style={{
              marginTop: '24px', background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '12px 28px', borderRadius: '100px',
              fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif',
            }}>
              Instalar app no celular
            </button>
          )}
          {installDone && <p style={{ marginTop: '20px', color: '#4ade80', fontSize: '14px' }}>App instalado com sucesso!</p>}
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-top">
              <div>
                <a href="#" className="lp-logo" style={{ fontSize: '28px' }}>MeAnd<span>You</span></a>
                <p className="lp-footer-brand">
                  App de relacionamentos brasileiro com verificacao real de identidade
                  e os filtros mais completos do Brasil.
                </p>
              </div>
              <div>
                <h4>Produto</h4>
                <a href="#como-funciona">Como funciona</a>
                <a href="#filtros">Filtros</a>
                <a href="#planos">Planos</a>
                <a href="/ajuda">Central de Ajuda</a>
              </div>
              <div>
                <h4>Legal</h4>
                <a href="/termos">Termos de Uso</a>
                <a href="/privacidade">Politica de Privacidade</a>
                <a href="/deletar-conta">Excluir minha conta</a>
              </div>
              <div>
                <h4>Contato</h4>
                <a href="/suporte">Suporte</a>
                <a href="/fale-conosco">Fale conosco</a>
                <a href="mailto:adminmeandyou@proton.me">adminmeandyou@proton.me</a>
              </div>
            </div>

            {/* Contact form */}
            <div className="lp-footer-contact">
              <h4 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--text-dim)', marginBottom: '16px' }}>Envie uma mensagem</h4>
              {contatoEnviado ? (
                <p style={{ color: '#4ade80', fontSize: '14px' }}>Mensagem enviada com sucesso!</p>
              ) : (
                <form className="lp-contact-form" onSubmit={handleContatoSubmit}>
                  <input type="text" placeholder="Seu nome" value={contatoNome} onChange={e => setContatoNome(e.target.value)} />
                  <input type="email" placeholder="Seu e-mail" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} />
                  <select value={contatoAssunto} onChange={e => setContatoAssunto(e.target.value)}>
                    <option value="">Assunto</option>
                    <option value="Duvida">Duvida</option>
                    <option value="Sugestao">Sugestao</option>
                    <option value="Problema">Problema</option>
                    <option value="Parceria">Parceria</option>
                  </select>
                  <button type="submit" className="lp-contact-btn" disabled={contatoEnviando}>
                    {contatoEnviando ? 'Enviando...' : 'Enviar'}
                  </button>
                  {contatoErro && <p style={{ gridColumn: '1 / -1', color: '#F43F5E', fontSize: '13px' }}>{contatoErro}</p>}
                </form>
              )}
            </div>

            <div className="lp-footer-bottom">
              <span className="lp-footer-copy">&copy; {new Date().getFullYear()} MeAndYou. Todos os direitos reservados.</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>CNPJ em registro</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

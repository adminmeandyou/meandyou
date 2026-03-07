'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', color: 'var(--text)' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>
      </div>
    )
  }

  // Não logado → Landing page completa
  return (
    <>
      <style>{`
        :root {
          --lp-bg: #f8faf9;
          --lp-white: #ffffff;
          --lp-accent: #2ec4a0;
          --lp-accent-dark: #1fa082;
          --lp-accent-light: #e6f7f3;
          --lp-text: #111a17;
          --lp-muted: #7a9189;
          --lp-border: #e0ece8;
          --lp-shadow: 0 4px 24px rgba(46,196,160,0.12);
          --lp-red: #e84545;
          --lp-gold: #d4a017;
        }
        .lp * { box-sizing:border-box; }
        .lp { background:var(--lp-bg); color:var(--lp-text); font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; line-height:1.6; overflow-x:hidden; }
        .lp-nav { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; justify-content:space-between; padding:18px 56px; background:rgba(248,250,249,0.96); backdrop-filter:blur(16px); border-bottom:1px solid var(--lp-border); }
        .lp-logo { font-family:'Fraunces',serif; font-weight:700; font-size:24px; color:var(--lp-text); letter-spacing:-0.5px; text-decoration:none; }
        .lp-logo span { color:var(--lp-accent); }
        .lp-nav ul { display:flex; gap:28px; list-style:none; margin:0; padding:0; }
        .lp-nav ul a { color:var(--lp-muted); text-decoration:none; font-size:14px; font-weight:500; }
        .lp-nav-cta { background:var(--lp-accent) !important; color:#fff !important; padding:10px 22px; border-radius:100px; font-weight:600 !important; }
        @keyframes lp-fadeUp { from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);} }
        @keyframes lp-float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
        .lp-hero { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:60px; padding:140px 56px 100px; max-width:1200px; margin:0 auto; }
        .lp-badge { display:inline-flex; align-items:center; gap:8px; background:var(--lp-accent-light); border:1px solid rgba(46,196,160,.3); color:var(--lp-accent-dark); padding:6px 16px; border-radius:100px; font-size:13px; font-weight:600; margin-bottom:28px; animation:lp-fadeUp .5s ease both; }
        .lp-badge-dot { width:8px; height:8px; border-radius:50%; background:var(--lp-accent); }
        .lp-hero h1 { font-family:'Fraunces',serif; font-size:clamp(42px,5vw,72px); font-weight:700; line-height:1.08; letter-spacing:-2px; margin-bottom:24px; animation:lp-fadeUp .5s .1s ease both; }
        .lp-hero h1 em { font-style:italic; color:var(--lp-accent); }
        .lp-hero-sub { font-size:18px; color:var(--lp-muted); max-width:460px; margin-bottom:40px; line-height:1.7; animation:lp-fadeUp .5s .2s ease both; }
        .lp-hero-sub strong { color:var(--lp-text); font-weight:600; }
        .lp-actions { display:flex; gap:14px; flex-wrap:wrap; animation:lp-fadeUp .5s .3s ease both; }
        .lp-btn-main { background:var(--lp-accent); color:#fff; padding:16px 36px; border-radius:100px; font-weight:700; font-size:16px; text-decoration:none; display:inline-flex; align-items:center; gap:10px; box-shadow:0 8px 32px rgba(46,196,160,.35); }
        .lp-btn-outline { background:transparent; color:var(--lp-text); padding:16px 32px; border-radius:100px; font-weight:600; font-size:15px; text-decoration:none; border:2px solid var(--lp-border); display:inline-flex; align-items:center; gap:8px; }
        .lp-stats { display:flex; gap:36px; margin-top:48px; animation:lp-fadeUp .5s .4s ease both; }
        .lp-stat-val { font-family:'Fraunces',serif; font-size:30px; font-weight:700; line-height:1; }
        .lp-stat-label { font-size:12px; color:var(--lp-muted); margin-top:3px; }
        .lp-stat-div { width:1px; background:var(--lp-border); }
        .lp-phone-wrap { position:relative; z-index:2; }
        .lp-phone { width:268px; height:530px; background:var(--lp-white); border-radius:38px; box-shadow:0 32px 80px rgba(0,0,0,.12), 0 0 0 1px var(--lp-border); overflow:hidden; animation:lp-float 5s ease-in-out infinite; }
        .lp-phone-header { background:var(--lp-accent); padding:42px 20px 16px; text-align:center; color:#fff; }
        .lp-phone-logo { font-family:'Fraunces',serif; font-size:19px; font-weight:700; }
        .lp-phone-card { margin:12px; background:var(--lp-bg); border-radius:18px; overflow:hidden; }
        .lp-phone-img { height:196px; background:linear-gradient(135deg,#e8f5f2,#c8ede4,#a8e0d4); display:flex; align-items:center; justify-content:center; font-size:64px; position:relative; }
        .lp-v-badge { position:absolute; top:10px; right:10px; background:var(--lp-accent); color:#fff; border-radius:100px; padding:3px 10px; font-size:10px; font-weight:700; }
        .lp-phone-info { padding:10px 14px 12px; }
        .lp-phone-name { font-family:'Fraunces',serif; font-size:17px; font-weight:700; }
        .lp-phone-tags { display:flex; gap:4px; flex-wrap:wrap; margin-top:5px; }
        .lp-phone-tag { background:var(--lp-accent-light); color:var(--lp-accent-dark); border-radius:100px; padding:2px 8px; font-size:10px; font-weight:600; }
        .lp-phone-actions { display:flex; justify-content:center; gap:14px; padding:10px 16px 14px; }
        .lp-ph-btn { width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; border:none; cursor:pointer; }
        .lp-ph-btn.no { background:#fff0f0; color:#e84545; }
        .lp-ph-btn.super { background:#fffbee; color:#d4a017; }
        .lp-ph-btn.yes { background:var(--lp-accent-light); color:var(--lp-accent-dark); }
        .lp-hero-right { position:relative; height:580px; display:flex; align-items:center; justify-content:center; }
        .lp-fc { position:absolute; background:var(--lp-white); border-radius:100px; padding:8px 16px; font-size:12px; font-weight:600; box-shadow:0 6px 20px rgba(0,0,0,.1); border:1px solid var(--lp-border); white-space:nowrap; color:var(--lp-text); z-index:10; }
        .lp-fc1 { top:40px; left:0; }
        .lp-fc2 { top:260px; right:-10px; }
        .lp-fc3 { bottom:60px; left:10px; }
        .lp-section-label { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--lp-accent); margin-bottom:12px; }
        .lp-section-title { font-family:'Fraunces',serif; font-size:clamp(28px,4vw,50px); font-weight:700; letter-spacing:-1.5px; line-height:1.1; margin-bottom:16px; }
        .lp-problem { padding:100px 56px; background:var(--lp-text); color:#fff; }
        .lp-problem-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        .lp-problem h2 { font-family:'Fraunces',serif; font-size:clamp(28px,4vw,46px); font-weight:700; letter-spacing:-1.5px; line-height:1.1; margin-bottom:20px; }
        .lp-problem h2 em { color:var(--lp-accent); font-style:italic; }
        .lp-prob-list { display:flex; flex-direction:column; gap:12px; }
        .lp-prob-item { display:flex; align-items:flex-start; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:18px 20px; }
        .lp-prob-num { width:30px; height:30px; border-radius:50%; background:rgba(46,196,160,.15); border:1px solid rgba(46,196,160,.3); color:var(--lp-accent); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0; }
        .lp-prob-item h4 { font-size:14px; font-weight:700; margin-bottom:3px; color:#fff; }
        .lp-prob-item p { font-size:12px; color:rgba(255,255,255,.45); line-height:1.5; margin:0; }
        .lp-verification { padding:100px 56px; background:var(--lp-accent-light); }
        .lp-verification-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        .lp-verify-steps { display:flex; flex-direction:column; gap:14px; }
        .lp-verify-step { display:flex; align-items:flex-start; gap:18px; background:var(--lp-white); border-radius:18px; padding:20px 22px; }
        .lp-vstep-num { width:38px; height:38px; border-radius:50%; background:var(--lp-accent); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Fraunces',serif; font-size:17px; font-weight:700; flex-shrink:0; }
        .lp-verify-step h4 { font-size:14px; font-weight:700; margin-bottom:3px; }
        .lp-verify-step p { font-size:12px; color:var(--lp-muted); line-height:1.5; margin:0; }
        .lp-how { padding:100px 56px; max-width:1100px; margin:0 auto; text-align:center; }
        .lp-steps-row { display:grid; grid-template-columns:repeat(4,1fr); gap:28px; margin-top:60px; position:relative; }
        .lp-steps-row::before { content:''; position:absolute; top:35px; left:12%; right:12%; height:2px; background:linear-gradient(90deg,var(--lp-accent),var(--lp-accent-light)); }
        .lp-how-step { position:relative; z-index:1; }
        .lp-step-icon { width:70px; height:70px; border-radius:50%; background:var(--lp-white); border:2px solid var(--lp-accent); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
        .lp-step-icon svg { width:28px; height:28px; color:var(--lp-accent); }
        .lp-how-step h3 { font-family:'Fraunces',serif; font-size:17px; font-weight:700; margin-bottom:6px; }
        .lp-how-step p { font-size:13px; color:var(--lp-muted); line-height:1.6; margin:0; }
        .lp-pricing { padding:100px 56px; background:var(--lp-bg); }
        .lp-pricing-inner { max-width:1100px; margin:0 auto; text-align:center; }
        .lp-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:60px; }
        .lp-card { background:var(--lp-white); border:2px solid var(--lp-border); border-radius:26px; padding:36px 28px; text-align:left; position:relative; }
        .lp-card.mid { border-color:var(--lp-accent); background:linear-gradient(160deg,#fff 55%,var(--lp-accent-light)); }
        .lp-card.vip { border-color:var(--lp-gold); background:linear-gradient(160deg,#fff 55%,#fdf8ec); }
        .lp-feat-badge { position:absolute; top:-13px; left:50%; transform:translateX(-50%); font-size:10px; font-weight:700; padding:4px 18px; border-radius:100px; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; }
        .lp-feat-badge.green { background:var(--lp-accent); color:#fff; }
        .lp-feat-badge.gold { background:var(--lp-gold); color:#fff; }
        .lp-plan-name { font-family:'Fraunces',serif; font-size:26px; font-weight:700; margin-bottom:4px; }
        .lp-plan-area { font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--lp-muted); margin-bottom:14px; }
        .lp-plan-price { font-family:'Fraunces',serif; font-size:50px; font-weight:700; letter-spacing:-2px; line-height:1; margin-bottom:2px; }
        .lp-plan-price sup { font-size:20px; vertical-align:top; margin-top:10px; display:inline-block; }
        .lp-plan-period { font-size:12px; color:var(--lp-muted); margin-bottom:24px; }
        .lp-plan-desc { font-size:13px; color:var(--lp-muted); margin-bottom:20px; line-height:1.5; padding-bottom:20px; border-bottom:1px solid var(--lp-border); }
        .lp-feats { list-style:none; margin-bottom:24px; padding:0; }
        .lp-feats li { font-size:13px; color:var(--lp-muted); padding:7px 0; border-bottom:1px solid var(--lp-border); display:flex; align-items:flex-start; gap:8px; }
        .lp-feats li:last-child { border-bottom:none; }
        .lp-feats li::before { content:'✓'; color:var(--lp-accent); font-weight:700; flex-shrink:0; }
        .lp-feats li.off::before { content:'✕'; color:#ccc; }
        .lp-feats li.off { opacity:.5; }
        .lp-feats li.gold-check::before { color:var(--lp-gold); }
        .lp-btn-price { display:block; text-align:center; padding:13px; border-radius:100px; font-weight:700; font-size:14px; text-decoration:none; }
        .lp-btn-outline-p { border:2px solid var(--lp-border); color:var(--lp-text); }
        .lp-btn-green { background:var(--lp-accent); color:#fff; }
        .lp-btn-gold { background:var(--lp-gold); color:#fff; }
        .lp-faq { padding:100px 56px; background:var(--lp-bg); }
        .lp-faq-inner { max-width:780px; margin:0 auto; text-align:center; }
        .lp-faq-list { margin-top:56px; text-align:left; }
        .lp-faq-item { border-bottom:1px solid var(--lp-border); padding:20px 0; }
        .lp-faq-q { font-weight:700; font-size:15px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:16px; user-select:none; }
        .lp-faq-arr { width:26px; height:26px; border-radius:50%; background:var(--lp-accent-light); color:var(--lp-accent-dark); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; transition:transform .3s; font-weight:700; }
        .lp-faq-a { font-size:14px; color:var(--lp-muted); line-height:1.7; max-height:0; overflow:hidden; transition:max-height .35s ease, margin-top .3s; }
        .lp-faq-item.open .lp-faq-a { max-height:300px; margin-top:12px; }
        .lp-faq-item.open .lp-faq-arr { transform:rotate(45deg); }
        .lp-safety { padding:80px 56px; background:var(--lp-text); color:#fff; }
        .lp-safety-inner { max-width:1100px; margin:0 auto; }
        .lp-safety h2 { font-family:'Fraunces',serif; font-size:clamp(24px,3vw,38px); font-weight:700; letter-spacing:-1px; margin-bottom:36px; }
        .lp-safety h2 em { color:var(--lp-accent); font-style:italic; }
        .lp-safety-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .lp-safety-item { display:flex; align-items:flex-start; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:18px; }
        .lp-safety-item p { font-size:13px; color:rgba(255,255,255,.6); line-height:1.55; margin:0; }
        .lp-safety-item strong { color:#fff; display:block; margin-bottom:3px; font-size:13px; }
        .lp-cta { padding:110px 56px; background:var(--lp-accent); text-align:center; }
        .lp-cta h2 { font-family:'Fraunces',serif; font-size:clamp(34px,5vw,64px); font-weight:700; letter-spacing:-2px; color:#fff; margin-bottom:18px; line-height:1.1; }
        .lp-cta p { color:rgba(255,255,255,.8); font-size:17px; margin-bottom:44px; }
        .lp-btn-cta-white { background:#fff; color:var(--lp-accent-dark); padding:17px 46px; border-radius:100px; font-weight:700; font-size:16px; text-decoration:none; display:inline-flex; align-items:center; gap:10px; }
        .lp-cta-note { color:rgba(255,255,255,.55); font-size:13px; margin-top:18px; }
        .lp-footer { background:#0c1410; color:rgba(255,255,255,.45); }
        .lp-footer-top { max-width:1100px; margin:0 auto; padding:60px 56px 40px; display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:48px; }
        .lp-footer-logo { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:#fff; margin-bottom:12px; display:block; text-decoration:none; }
        .lp-footer-logo span { color:var(--lp-accent); }
        .lp-footer-col h4 { font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.7); margin-bottom:16px; }
        .lp-footer-col a { display:block; font-size:13px; color:rgba(255,255,255,.4); text-decoration:none; margin-bottom:10px; }
        .lp-footer-bottom { border-top:1px solid rgba(255,255,255,.07); padding:24px 56px; max-width:1100px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
        .lp-footer-bottom p { font-size:12px; margin:0; }
        .lp-footer-bottom-links { display:flex; gap:20px; }
        .lp-footer-bottom-links a { font-size:12px; color:rgba(255,255,255,.3); text-decoration:none; }
        @media(max-width:960px){
          .lp-nav { padding:16px 20px; }
          .lp-nav ul { display:none; }
          .lp-hero { grid-template-columns:1fr; padding:100px 24px 60px; }
          .lp-hero-right { display:none; }
          .lp-problem-inner,.lp-verification-inner { grid-template-columns:1fr; gap:40px; }
          .lp-steps-row { grid-template-columns:repeat(2,1fr); }
          .lp-steps-row::before { display:none; }
          .lp-cards { grid-template-columns:1fr; max-width:420px; margin-left:auto; margin-right:auto; }
          .lp-safety-grid { grid-template-columns:repeat(2,1fr); }
          .lp-problem,.lp-verification,.lp-pricing,.lp-faq,.lp-safety,.lp-cta { padding:72px 24px; }
          .lp-footer-top { grid-template-columns:1fr 1fr; padding:48px 24px; gap:32px; }
          .lp-footer-bottom { padding:20px 24px; flex-direction:column; text-align:center; }
        }
        @media(max-width:600px){
          .lp-hero { padding:90px 20px 48px; }
          .lp-hero h1 { font-size:38px; }
          .lp-actions { flex-direction:column; }
          .lp-btn-main,.lp-btn-outline { width:100%; justify-content:center; }
          .lp-steps-row { grid-template-columns:1fr; }
          .lp-safety-grid { grid-template-columns:1fr 1fr; }
          .lp-cards { grid-template-columns:1fr; max-width:100%; }
          .lp-footer-top { grid-template-columns:1fr; }
          .lp-how { padding:64px 20px; }
          .lp-faq { padding:64px 20px; }
        }
      `}</style>

      <div className="lp">
        <nav className="lp-nav">
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul>
            <li><a href="#verificacao">Verificação</a></li>
            <li><a href="#precos">Planos</a></li>
            <li><a href="#seguranca">Segurança</a></li>
            <li><a href="/cadastro" className="lp-nav-cta">Começar agora</a></li>
          </ul>
        </nav>

        <section>
          <div className="lp-hero">
            <div>
              <div className="lp-badge"><span className="lp-badge-dot"></span>Verificação real de identidade · Filtros que importam</div>
              <h1>Encontre alguém <em>de verdade.</em></h1>
              <p className="lp-hero-sub">O app de relacionamentos com <strong>verificação rigorosa</strong> e os filtros mais completos do Brasil.</p>
              <div className="lp-actions">
                <a href="/cadastro" className="lp-btn-main">💚 Começar agora</a>
                <a href="#como-funciona" className="lp-btn-outline">Como funciona →</a>
              </div>
              <div className="lp-stats">
                <div><div className="lp-stat-val">100%</div><div className="lp-stat-label">Perfis verificados</div></div>
                <div className="lp-stat-div"></div>
                <div><div className="lp-stat-val">50+</div><div className="lp-stat-label">Filtros disponíveis</div></div>
                <div className="lp-stat-div"></div>
                <div><div className="lp-stat-val">Anti-golpe</div><div className="lp-stat-label">Sistema ativo 24h</div></div>
              </div>
            </div>
            <div className="lp-hero-right">
              <div className="lp-fc lp-fc1">🖤 Gótica · Verificada</div>
              <div className="lp-fc lp-fc2">🎮 Gamer · São Paulo</div>
              <div className="lp-fc lp-fc3">✝️ Evangélica · MG</div>
              <div className="lp-phone-wrap">
                <div className="lp-phone">
                  <div className="lp-phone-header">
                    <div className="lp-phone-logo">MeAndYou</div>
                    <div style={{fontSize:'10px',opacity:0.8,marginTop:'2px'}}>Conexões reais</div>
                  </div>
                  <div className="lp-phone-card">
                    <div className="lp-phone-img">👩<div className="lp-v-badge">✓ Verificada</div></div>
                    <div className="lp-phone-info">
                      <div className="lp-phone-name">Julia, 26</div>
                      <div className="lp-phone-tags">
                        <span className="lp-phone-tag">🎮 Gamer</span>
                        <span className="lp-phone-tag">🌿 Vegana</span>
                        <span className="lp-phone-tag">SP</span>
                      </div>
                    </div>
                  </div>
                  <div className="lp-phone-actions">
                    <button className="lp-ph-btn no">✕</button>
                    <button className="lp-ph-btn super">★</button>
                    <button className="lp-ph-btn yes">♥</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-problem">
          <div className="lp-problem-inner">
            <div>
              <p className="lp-section-label" style={{color:'var(--lp-accent)'}}>O problema</p>
              <h2>Os apps antigos viraram um <em>caos.</em></h2>
              <p style={{color:'rgba(255,255,255,.55)',fontSize:'16px',lineHeight:1.7}}>Perfis falsos, vendedores de conteúdo e golpistas tomaram conta.</p>
            </div>
            <div className="lp-prob-list">
              {[
                {n:'01',t:'Perfis falsos e bots',d:'A maioria dos matches é com conta falsa ou alguém querendo vender conteúdo.'},
                {n:'02',t:'Ninguém é quem diz ser',d:'Foto antiga, idade errada, intenções escondidas.'},
                {n:'03',t:'Filtros que não filtram nada',d:'Idade e distância não resolvem. O que importa fica invisível.'},
                {n:'04',t:'Golpes e abordagens indesejadas',d:'Plataformas sem verificação viram terreno fértil para comportamento abusivo.'},
              ].map((item) => (
                <div key={item.n} className="lp-prob-item">
                  <div className="lp-prob-num">{item.n}</div>
                  <div><h4>{item.t}</h4><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-verification" id="verificacao">
          <div className="lp-verification-inner">
            <div>
              <p className="lp-section-label">Verificação rigorosa</p>
              <h2 className="lp-section-title">Só entra quem é <span style={{color:'var(--lp-accent-dark)'}}>real.</span></h2>
              <p style={{color:'var(--lp-muted)',fontSize:'16px',marginTop:'14px'}}>Desenvolvemos o processo de verificação mais rigoroso do mercado.</p>
            </div>
            <div className="lp-verify-steps">
              {[
                {n:'1',t:'Selfie ao vivo',d:'Foto em tempo real comparada com o documento.'},
                {n:'2',t:'Documento de identidade',d:'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.'},
                {n:'3',t:'Validação de CPF',d:'Checagem na base da Receita Federal.'},
                {n:'4',t:'Monitoramento contínuo',d:'Algoritmo anti-fraude ativo. Denúncias respondidas em até 24h.'},
              ].map((item) => (
                <div key={item.n} className="lp-verify-step">
                  <div className="lp-vstep-num">{item.n}</div>
                  <div><h4>{item.t}</h4><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-how" id="como-funciona">
          <p className="lp-section-label">Como funciona</p>
          <h2 className="lp-section-title">Em minutos você já tem matches reais.</h2>
          <div className="lp-steps-row">
            {[
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, t:'Escolha seu plano', d:'A partir de R$10/mês. Sem conta gratuita.'},
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, t:'Verifique sua identidade', d:'Selfie ao vivo + documento. Menos de 3 minutos.'},
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>, t:'Configure seus filtros', d:'Inclua e exclua como quiser. 50+ opções.'},
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, t:'Dê match e conecte', d:'Só pessoas reais, com intenções compatíveis.'},
            ].map((step, i) => (
              <div key={i} className="lp-how-step">
                <div className="lp-step-icon">{step.icon}</div>
                <h3>{step.t}</h3><p>{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-pricing" id="precos">
          <div className="lp-pricing-inner">
            <p className="lp-section-label">Planos</p>
            <h2 className="lp-section-title">Sem conta gratuita.<br/><em style={{fontStyle:'italic',color:'var(--lp-accent)'}}>Mais seriedade.</em></h2>
            <div className="lp-cards">
              <div className="lp-card">
                <p className="lp-plan-name">Essencial</p><p className="lp-plan-area">Pista</p>
                <div className="lp-plan-price"><sup>R$</sup>10</div><p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">O ponto de entrada para quem quer explorar com segurança.</p>
                <ul className="lp-feats">
                  <li>Verificação de identidade</li><li>5 curtidas por dia</li><li>1 filtro ativo</li>
                  <li className="off">Filtros acumulados</li><li className="off">Ver quem curtiu você</li><li className="off">Desfazer curtida</li>
                </ul>
                <a href="/cadastro" className="lp-btn-price lp-btn-outline-p">Assinar Essencial</a>
              </div>
              <div className="lp-card mid">
                <span className="lp-feat-badge green">Mais popular</span>
                <p className="lp-plan-name">Plus</p><p className="lp-plan-area">Área VIP</p>
                <div className="lp-plan-price"><sup>R$</sup>39</div><p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">A experiência completa com todos os recursos.</p>
                <ul className="lp-feats">
                  <li>30 curtidas por dia</li><li>Todos os filtros acumulados</li><li>Filtro de exclusão</li>
                  <li>Ver quem curtiu você</li><li>Desfazer curtida</li><li>Boost semanal</li>
                  <li className="off">Área exclusiva Camarote</li>
                </ul>
                <a href="/cadastro" className="lp-btn-price lp-btn-green">Assinar Plus</a>
              </div>
              <div className="lp-card vip">
                <span className="lp-feat-badge gold">⭐ Camarote</span>
                <p className="lp-plan-name">Black</p><p className="lp-plan-area">Backstage</p>
                <div className="lp-plan-price"><sup>R$</sup>100</div><p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">Acessa todos os perfis e tem área exclusiva Backstage.</p>
                <ul className="lp-feats">
                  <li className="gold-check">Tudo do Plus</li><li className="gold-check">Curtidas ilimitadas</li>
                  <li className="gold-check">Área exclusiva Backstage</li><li className="gold-check">Destaque máximo</li>
                  <li className="gold-check">SuperLike ilimitado</li><li className="gold-check">Suporte prioritário 24h</li>
                </ul>
                <a href="/cadastro" className="lp-btn-price lp-btn-gold">Assinar Camarote Black</a>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-faq">
          <div className="lp-faq-inner">
            <p className="lp-section-label">Dúvidas</p>
            <h2 className="lp-section-title">Perguntas frequentes</h2>
            <div className="lp-faq-list">
              {[
                {q:'Por que não tem plano gratuito?',a:'Cobrar mesmo que R$10 afasta a maioria dos golpistas. Quem está aqui pagou para estar.'},
                {q:'O que é o plano Camarote Black?',a:'O plano premium com acesso a todos os perfis e área exclusiva Backstage.'},
                {q:'Como funciona o filtro de exclusão?',a:'Clique uma vez para incluir, clique de novo para excluir. Simples assim.'},
                {q:'O que acontece com meus documentos?',a:'Usados somente para verificação e descartados em seguida. Guardamos apenas o resultado.'},
                {q:'Posso cancelar quando quiser?',a:'Sim. Sem fidelidade, sem multa. Cancele direto pelo app a qualquer momento.'},
              ].map((item, i) => (
                <div key={i} className="lp-faq-item">
                  <div className="lp-faq-q" onClick={(e) => (e.currentTarget.parentElement as HTMLElement).classList.toggle('open')}>
                    {item.q}<span className="lp-faq-arr">+</span>
                  </div>
                  <div className="lp-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-safety" id="seguranca">
          <div className="lp-safety-inner">
            <p className="lp-section-label" style={{color:'var(--lp-accent)'}}>Segurança</p>
            <h2>Dicas para se <em>proteger</em> em encontros.</h2>
            <div className="lp-safety-grid">
              {[
                {t:'Marque em local público',d:'Primeiro encontro sempre em café, restaurante ou shopping.'},
                {t:'Avise alguém de confiança',d:'Conte para um amigo onde vai, com quem e a que horas.'},
                {t:'Mantenha o celular carregado',d:'Vá com bateria cheia e tenha um plano caso precise sair.'},
                {t:'Nunca transfira dinheiro',d:'Se alguém pedir PIX antes do encontro: denuncie imediatamente.'},
                {t:'Não compartilhe dados pessoais',d:'Endereço e dados bancários nunca antes de estabelecer confiança.'},
                {t:'Monitoramento de mensagens',d:'Mensagens suspeitas são sinalizadas automaticamente.'},
                {t:'Sem VPN ou proxy',d:'Não permitimos acesso por redes ocultas para sua segurança.'},
                {t:'Em caso de perigo',d:'Use o botão de emergência no app ou ligue para o 190.'},
              ].map((item, i) => (
                <div key={i} className="lp-safety-item">
                  <div><strong>{item.t}</strong><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <h2>Sua pessoa real<br/>está esperando.</h2>
          <p>Verificação real. Filtros completos. Conexões de verdade.</p>
          <a href="/cadastro" className="lp-btn-cta-white">💚 Escolher meu plano</a>
          <p className="lp-cta-note">Cancele quando quiser</p>
        </section>

        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <a href="/" className="lp-footer-logo">MeAnd<span>You</span></a>
              <p style={{fontSize:'13px',lineHeight:1.7}}>O app de relacionamentos com verificação real de identidade e os filtros mais completos do Brasil.</p>
            </div>
            <div className="lp-footer-col">
              <h4>Produto</h4>
              <a href="#verificacao">Verificação</a>
              <a href="#precos">Planos e preços</a>
              <a href="#seguranca">Segurança</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <a href="/termos">Termos de uso</a>
              <a href="/privacidade">Política de privacidade</a>
            </div>
            <div className="lp-footer-col">
              <h4>Conta</h4>
              <a href="/cadastro">Criar conta</a>
              <a href="/login">Entrar</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2025 MeAndYou · Todos os direitos reservados.</p>
            <div className="lp-footer-bottom-links">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
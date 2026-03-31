'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

/* ── Inline SVG Icons ─────────────────────────────────────────────────────── */
const IcCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 16 4 11"/></svg>
)
const IcX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IcShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
const IcArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)
const IcMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
)
const IcZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
)
const IcEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IcLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)
const IcFilter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
)
const IcUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
const IcVideo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
)
const IcGift = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
)

/* ── FAQ Component ────────────────────────────────────────────────────────── */
function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    if (contentRef.current) setHeight(aberto ? contentRef.current.scrollHeight : 0)
  }, [aberto])
  return (
    <div className="faq-item">
      <button className="faq-btn" onClick={() => setAberto(!aberto)}>
        <span>{pergunta}</span>
        <span className={`faq-icon ${aberto ? 'faq-icon--open' : ''}`}>+</span>
      </button>
      <div ref={contentRef} className="faq-body" style={{ maxHeight: `${height}px` }}>
        <p className="faq-answer">{resposta}</p>
      </div>
    </div>
  )
}

/* ── Counter ──────────────────────────────────────────────────────────────── */
function animateCounter(el: HTMLElement, target: number) {
  const start = performance.now()
  const duration = 1800
  const suffix = el.dataset.suffix || ''
  const update = (now: number) => {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (p >= 1 ? suffix : '')
    if (p < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

/* ── CSS ──────────────────────────────────────────────────────────────────── */
const CSS = `
:root {
  --bg: #08090E;
  --bg-card: #0F1117;
  --bg-card2: #13161F;
  --accent: #E11D48;
  --accent-dark: #be123c;
  --accent-soft: rgba(225,29,72,0.10);
  --accent-border: rgba(225,29,72,0.25);
  --gold: #F59E0B;
  --gold-soft: rgba(245,158,11,0.08);
  --gold-border: rgba(245,158,11,0.20);
  --text: #F8F9FA;
  --muted: rgba(248,249,250,0.50);
  --dim: rgba(248,249,250,0.28);
  --border: rgba(255,255,255,0.07);
  --border-soft: rgba(255,255,255,0.04);
  --grad-accent: linear-gradient(135deg,#E11D48 0%,#be123c 100%);
  --font-display: var(--font-fraunces), 'Georgia', serif;
  --font-body: var(--font-jakarta), 'Inter', sans-serif;
  --ease: cubic-bezier(0.4,0,0.2,1);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}

/* ── Keyframes ── */
@keyframes grad-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes float-y{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes glow-pulse{0%,100%{box-shadow:0 0 0 0 rgba(225,29,72,0.35)}50%{box-shadow:0 0 0 18px rgba(225,29,72,0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes reveal-up{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes reveal-left{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
@keyframes reveal-right{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes scale-in{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
@keyframes notif-in{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
@keyframes notif-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(110%)}}
@keyframes orbit{from{transform:rotate(0deg) translateX(60px) rotate(0deg)}to{transform:rotate(360deg) translateX(60px) rotate(-360deg)}}
@keyframes scan{0%{top:8%}100%{top:92%}}

/* ── Scroll Reveal ── */
.lp-anim{opacity:0;transform:translateY(28px);transition:opacity 0.65s var(--ease),transform 0.65s var(--ease)}
.lp-anim.lp-anim--left{transform:translateX(-28px)}
.lp-anim.lp-anim--right{transform:translateX(28px)}
.lp-anim.lp-anim--scale{transform:scale(0.92)}
.lp-anim.lp-visible{opacity:1!important;transform:none!important}
.lp-anim.lp-delay-1{transition-delay:0.08s}
.lp-anim.lp-delay-2{transition-delay:0.16s}
.lp-anim.lp-delay-3{transition-delay:0.24s}
.lp-anim.lp-delay-4{transition-delay:0.32s}
.lp-anim.lp-delay-5{transition-delay:0.40s}

/* ── Base ── */
.lp{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:16px;line-height:1.65;overflow-x:hidden;min-height:100vh}

/* ── Nav ── */
.lp-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:200;display:flex;align-items:center;justify-content:space-between;padding:13px 24px;width:calc(100% - 40px);max-width:1100px;background:rgba(8,9,14,0.82);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;transition:transform 0.35s var(--ease),opacity 0.35s var(--ease)}
.lp-nav--hidden{transform:translateX(-50%) translateY(-90px);opacity:0}
.lp-logo{font-family:var(--font-display);font-weight:700;font-size:21px;color:var(--text);text-decoration:none;letter-spacing:-0.5px}
.lp-logo span{color:var(--accent)}
.lp-nav-links{display:flex;gap:2px;list-style:none;align-items:center}
.lp-nav-links a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;padding:7px 13px;border-radius:8px;transition:color 0.2s,background 0.2s}
.lp-nav-links a:hover{color:var(--text);background:rgba(255,255,255,0.05)}
.lp-nav-cta{background:var(--grad-accent);color:#fff;border:none;padding:9px 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;font-family:var(--font-body);transition:transform 0.2s,box-shadow 0.2s}
.lp-nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(225,29,72,0.4)}
.lp-ham{display:none;background:none;border:none;cursor:pointer;color:var(--text);padding:4px}
.lp-mobile-menu{display:none;position:fixed;inset:0;z-index:190;background:rgba(8,9,14,0.97);backdrop-filter:blur(20px);flex-direction:column;align-items:center;justify-content:center;gap:28px}
.lp-mobile-menu--open{display:flex}
.lp-mobile-menu a,.lp-mobile-menu button{font-size:20px;font-weight:600;color:var(--text);text-decoration:none;background:none;border:none;cursor:pointer;font-family:var(--font-body);padding:8px 0;transition:color 0.2s}
.lp-mobile-menu a:hover{color:var(--accent)}

/* ── Hero ── */
.lp-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:140px 24px 80px;overflow:hidden}
.lp-hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 80% 60% at 50% 20%, rgba(225,29,72,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 80%, rgba(225,29,72,0.07) 0%, transparent 50%), #08090E;background-size:200% 200%;animation:grad-flow 12s ease infinite}
.lp-hero-grid{position:absolute;inset:0;z-index:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 100%)}
.lp-hero-content{position:relative;z-index:2;max-width:780px;margin:0 auto}
.lp-badge{display:inline-flex;align-items:center;gap:7px;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:28px}
.lp-h1{font-family:var(--font-display);font-size:clamp(40px,7vw,80px);font-weight:700;line-height:1.08;letter-spacing:-2px;margin-bottom:22px;color:var(--text)}
.lp-h1 em{color:var(--accent);font-style:normal}
.lp-hero-sub{font-size:clamp(16px,2vw,19px);color:var(--muted);line-height:1.7;max-width:560px;margin:0 auto 40px}
.lp-hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}
.lp-btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--grad-accent);color:#fff;border:none;padding:15px 32px;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer;font-family:var(--font-body);transition:transform 0.2s,box-shadow 0.2s;text-decoration:none;animation:glow-pulse 3s ease-in-out infinite}
.lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(225,29,72,0.45)}
.lp-btn-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);color:var(--text);border:1px solid var(--border);padding:15px 28px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;font-family:var(--font-body);transition:background 0.2s,border-color 0.2s;text-decoration:none}
.lp-btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.15)}
.lp-hero-proof{font-size:13px;color:var(--dim);display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
.lp-hero-proof span{display:flex;align-items:center;gap:5px}
.lp-hero-proof span::before{content:'·';opacity:0.3}
.lp-hero-proof span:first-child::before{display:none}
.lp-founder-callout{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.04));border:1px solid var(--gold-border);border-radius:12px;padding:12px 20px;margin-top:28px;max-width:480px;text-align:left}
.lp-founder-callout-icon{font-size:22px;flex-shrink:0}
.lp-founder-callout-text{font-size:13px;color:rgba(248,249,250,0.70);line-height:1.5}
.lp-founder-callout-text strong{color:var(--gold);font-weight:600}

/* ── Stats Bar ── */
.lp-stats{padding:48px 24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.lp-stats-inner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center}
.lp-stat-num{font-family:var(--font-display);font-size:clamp(28px,4vw,44px);font-weight:700;color:var(--text);letter-spacing:-1px;line-height:1}
.lp-stat-label{font-size:13px;color:var(--muted);margin-top:6px}

/* ── Section layout ── */
.lp-section{padding:100px 24px;position:relative}
.lp-section--dark{background:rgba(15,17,23,0.6)}
.lp-section-inner{max-width:1100px;margin:0 auto}
.lp-section-label{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:16px}
.lp-section-title{font-family:var(--font-display);font-size:clamp(28px,4vw,48px);font-weight:700;letter-spacing:-1.5px;line-height:1.15;margin-bottom:16px;color:var(--text)}
.lp-section-sub{font-size:clamp(15px,1.8vw,18px);color:var(--muted);max-width:560px;line-height:1.7;margin-bottom:56px}

/* ── Profile Cards (Diversidade) ── */
.lp-profiles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lp-profile-card{background:linear-gradient(180deg,rgba(19,22,31,0.95) 0%,rgba(15,17,23,0.98) 100%);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:transform 0.3s var(--ease),box-shadow 0.3s var(--ease);cursor:default}
.lp-profile-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 24px 60px rgba(0,0,0,0.5)}
.lp-profile-card-img{height:220px;background:linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.lp-profile-card-img-b{background:linear-gradient(160deg,#0a1020 0%,#1a2a4a 50%,#0d1830 100%)}
.lp-profile-card-img-c{background:linear-gradient(160deg,#0f1a0a 0%,#1e3a1a 50%,#0a1f08 100%)}
.lp-profile-avatar{width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:32px;font-weight:700;color:rgba(255,255,255,0.4)}
.lp-profile-verified{position:absolute;top:12px;right:12px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;letter-spacing:0.5px}
.lp-profile-body{padding:16px 18px 20px}
.lp-profile-name{font-weight:700;font-size:15px;margin-bottom:6px}
.lp-profile-bio{font-size:13px;color:var(--muted);line-height:1.55;margin-bottom:12px}
.lp-profile-tags{display:flex;flex-wrap:wrap;gap:6px}
.lp-profile-tag{background:rgba(255,255,255,0.05);border:1px solid var(--border);font-size:11px;color:var(--dim);padding:3px 9px;border-radius:100px}

/* ── Por que não gratuito ── */
.lp-pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.lp-pillar{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px 28px;transition:border-color 0.3s,transform 0.3s}
.lp-pillar:hover{border-color:var(--accent-border);transform:translateY(-4px)}
.lp-pillar-num{font-family:var(--font-display);font-size:48px;font-weight:700;color:rgba(225,29,72,0.18);line-height:1;margin-bottom:16px;display:block}
.lp-pillar-title{font-weight:700;font-size:18px;margin-bottom:10px;color:var(--text)}
.lp-pillar-text{font-size:15px;color:var(--muted);line-height:1.65}

/* ── Problema ── */
.lp-problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.lp-problem-text p{font-size:clamp(15px,1.8vw,17px);color:var(--muted);line-height:1.8;margin-bottom:18px}
.lp-problem-text p:last-child{margin-bottom:0}
.lp-problem-pains{display:flex;flex-direction:column;gap:12px}
.lp-pain{display:flex;align-items:flex-start;gap:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:18px 20px}
.lp-pain-icon{width:36px;height:36px;border-radius:10px;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lp-pain-text{font-size:14px;color:var(--muted);line-height:1.55}
.lp-pain-text strong{display:block;font-size:15px;color:var(--text);font-weight:600;margin-bottom:3px}

/* ── Comparativo ── */
.lp-compare-table{width:100%;border-collapse:collapse;border-radius:16px;overflow:hidden;background:var(--bg-card);border:1px solid var(--border)}
.lp-compare-table th{padding:18px 24px;text-align:left;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:rgba(255,255,255,0.03);border-bottom:1px solid var(--border)}
.lp-compare-table th:last-child{color:var(--accent)}
.lp-compare-table td{padding:15px 24px;border-bottom:1px solid var(--border-soft);font-size:14px;color:var(--muted)}
.lp-compare-table tr:last-child td{border-bottom:none}
.lp-compare-table td:first-child{color:var(--text);font-weight:500}
.lp-compare-no{color:rgba(248,249,250,0.2)!important}
.lp-compare-yes{color:var(--accent)!important;display:flex;align-items:center;gap:6px;font-weight:600}

/* ── Modos ── */
.lp-modos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.lp-modo-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:28px 24px;transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s}
.lp-modo-card:hover{border-color:var(--accent-border);transform:translateY(-5px);box-shadow:0 20px 48px rgba(0,0,0,0.4)}
.lp-modo-num{font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);margin-bottom:16px;letter-spacing:1px}
.lp-modo-icon{width:44px;height:44px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--accent);margin-bottom:16px}
.lp-modo-title{font-weight:700;font-size:16px;margin-bottom:8px;color:var(--text)}
.lp-modo-text{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px}
.lp-modo-tag{display:inline-block;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px}
.lp-modo-tag--gold{background:var(--gold-soft);border-color:var(--gold-border);color:var(--gold)}

/* ── Features ── */
.lp-features-grid{display:flex;flex-direction:column;gap:80px}
.lp-feature{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.lp-feature--rev{direction:rtl}
.lp-feature--rev>*{direction:ltr}
.lp-feature-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:12px;display:block}
.lp-feature-title{font-family:var(--font-display);font-size:clamp(22px,3vw,32px);font-weight:700;letter-spacing:-0.8px;line-height:1.2;margin-bottom:16px;color:var(--text)}
.lp-feature-text{font-size:15px;color:var(--muted);line-height:1.75;margin-bottom:20px}
.lp-feature-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.lp-feature-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted)}
.lp-feature-list li svg{color:var(--accent);flex-shrink:0;margin-top:2px}
.lp-feature-visual{background:linear-gradient(135deg,var(--bg-card2),var(--bg-card));border:1px solid var(--border);border-radius:24px;min-height:300px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.lp-feature-visual::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(225,29,72,0.06),transparent 70%)}
.lp-fv-inner{position:relative;z-index:1;padding:32px;width:100%;text-align:center}

/* ── Phone Mockup ── */
.lp-phone{width:200px;height:360px;background:var(--bg-card);border:2px solid rgba(255,255,255,0.10);border-radius:38px;margin:0 auto;position:relative;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.1)}
.lp-phone::before{content:'';position:absolute;top:12px;left:50%;transform:translateX(-50%);width:60px;height:6px;background:rgba(255,255,255,0.12);border-radius:3px}
.lp-phone-screen{position:absolute;inset:20px 8px 8px;border-radius:28px;background:var(--bg);overflow:hidden}
.lp-phone-card{position:absolute;inset:0;background:linear-gradient(180deg,#1a0a14 0%,#3d1530 60%,#1a0a14 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:16px}
.lp-phone-name{font-family:var(--font-display);font-size:18px;font-weight:700;color:#fff;margin-bottom:4px}
.lp-phone-tags{display:flex;gap:4px;flex-wrap:wrap}
.lp-phone-tag{background:rgba(225,29,72,0.25);border:1px solid rgba(225,29,72,0.4);color:#fff;font-size:9px;padding:2px 6px;border-radius:100px;font-weight:500}
.lp-phone-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(225,29,72,0.6),transparent);animation:scan 2s linear infinite}
.lp-phone-verified{position:absolute;top:12px;right:12px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px}

/* ── Como Funciona ── */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;position:relative}
.lp-steps::before{content:'';position:absolute;top:28px;left:calc(100%/6);right:calc(100%/6);height:1px;background:linear-gradient(90deg,transparent,var(--accent-border),var(--accent-border),transparent)}
.lp-step{text-align:center;padding:40px 24px 32px}
.lp-step-num{width:56px;height:56px;border-radius:50%;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);font-family:var(--font-display);font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
.lp-step-title{font-weight:700;font-size:18px;margin-bottom:10px;color:var(--text)}
.lp-step-text{font-size:14px;color:var(--muted);line-height:1.65}

/* ── Camarote ── */
.lp-camarote{background:linear-gradient(135deg,rgba(245,158,11,0.04) 0%,rgba(8,9,14,0) 50%),var(--bg-card);border:1px solid var(--gold-border);border-radius:24px;padding:56px 48px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.lp-camarote-title{font-family:var(--font-display);font-size:clamp(26px,3.5vw,40px);font-weight:700;letter-spacing:-1px;line-height:1.2;margin-bottom:16px}
.lp-camarote-title span{color:var(--gold)}
.lp-camarote-text{font-size:15px;color:var(--muted);line-height:1.75;margin-bottom:24px}
.lp-camarote-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px}
.lp-camarote-tag{background:var(--gold-soft);border:1px solid var(--gold-border);color:var(--gold);font-size:12px;font-weight:600;padding:5px 12px;border-radius:100px}
.lp-btn-gold{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#F59E0B,#d97706);color:#0a0a0a;border:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;font-family:var(--font-body);transition:transform 0.2s,box-shadow 0.2s;text-decoration:none}
.lp-btn-gold:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(245,158,11,0.35)}
.lp-camarote-visual{display:flex;flex-direction:column;gap:14px}
.lp-camarote-card{background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02));border:1px solid var(--gold-border);border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:14px}
.lp-camarote-card-icon{width:36px;height:36px;background:var(--gold-soft);border:1px solid var(--gold-border);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0}
.lp-camarote-card-text{font-size:14px;color:rgba(248,249,250,0.70);line-height:1.5}
.lp-camarote-card-text strong{display:block;color:var(--text);font-weight:600;margin-bottom:2px}

/* ── Segurança ── */
.lp-security-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lp-security-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:28px 24px;transition:border-color 0.3s,transform 0.3s}
.lp-security-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-4px)}
.lp-security-icon{width:44px;height:44px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:12px;color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.lp-security-title{font-weight:700;font-size:16px;margin-bottom:8px;color:var(--text)}
.lp-security-text{font-size:14px;color:var(--muted);line-height:1.6}

/* ── Gamificação ── */
.lp-game-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.lp-game-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:28px 24px;position:relative;overflow:hidden;transition:border-color 0.3s,transform 0.3s}
.lp-game-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad-accent);opacity:0;transition:opacity 0.3s}
.lp-game-card:hover{border-color:var(--accent-border);transform:translateY(-4px)}
.lp-game-card:hover::before{opacity:1}
.lp-game-card-title{font-weight:700;font-size:17px;margin-bottom:8px;color:var(--text)}
.lp-game-card-text{font-size:14px;color:var(--muted);line-height:1.6}

/* ── Early Adopter ── */
.lp-early{background:linear-gradient(135deg,rgba(245,158,11,0.07),rgba(8,9,14,0)),var(--bg-card);border:1px solid var(--gold-border);border-radius:24px;padding:64px 48px;text-align:center;position:relative;overflow:hidden}
.lp-early::before{content:'';position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent 70%);pointer-events:none}
.lp-early-badge{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border:2px solid var(--gold-border);display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:36px;position:relative;z-index:1;animation:float-y 4s ease-in-out infinite}
.lp-early-title{font-family:var(--font-display);font-size:clamp(26px,4vw,44px);font-weight:700;letter-spacing:-1px;line-height:1.2;margin-bottom:16px;position:relative;z-index:1}
.lp-early-title span{color:var(--gold)}
.lp-early-text{font-size:clamp(15px,1.8vw,17px);color:var(--muted);line-height:1.75;max-width:560px;margin:0 auto 32px;position:relative;z-index:1}

/* ── Depoimentos ── */
.lp-testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.lp-testimonial{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:28px 28px 24px;transition:border-color 0.3s,transform 0.3s}
.lp-testimonial:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-4px)}
.lp-testimonial-stars{display:flex;gap:3px;color:var(--gold);margin-bottom:16px}
.lp-testimonial-text{font-size:15px;color:rgba(248,249,250,0.75);line-height:1.7;margin-bottom:20px;font-style:italic}
.lp-testimonial-author{display:flex;align-items:center;gap:12px}
.lp-testimonial-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1a0a14,#3d1530);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:16px;font-weight:700;color:rgba(255,255,255,0.4);flex-shrink:0}
.lp-testimonial-info{font-size:14px;color:var(--text);font-weight:600;line-height:1.4}
.lp-testimonial-plan{font-size:12px;color:var(--accent);font-weight:500;display:block}

/* ── Planos ── */
.lp-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start}
.lp-plan{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px 28px;transition:transform 0.3s,box-shadow 0.3s}
.lp-plan:hover{transform:translateY(-6px);box-shadow:0 24px 56px rgba(0,0,0,0.4)}
.lp-plan--featured{border-color:var(--accent-border);background:linear-gradient(180deg,rgba(225,29,72,0.05) 0%,var(--bg-card) 40%);position:relative}
.lp-plan-popular{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--grad-accent);color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px;white-space:nowrap}
.lp-plan-name{font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px}
.lp-plan-price{font-family:var(--font-display);font-size:40px;font-weight:700;color:var(--text);letter-spacing:-1px;line-height:1;margin-bottom:4px}
.lp-plan-price span{font-size:18px;font-weight:400;color:var(--muted);vertical-align:top;margin-top:8px;display:inline-block}
.lp-plan-period{font-size:13px;color:var(--dim);margin-bottom:6px}
.lp-plan-desc{font-size:13px;color:var(--muted);margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border)}
.lp-plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
.lp-plan-features li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted)}
.lp-plan-features li svg{color:var(--accent);flex-shrink:0;margin-top:2px}
.lp-plan-cta{display:block;width:100%;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;font-family:var(--font-body);transition:transform 0.2s,box-shadow 0.2s;text-decoration:none;border:none}
.lp-plan-cta--outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.lp-plan-cta--outline:hover{border-color:var(--accent-border);background:var(--accent-soft)}
.lp-plan-cta--primary{background:var(--grad-accent);color:#fff}
.lp-plan-cta--primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(225,29,72,0.4)}
.lp-plan-cta--gold{background:linear-gradient(135deg,#F59E0B,#d97706);color:#0a0a0a}
.lp-plan-cta--gold:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(245,158,11,0.35)}

/* ── FAQ ── */
.faq-item{border-bottom:1px solid var(--border)}
.faq-btn{width:100%;background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;font-weight:600;font-size:15px;color:var(--text);font-family:var(--font-body);text-align:left;padding:22px 0}
.faq-icon{width:28px;height:28px;border-radius:50%;background:rgba(225,29,72,0.10);border:1px solid var(--accent-border);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;font-weight:700;transition:transform 0.3s,background 0.2s,color 0.2s}
.faq-icon--open{transform:rotate(45deg);background:var(--accent);color:#fff}
.faq-body{overflow:hidden;max-height:0;transition:max-height 0.35s var(--ease)}
.faq-answer{font-size:14px;color:var(--muted);line-height:1.75;padding-right:44px;margin-bottom:18px}

/* ── PWA ── */
.lp-pwa{background:var(--bg-card);border:1px solid var(--border);border-radius:24px;padding:48px;text-align:center;max-width:700px;margin:0 auto}
.lp-pwa-steps{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;text-align:left}
.lp-pwa-step{background:var(--bg-card2);border:1px solid var(--border);border-radius:14px;padding:20px 22px}
.lp-pwa-step-os{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:10px}
.lp-pwa-step ol{padding-left:18px;display:flex;flex-direction:column;gap:6px}
.lp-pwa-step ol li{font-size:14px;color:var(--muted);line-height:1.5}

/* ── CTA Final ── */
.lp-cta-final{text-align:center;padding:120px 24px;background:radial-gradient(ellipse 70% 50% at 50% 50%,rgba(225,29,72,0.09) 0%,transparent 70%),var(--bg)}
.lp-cta-final-title{font-family:var(--font-display);font-size:clamp(32px,5vw,60px);font-weight:700;letter-spacing:-2px;line-height:1.1;margin-bottom:20px}
.lp-cta-final-sub{font-size:clamp(15px,1.8vw,18px);color:var(--muted);max-width:520px;margin:0 auto 40px;line-height:1.7}
.lp-cta-final-proof{font-size:13px;color:var(--dim);margin-top:24px}
.lp-cta-final-proof span{margin:0 8px}

/* ── Footer ── */
.lp-footer{border-top:1px solid var(--border);padding:40px 24px;text-align:center}
.lp-footer-logo{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);text-decoration:none;margin-bottom:16px;display:inline-block}
.lp-footer-logo span{color:var(--accent)}
.lp-footer-links{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
.lp-footer-links a{color:var(--dim);text-decoration:none;font-size:13px;padding:6px 12px;border-radius:8px;transition:color 0.2s}
.lp-footer-links a:hover{color:var(--muted)}
.lp-footer-copy{font-size:12px;color:var(--dim)}

/* ── Notif ── */
.lp-notif-wrap{position:fixed;bottom:28px;right:24px;z-index:999;display:flex;flex-direction:column;gap:10px;max-width:300px;pointer-events:none}
.lp-notif{background:rgba(19,22,31,0.96);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:11px 14px;font-size:12.5px;color:var(--text);line-height:1.4;animation:notif-in 0.4s var(--ease) both;box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.lp-notif--out{animation:notif-out 0.4s var(--ease) forwards}
.lp-notif::before{content:'✅ ';font-size:11px}

/* ── Responsive ── */
@media (max-width:900px){
  .lp-profiles-grid{grid-template-columns:1fr 1fr}
  .lp-pillars{grid-template-columns:1fr}
  .lp-problem-grid{grid-template-columns:1fr}
  .lp-modos-grid{grid-template-columns:1fr 1fr}
  .lp-feature{grid-template-columns:1fr;gap:32px}
  .lp-feature--rev{direction:ltr}
  .lp-steps::before{display:none}
  .lp-steps{grid-template-columns:1fr}
  .lp-camarote{grid-template-columns:1fr;padding:36px 28px}
  .lp-security-grid{grid-template-columns:1fr 1fr}
  .lp-game-grid{grid-template-columns:1fr}
  .lp-testimonials{grid-template-columns:1fr}
  .lp-plans{grid-template-columns:1fr;max-width:440px;margin:0 auto}
  .lp-stats-inner{grid-template-columns:repeat(2,1fr)}
  .lp-pwa-steps{grid-template-columns:1fr}
  .lp-nav-links{display:none}
  .lp-ham{display:flex}
}
@media (max-width:600px){
  .lp-profiles-grid{grid-template-columns:1fr}
  .lp-modos-grid{grid-template-columns:1fr}
  .lp-security-grid{grid-template-columns:1fr}
  .lp-hero-actions{flex-direction:column;align-items:center}
  .lp-btn-primary,.lp-btn-ghost{width:100%;justify-content:center}
}
`

/* ── FAQ Data ─────────────────────────────────────────────────────────────── */
const faqItems = [
  { q: 'Por que não existe plano gratuito?', a: 'Porque o gratuito atrai quem não sabe o que quer. Aplicativos abertos viram bagunça: perfis falsos, pessoas inativas e perda de tempo. Cobrar um valor acessível — a partir de R$9,97 — cria um filtro natural de intenção. Quem investe para estar aqui tem outro nível de comprometimento. Você percebe a diferença já na primeira mensagem.' },
  { q: 'Como funciona a verificação biométrica?', a: 'Você faz uma selfie ao vivo com uma sequência de movimentos no momento do cadastro. O sistema confirma que é uma pessoa real — impossível usar foto ou vídeo gravado. Leva menos de 1 minuto. Sua foto de documento é descartada imediatamente após a validação.' },
  { q: 'O que acontece com a foto do meu documento?', a: 'Ela é descartada imediatamente. Não armazenamos fotos de RG ou CNH de ninguém. Nossa tecnologia apenas valida a autenticidade na hora e guarda um código criptografado. Sua privacidade é absoluta.' },
  { q: 'Como funcionam os filtros de incluir e excluir?', a: 'É o sistema mais rápido do Brasil, feito direto na tela principal. Tocou na tag, ficou verde: você quer ver esse perfil. Tocou de novo, ficou vermelho: perfil bloqueado da sua frente. Tocou pela terceira vez: volta ao neutro. Você molda sua busca em segundos, sem formulários.' },
  { q: 'Preciso revelar minha identidade no Camarote?', a: 'Não. Você escolhe o que compartilhar. O Camarote é discreto por natureza — só quem sinalizou as mesmas intenções pode te ver.' },
  { q: 'E se alguém for banido e tentar criar outra conta?', a: 'O banimento é feito direto no CPF. Não adianta criar outro e-mail — a pessoa simplesmente não volta.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem burocracia e sem cobrança extra. Você cancela direto no app e continua usando até o final do período pago.' },
  { q: 'O app funciona para todas as orientações e gêneros?', a: 'Completamente. O sistema de filtros foi desenhado para abraçar todas as orientações sexuais, identidades de gênero e formatos de relacionamento. É você quem dita quem entra e quem sai da sua tela.' },
  { q: 'O que são fichas e para que servem?', a: 'Fichas são a moeda do MeAndYou. Você ganha girando a roleta diária, indicando amigos ou comprando na loja. Use para mandar presentes no chat, comprar boosts, supercurtidas, modo invisível e muito mais.' },
]

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [navVisible, setNavVisible] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const lastScrollY = useRef(0)
  const animRef = useRef(false)

  // PWA
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installDone, setInstallDone] = useState(false)

  // Notifications
  const [notifList, setNotifList] = useState<Array<{ id: number; text: string; exiting: boolean }>>([])
  const notifIdRef = useRef(0)
  const [userCity, setUserCity] = useState('')

  // Auth check
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) router.replace('/dashboard'); else setChecking(false) })
      .catch(() => setChecking(false))
  }, [router])

  // Scroll reveal + counters + magnetic buttons
  useEffect(() => {
    if (checking || animRef.current) return
    animRef.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches

    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('lp-visible')
          revealObs.unobserve(e.target)
        }
      })
    }, { threshold: 0.06, rootMargin: '0px 0px -32px 0px' })

    document.querySelectorAll('.lp-anim').forEach(el => {
      if (reduced) { (el as HTMLElement).classList.add('lp-visible'); return }
      revealObs.observe(el)
    })

    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.target || '0', 10)
          if (target > 0 && !reduced) animateCounter(el, target)
          else el.textContent = target.toLocaleString('pt-BR') + (el.dataset.suffix || '')
          counterObs.unobserve(el)
        }
      })
    }, { threshold: 0.3 })

    document.querySelectorAll('.lp-counter').forEach(el => counterObs.observe(el))

    // Magnetic buttons
    if (!reduced) {
      document.querySelectorAll('.lp-magnetic').forEach(btn => {
        const el = btn as HTMLElement
        const handleMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect()
          const x = (e.clientX - r.left - r.width / 2) * 0.25
          const y = (e.clientY - r.top - r.height / 2) * 0.25
          el.style.transform = `translate(${x}px,${y}px) translateY(-2px)`
        }
        const handleLeave = () => { el.style.transform = '' }
        el.addEventListener('mousemove', handleMove)
        el.addEventListener('mouseleave', handleLeave)
      })
    }

    return () => { revealObs.disconnect(); counterObs.disconnect() }
  }, [checking])

  // Nav scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setNavVisible(y < 60 || y < lastScrollY.current)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  // Geolocation
  useEffect(() => {
    const fallback = ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife', 'Florianopolis', 'Campinas']
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => setUserCity(d.city || fallback[0])).catch(() => setUserCity(fallback[Math.floor(Math.random() * fallback.length)]))
  }, [])

  // Notifications
  useEffect(() => {
    if (checking) return
    const nm = ['Ana','Carlos','Juliana','Marcos','Beatriz','Rafael','Leticia','Diego','Priscila','Bruno','Fernanda','Gustavo','Isabela','Thiago','Camila','Leonardo','Vanessa','Eduardo','Patricia','Rodrigo','Mariana','Felipe','Natalia','Vinicius','Larissa','Amanda','Ricardo']
    const ct = (userCity ? [userCity] : []).concat(['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Fortaleza','Recife','Florianopolis','Manaus','Goiania','Campinas'])
    const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
    const idade = () => Math.floor(Math.random() * 34) + 19
    const gens = [
      () => `${rnd(nm)}, ${idade()} — acabou de se cadastrar em ${rnd(ct)}`,
      () => `${rnd(nm)} de ${rnd(ct)} — assinou o Plus`,
      () => `${rnd(nm)} de ${rnd(ct)} — assinou o Black`,
      () => `${rnd(nm)}, ${idade()} — verificou identidade agora`,
      () => `${rnd(nm)} de ${rnd(ct)} — deu match agora`,
      () => `${rnd(nm)}, ${idade()} — enviou uma SuperCurtida`,
      () => `${rnd(nm)}, ${idade()} — atingiu streak de 7 dias`,
    ]
    let timer: ReturnType<typeof setTimeout>
    const add = () => {
      const text = rnd(gens)()
      const id = ++notifIdRef.current
      setNotifList(prev => [...prev.slice(-2), { id, text, exiting: false }])
      setTimeout(() => setNotifList(prev => prev.map(x => x.id === id ? { ...x, exiting: true } : x)), 4200)
      setTimeout(() => setNotifList(prev => prev.filter(x => x.id !== id)), 4800)
      timer = setTimeout(add, 4500 + Math.random() * 4000)
    }
    timer = setTimeout(add, 2000 + Math.random() * 2000)
    return () => clearTimeout(timer)
  }, [checking, userCity]) // eslint-disable-line

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090E' }}>
        <span style={{ fontFamily: 'serif', fontSize: 36, color: '#F8F9FA' }}>MeAnd<span style={{ color: '#E11D48' }}>You</span></span>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── PIXEL PLACEHOLDERS ── cole o código do pixel nos comentários abaixo ── */}
      {/* META PIXEL — cole aqui:
      <script dangerouslySetInnerHTML={{ __html: `
        !function(f,b,e,v,n,t,s){...}
        fbq('init', 'SEU_PIXEL_ID');
        fbq('track', 'PageView');
      `}} />
      */}
      {/* GOOGLE TAG — cole aqui:
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX" />
      <script dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXX');
      `}} />
      */}

      <div className="lp">

        {/* ── NAV ── */}
        <nav className={`lp-nav ${!navVisible ? 'lp-nav--hidden' : ''}`}>
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul className="lp-nav-links">
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#features">Recursos</a></li>
            <li><a href="#camarote">Camarote</a></li>
            <li><a href="#planos">Planos</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={() => router.push('/planos')}>Criar conta</button>
          <button className="lp-ham" onClick={() => setMenuAberto(true)}><IcMenu /></button>
        </nav>

        {/* ── MOBILE MENU ── */}
        <div className={`lp-mobile-menu ${menuAberto ? 'lp-mobile-menu--open' : ''}`}>
          <button onClick={() => setMenuAberto(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#F8F9FA' }}><IcX size={24} /></button>
          <a href="#como-funciona" onClick={() => setMenuAberto(false)}>Como funciona</a>
          <a href="#features" onClick={() => setMenuAberto(false)}>Recursos</a>
          <a href="#camarote" onClick={() => setMenuAberto(false)}>Camarote</a>
          <a href="#planos" onClick={() => setMenuAberto(false)}>Planos</a>
          <button className="lp-nav-cta" style={{ fontSize: 18, padding: '14px 36px' }} onClick={() => { setMenuAberto(false); router.push('/planos') }}>Criar conta</button>
        </div>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-bg" />
          <div className="lp-hero-grid" />
          <div className="lp-hero-content">
            <div className="lp-badge" style={{ animation: 'reveal-up 0.7s 0.1s both' }}>
              <IcShield />
              Verificação real de identidade
            </div>
            <h1 className="lp-h1" style={{ animation: 'reveal-up 0.7s 0.2s both' }}>
              Seja quem você é.<br />
              Encontre quem <em>você quer.</em>
            </h1>
            <p className="lp-hero-sub" style={{ animation: 'reveal-up 0.7s 0.3s both' }}>
              No MeAndYou, cada perfil é verificado, cada desejo é respeitado e cada conexão pode ser exatamente o que você quer — sem rótulos, sem julgamentos, sem perfis falsos.
            </p>
            <div className="lp-hero-actions" style={{ animation: 'reveal-up 0.7s 0.4s both' }}>
              <a href="/planos" className="lp-btn-primary lp-magnetic">
                Criar minha conta <IcArrow />
              </a>
              <a href="#como-funciona" className="lp-btn-ghost">
                Como funciona
              </a>
            </div>
            <div className="lp-hero-proof" style={{ animation: 'reveal-up 0.7s 0.5s both' }}>
              <span>Perfis 100% verificados por biometria</span>
              <span>Lançamento 2026</span>
              <span>Feito no Brasil</span>
            </div>
            <div className="lp-founder-callout lp-anim" style={{ margin: '28px auto 0', animation: 'reveal-up 0.7s 0.6s both' }}>
              <div className="lp-founder-callout-icon">🏅</div>
              <div className="lp-founder-callout-text">
                <strong>Emblema de Fundador — exclusivo para quem entrar agora.</strong> Concedido apenas durante o lançamento. Nunca mais será emitido.
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="lp-stats">
          <div className="lp-stats-inner">
            {[
              { target: 100, suffix: '+', label: 'filtros de busca' },
              { target: 0, suffix: '', label: 'perfis falsos (biometria)' },
              { target: 4, suffix: '', label: 'modos de conexão' },
              { target: 9, suffix: '97', label: 'R$ por mês para começar' },
            ].map((s, i) => (
              <div key={i} className="lp-anim" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="lp-stat-num lp-counter" data-target={s.target} data-suffix={s.suffix}>0{s.suffix}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVERSIDADE ── */}
        <section className="lp-section">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Para todo mundo</span>
              <h2 className="lp-section-title">Todo tipo de pessoa.<br />Um só lugar.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>
                Jovens, maduros, solteiros, casados em relacionamento aberto, curiosos, determinados. Feito para quem é real.
              </p>
            </div>
            <div className="lp-profiles-grid">
              {[
                { init: 'J', name: 'Julia, 26 — São Paulo', bio: 'Gamer nas horas vagas, vegana há 3 anos. Procuro conexão genuína, alguém pra conversar de verdade antes de qualquer encontro.', tags: ['Gamer', 'Vegana', 'Conexão genuína'], img: '' },
                { init: 'R', name: 'Roberto, 55 — Rio de Janeiro', bio: 'Eletricista de mão cheia, churrasco todo fim de semana. Direto ao ponto e sem enrolação — vida é curta demais.', tags: ['Direto ao ponto', 'Sem enrolação'], img: 'b' },
                { init: 'A', name: 'Ana Paula, 38 — Belo Horizonte', bio: 'Mãe de 2, tutora de um golden louco. Procuro um companheiro pra dividir a rotina e os momentos bons da vida.', tags: ['Mãe', 'Pet lover', 'Companheiro'], img: 'c' },
              ].map((p, i) => (
                <div key={i} className={`lp-profile-card lp-anim lp-delay-${i + 1}`}>
                  <div className={`lp-profile-card-img lp-profile-card-img-${p.img}`}>
                    <div className="lp-profile-avatar">{p.init}</div>
                    <div className="lp-profile-verified">Verificado</div>
                    <div className="lp-phone-scanline" />
                  </div>
                  <div className="lp-profile-body">
                    <div className="lp-profile-name">{p.name}</div>
                    <div className="lp-profile-bio">{p.bio}</div>
                    <div className="lp-profile-tags">{p.tags.map(t => <span key={t} className="lp-profile-tag">{t}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── POR QUE NÃO GRATUITO ── */}
        <section className="lp-section lp-section--dark">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ maxWidth: 640, marginBottom: 56 }}>
              <span className="lp-section-label">A diferença começa aqui</span>
              <h2 className="lp-section-title">Gratuito atrai quem não sabe o que quer.</h2>
              <p className="lp-section-sub" style={{ marginBottom: 0 }}>
                A partir de R$9,97 por mês, criamos um filtro natural de intenção. O resultado: outra qualidade de conversa, de perfil, de experiência.
              </p>
            </div>
            <div className="lp-pillars">
              {[
                { num: '01', title: 'Filtro de intenção real', text: 'Quem paga para estar aqui, por menor que seja o valor, tem outro nível de comprometimento. Você sente isso na primeira mensagem.' },
                { num: '02', title: 'Zero perfis falsos', text: 'A barreira de entrada — verificação de identidade mais pagamento — elimina bots, fakes e perfis abandonados de vez.' },
                { num: '03', title: 'Infraestrutura de verdade', text: 'Moderação 24h, botão de emergência, verificação facial ao vivo, registro de encontro. Tudo isso custa, e é isso que garante sua segurança.' },
              ].map((p, i) => (
                <div key={i} className={`lp-pillar lp-anim lp-delay-${i + 1}`}>
                  <span className="lp-pillar-num">{p.num}</span>
                  <div className="lp-pillar-title">{p.title}</div>
                  <div className="lp-pillar-text">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEMA ── */}
        <section className="lp-section">
          <div className="lp-section-inner">
            <div className="lp-problem-grid">
              <div className="lp-problem-text lp-anim lp-anim--left">
                <span className="lp-section-label">O problema</span>
                <h2 className="lp-section-title">Você já se cansou de apps que desperdiçam o seu tempo?</h2>
                <p>Perfis falsos. Matches que somem. Algoritmos que te encaixam em uma caixinha.</p>
                <p>A maioria dos apps de relacionamento foi feita para todo mundo — e por isso não funciona direito para ninguém.</p>
                <p>Você não consegue filtrar o que realmente importa. Não sabe se a pessoa do outro lado é real. E se tiver algo diferente na sua cabeça — seja lá o que for — você guarda pra si com medo do julgamento.</p>
                <p style={{ color: 'var(--text)', fontWeight: 600 }}>Isso não é um problema seu. É o app que está errado.</p>
              </div>
              <div className="lp-problem-pains lp-anim lp-anim--right">
                {[
                  { icon: <IcUsers />, title: 'Perfis falsos e bots', text: 'Você perde tempo com contas que nunca vão responder — ou que foram criadas para golpe.' },
                  { icon: <IcFilter />, title: 'Filtros que não filtram', text: 'Deslizar infinitamente sem encontrar quem combina porque você não tem como ser preciso.' },
                  { icon: <IcLock />, title: 'Intenções veladas', text: 'Ninguém deixa claro o que quer — e você só descobre depois de investir tempo numa conversa.' },
                  { icon: <IcShield />, title: 'Sem segurança real', text: 'Você não sabe se a pessoa é quem diz ser. Não tem como registrar um encontro ou pedir ajuda de dentro do app.' },
                ].map((pain, i) => (
                  <div key={i} className={`lp-pain lp-anim lp-delay-${i + 1}`}>
                    <div className="lp-pain-icon">{pain.icon}</div>
                    <div className="lp-pain-text"><strong>{pain.title}</strong>{pain.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARATIVO ── */}
        <section className="lp-section lp-section--dark">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="lp-section-label">Comparativo</span>
              <h2 className="lp-section-title">MeAndYou vs. os outros apps.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>Não é opinião. É uma lista do que existe aqui e não existe em nenhum outro lugar.</p>
            </div>
            <div className="lp-anim">
              <table className="lp-compare-table">
                <thead>
                  <tr>
                    <th>Recurso</th>
                    <th>Outros apps</th>
                    <th>MeAndYou</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Verificação biométrica real', 'Mais de 100 filtros', 'Filtros de sugar e fetiche',
                    'Salas temáticas', 'Videochamada nativa', 'Registro de encontro',
                    'Botão de emergência', 'Gamificação com prêmios', 'Emblemas colecionáveis',
                    '1 CPF, 1 conta', 'Nudge (tremer tela)',
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row}</td>
                      <td className="lp-compare-no">—</td>
                      <td><span className="lp-compare-yes"><IcCheck size={14} /> Sim</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 4 MODOS ── */}
        <section className="lp-section">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Modos de conexão</span>
              <h2 className="lp-section-title">Quatro formas de encontrar sua conexão.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>Cada modo foi criado para um tipo diferente de busca. Você escolhe como quer explorar.</p>
            </div>
            <div className="lp-modos-grid">
              {[
                { num: '01', icon: <IcZap />, title: 'Descobrir', text: 'Explore perfis com swipe. Curta, passe ou envie uma SuperCurtida. O modo mais rápido, com perfis verificados.', tag: 'Swipe verificado', gold: false },
                { num: '02', icon: <IcFilter />, title: 'Busca Avançada', text: 'Mais de 100 filtros: corpo, estilo, personalidade, hábitos, orientação, intenções. Inclua quem quer ver, exclua quem não combina.', tag: '100+ filtros', gold: false },
                { num: '03', icon: <IcStar />, title: 'Match do Dia', text: 'Todo dia, uma curadoria personalizada baseada no seu perfil, seus filtros e seu comportamento dentro do app.', tag: 'Curadoria para você', gold: false },
                { num: '04', icon: <IcUsers />, title: 'Salas', text: 'Entre em salas temáticas por interesse ou humor e descubra quem está no mesmo astral que você neste momento.', tag: 'Plus e Black', gold: true },
              ].map((m, i) => (
                <div key={i} className={`lp-modo-card lp-anim lp-delay-${i + 1}`}>
                  <div className="lp-modo-num">{m.num}</div>
                  <div className="lp-modo-icon">{m.icon}</div>
                  <div className="lp-modo-title">{m.title}</div>
                  <div className="lp-modo-text">{m.text}</div>
                  <span className={`lp-modo-tag ${m.gold ? 'lp-modo-tag--gold' : ''}`}>{m.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="lp-section lp-section--dark" id="features">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 72 }}>
              <span className="lp-section-label">Recursos</span>
              <h2 className="lp-section-title">Tudo que faltava no seu app de relacionamentos.</h2>
            </div>
            <div className="lp-features-grid">

              {/* Feature 1 — Verificação */}
              <div className="lp-feature">
                <div className="lp-anim lp-anim--left">
                  <span className="lp-feature-label">Verificação biométrica</span>
                  <h3 className="lp-feature-title">Cada perfil é uma pessoa real</h3>
                  <p className="lp-feature-text">Todos os usuários passam por verificação biométrica com liveness check. Sem bots. Sem fotos roubadas. Sem perfis fantasma. Você sabe com quem está falando antes de dizer oi.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Selfie ao vivo com movimentos</li>
                    <li><IcCheck size={15} />Documento descartado após validação</li>
                    <li><IcCheck size={15} />Badge "Verificado" no perfil</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim lp-anim--right">
                  <div className="lp-fv-inner">
                    <div className="lp-phone" style={{ animation: 'float-y 5s ease-in-out infinite' }}>
                      <div className="lp-phone-screen">
                        <div className="lp-phone-card">
                          <div className="lp-phone-scanline" />
                          <div className="lp-phone-verified">✓ Verificado</div>
                          <div className="lp-phone-name">Juliana, 28</div>
                          <div className="lp-phone-tags">
                            <span className="lp-phone-tag">São Paulo</span>
                            <span className="lp-phone-tag">Verificada</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 — Filtros */}
              <div className="lp-feature lp-feature--rev">
                <div className="lp-anim lp-anim--right">
                  <span className="lp-feature-label">Filtros avançados</span>
                  <h3 className="lp-feature-title">Busque exatamente quem você quer</h3>
                  <p className="lp-feature-text">Filtre por corpo, cor dos olhos, tatuagens, religião, se fuma, se bebe, personalidade, orientação, status civil, filhos, pets, escolaridade e muito mais. Toque uma vez para incluir, toque de novo para excluir.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Mais de 100 categorias de filtro</li>
                    <li><IcCheck size={15} />Sistema incluir/excluir por toque</li>
                    <li><IcCheck size={15} />Filtros de fetiche e sugar (Black)</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim lp-anim--left">
                  <div className="lp-fv-inner">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 260, margin: '0 auto' }}>
                      {[
                        { label: 'Vegano', state: 'inc' }, { label: 'Gamer', state: 'inc' }, { label: 'Tatuagem', state: 'neu' },
                        { label: 'Evangélico', state: 'exc' }, { label: 'Pets', state: 'inc' }, { label: 'Fitness', state: 'neu' },
                        { label: 'Viajante', state: 'inc' }, { label: 'Fumante', state: 'exc' }, { label: 'Introvertido', state: 'neu' },
                      ].map((tag, i) => (
                        <span key={i} style={{
                          padding: '6px 14px', borderRadius: '100px', fontSize: 13, fontWeight: 600, border: '1px solid',
                          background: tag.state === 'inc' ? 'rgba(16,185,129,0.15)' : tag.state === 'exc' ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.04)',
                          borderColor: tag.state === 'inc' ? 'rgba(16,185,129,0.4)' : tag.state === 'exc' ? 'rgba(225,29,72,0.4)' : 'rgba(255,255,255,0.08)',
                          color: tag.state === 'inc' ? '#10b981' : tag.state === 'exc' ? '#E11D48' : 'rgba(248,249,250,0.4)',
                        }}>{tag.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 — Segurança de encontro */}
              <div className="lp-feature">
                <div className="lp-anim lp-anim--left">
                  <span className="lp-feature-label">Segurança de encontro</span>
                  <h3 className="lp-feature-title">Do match ao encontro, você está protegido</h3>
                  <p className="lp-feature-text">Registre seu encontro com local, data e hora — guardado só para você. O app faz um check-in automático depois. E se precisar, um botão de emergência liga direto para a polícia em um toque.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Registro privado de encontro</li>
                    <li><IcCheck size={15} />Check-in automático pós-encontro</li>
                    <li><IcCheck size={15} />Botão de emergência — 190 em 1 toque</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim lp-anim--right">
                  <div className="lp-fv-inner">
                    {[
                      { label: 'Local registrado', value: 'Botafogo, Rio de Janeiro' },
                      { label: 'Data e hora', value: 'Hoje, 20h00' },
                      { label: 'Status', value: 'Check-in pendente' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 10, textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 4 — Videochamada */}
              <div className="lp-feature lp-feature--rev">
                <div className="lp-anim lp-anim--right">
                  <span className="lp-feature-label">Videochamada nativa</span>
                  <h3 className="lp-feature-title">Veja quem é a pessoa antes do encontro</h3>
                  <p className="lp-feature-text">Inicie uma chamada de vídeo em tempo real direto na conversa, sem sair do app, sem trocar número. Chegue ao encontro sem nenhuma surpresa.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Chamada de vídeo HD em tempo real</li>
                    <li><IcCheck size={15} />Sem trocar número ou baixar outro app</li>
                    <li><IcCheck size={15} />Disponível em todos os planos</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim lp-anim--left">
                  <div className="lp-fv-inner">
                    <div style={{ width: 220, height: 160, borderRadius: 16, background: 'linear-gradient(135deg,#0a1020,#1a2a4a)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
                        {['#E11D48', '#10b981', '#3b82f6'].map((c, i) => (
                          <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: c, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcVideo /></div>
                        ))}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Videochamada em andamento</div>
                    </div>
                    <div style={{ width: 80, height: 60, borderRadius: 10, background: 'linear-gradient(135deg,#1a0a14,#3d1530)', border: '1px solid rgba(255,255,255,0.08)', margin: '0 auto', position: 'relative', right: -60, bottom: 12 }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section className="lp-section" id="como-funciona">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="lp-section-label">Primeiros passos</span>
              <h2 className="lp-section-title">Em 3 passos você já está lá.</h2>
            </div>
            <div className="lp-steps">
              {[
                { num: '1', title: 'Crie e verifique seu perfil', text: 'Monte seu perfil com fotos, bio e o que você busca. A verificação biométrica é rápida e garante que você apareça como verificado para todos.' },
                { num: '2', title: 'Busque do seu jeito', text: 'Use os mais de 100 filtros para encontrar quem combina com você. Faça swipe, entre nas salas, veja quem curtiu, explore o Camarote.' },
                { num: '3', title: 'Conecte com segurança', text: 'Converse, mande um presente, faça videochamada, marque o encontro pelo app e vá com tranquilidade. O MeAndYou fica do seu lado do match ao encontro real.' },
              ].map((s, i) => (
                <div key={i} className={`lp-step lp-anim lp-delay-${i + 1}`}>
                  <div className="lp-step-num">{s.num}</div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAMAROTE ── */}
        <section className="lp-section" id="camarote">
          <div className="lp-section-inner">
            <div className="lp-camarote lp-anim">
              <div>
                <span className="lp-section-label">Exclusivo Black</span>
                <h2 className="lp-camarote-title">Alguns desejos merecem um <span>espaço próprio.</span></h2>
                <p className="lp-camarote-text">Um ambiente discreto, sem julgamentos, com perfis curados e filtros que você não encontra em nenhum outro app brasileiro. Só quem sinalizou as mesmas intenções pode te ver. Nenhuma exposição desnecessária.</p>
                <div className="lp-camarote-tags">
                  {['Sugar', 'Fetiche', 'Swing', 'Poliamor', 'BDSM'].map(t => <span key={t} className="lp-camarote-tag">{t}</span>)}
                </div>
                <a href="/planos" className="lp-btn-gold">Acessar o Camarote <IcArrow /></a>
              </div>
              <div className="lp-camarote-visual">
                {[
                  { icon: <IcLock />, title: 'Acesso privado', text: 'Só quem sinalizou as mesmas intenções pode ver seu perfil no Camarote.' },
                  { icon: <IcEye />, title: 'Zero exposição', text: 'Seu perfil no Camarote é separado do perfil principal. Você controla tudo.' },
                  { icon: <IcShield />, title: 'Comunidade curada', text: 'Perfis verificados, filtros exclusivos e uma comunidade que compartilha interesses.' },
                ].map((c, i) => (
                  <div key={i} className={`lp-camarote-card lp-anim lp-delay-${i + 1}`}>
                    <div className="lp-camarote-card-icon">{c.icon}</div>
                    <div className="lp-camarote-card-text"><strong>{c.title}</strong>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SEGURANÇA ── */}
        <section className="lp-section lp-section--dark">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Segurança</span>
              <h2 className="lp-section-title">Você merece se sentir seguro do início ao fim.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>Construído com camadas reais de segurança — não só termos de uso que ninguém lê.</p>
            </div>
            <div className="lp-security-grid">
              {[
                { icon: <IcShield />, title: 'Biometria ao vivo', text: 'Selfie com movimento no cadastro. Impossível usar foto ou vídeo gravado.' },
                { icon: <IcLock />, title: '1 CPF, 1 conta', text: 'Banimento permanente por CPF. Quem sai pela porta não volta por outra.' },
                { icon: <IcEye />, title: 'Modo invisível', text: 'Desapareça do feed quando quiser, sem explicações para ninguém.' },
                { icon: <IcCheck size={18} />, title: 'Check-in pós-encontro', text: 'O app pergunta se você está bem depois do encontro automaticamente.' },
                { icon: <IcZap />, title: 'Botão de emergência', text: 'Um toque e você fala com a polícia. Pensado especialmente para a segurança feminina.' },
                { icon: <IcUsers />, title: 'Registro de encontro', text: 'Local, data e hora salvos só para você. Nenhum terceiro tem acesso.' },
              ].map((s, i) => (
                <div key={i} className={`lp-security-card lp-anim lp-delay-${(i % 3) + 1}`}>
                  <div className="lp-security-icon">{s.icon}</div>
                  <div className="lp-security-title">{s.title}</div>
                  <div className="lp-security-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GAMIFICAÇÃO ── */}
        <section className="lp-section">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Recompensas</span>
              <h2 className="lp-section-title">Todo dia tem prêmio.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>Quanto mais você usa, mais você ganha. Recompensas reais por estar aqui.</p>
            </div>
            <div className="lp-game-grid">
              {[
                { title: 'Roleta Diária', text: 'Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e fichas para gastar na loja. Cada plano dá mais giros por dia.' },
                { title: 'Streak de Acesso', text: 'Entre todos os dias e desbloqueie recompensas crescentes. Sequência de 30 dias garante prêmios raros.' },
                { title: 'Emblemas Colecionáveis', text: 'Conquistas que aparecem no seu perfil. Raridades de Comum a Lendário — quanto mais raro, mais destaque você ganha.' },
                { title: 'Programa de Indicação', text: 'Indique um amigo. Quando ele assinar, vocês dois ganham fichas e XP. Indique 3 e desbloqueie um boost automático.' },
              ].map((g, i) => (
                <div key={i} className={`lp-game-card lp-anim lp-delay-${i + 1}`}>
                  <div className="lp-game-card-title">{g.title}</div>
                  <div className="lp-game-card-text">{g.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EARLY ADOPTER ── */}
        <section className="lp-section lp-section--dark">
          <div className="lp-section-inner">
            <div className="lp-early lp-anim lp-anim--scale">
              <div className="lp-early-badge">🏅</div>
              <h2 className="lp-early-title">Você está chegando no<br /><span>momento certo.</span></h2>
              <p className="lp-early-text">O MeAndYou acabou de chegar. Todo usuário que entrar agora durante o lançamento recebe um <strong style={{ color: 'var(--gold)' }}>Emblema de Fundador exclusivo e vitalício</strong>. Ele nunca mais será concedido. Você carrega no perfil para sempre como prova de que esteve aqui desde o começo.</p>
              <a href="/planos" className="lp-btn-gold lp-magnetic" style={{ marginTop: 8 }}>
                Quero meu emblema de fundador <IcArrow />
              </a>
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ── */}
        <section className="lp-section">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Depoimentos</span>
              <h2 className="lp-section-title">Quem já está aqui não volta.</h2>
            </div>
            <div className="lp-testimonials">
              {[
                { init: 'C', name: 'Camila S.', sub: 'Belo Horizonte · Plano Plus', text: '"Passei muito tempo em apps conversando com pessoas que estavam em momentos diferentes do meu. Aqui eu fui direto ao ponto: ativei os filtros e deixei claro que procuro algo sério. O app cortou o ruído e me conectou só com quem estava na mesma página."' },
                { init: 'L', name: 'Lucas M.', sub: 'Rio de Janeiro · Camarote Black', text: '"A pior parte de conhecer gente nova é quando um quer uma coisa e o outro quer outra. No Camarote, eu joguei limpo sobre o que eu curto. Deu match com uma mulher que queria exatamente a mesma coisa."' },
                { init: 'F', name: 'Fernanda O.', sub: 'São Paulo · Plano Plus', text: '"Queria sair e me divertir, mas dava preguiça de chegar no encontro e descobrir que a química não rolava. A videochamada aqui mudou o jogo. Bati 40 minutos de papo, vi que a energia batia pela tela."' },
                { init: 'T', name: 'Thiago R.', sub: 'Curitiba · Camarote Black', text: '"Valorizo muito o meu tempo e gosto de proporcionar experiências exclusivas. O Camarote Black é perfeito porque atrai pessoas que buscam esse mesmo nível. A verificação rigorosa garante que os perfis são reais."' },
              ].map((t, i) => (
                <div key={i} className={`lp-testimonial lp-anim lp-delay-${(i % 2) + 1}`}>
                  <div className="lp-testimonial-stars">{Array(5).fill(0).map((_, j) => <IcStar key={j} />)}</div>
                  <div className="lp-testimonial-text">{t.text}</div>
                  <div className="lp-testimonial-author">
                    <div className="lp-testimonial-avatar">{t.init}</div>
                    <div className="lp-testimonial-info">
                      {t.name}
                      <span className="lp-testimonial-plan">{t.sub}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLANOS ── */}
        <section className="lp-section lp-section--dark" id="planos">
          <div className="lp-section-inner">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-label">Planos</span>
              <h2 className="lp-section-title">Escolha o seu plano.</h2>
              <p className="lp-section-sub" style={{ margin: '0 auto' }}>Todos os planos têm verificação biométrica, chat, videochamada e roleta diária. Cancele quando quiser.</p>
            </div>
            <div className="lp-plans">
              {/* Essencial */}
              <div className="lp-plan lp-anim lp-delay-1">
                <div className="lp-plan-name">Essencial</div>
                <div className="lp-plan-price"><span>R$</span>9,97</div>
                <div className="lp-plan-period">por mês</div>
                <div className="lp-plan-desc">Para começar a explorar</div>
                <ul className="lp-plan-features">
                  {['Verificação de identidade', '20 curtidas por dia', '1 supercurtida por dia', '1 giro na roleta diária', 'Videochamada até 1h/dia', 'Perfil verificado', 'Emblema de Fundador'].map(f => (
                    <li key={f}><IcCheck size={14} />{f}</li>
                  ))}
                </ul>
                <a href="/planos" className="lp-plan-cta lp-plan-cta--outline">Criar conta Essencial</a>
              </div>
              {/* Plus */}
              <div className="lp-plan lp-plan--featured lp-anim lp-delay-2">
                <div className="lp-plan-popular">Mais popular</div>
                <div className="lp-plan-name">Plus</div>
                <div className="lp-plan-price"><span>R$</span>39,97</div>
                <div className="lp-plan-period">por mês</div>
                <div className="lp-plan-desc">Para quem quer mais matches</div>
                <ul className="lp-plan-features">
                  {['Verificação de identidade', '50 curtidas por dia', '4 supercurtidas por dia', 'Ver quem curtiu você', 'Mais de 100 filtros avançados', 'Salas de bate-papo', 'Videochamada até 5h/dia', 'Destaque na busca', 'Emblema de Fundador'].map(f => (
                    <li key={f}><IcCheck size={14} />{f}</li>
                  ))}
                </ul>
                <a href="/planos" className="lp-plan-cta lp-plan-cta--primary">Assinar Plus</a>
              </div>
              {/* Black */}
              <div className="lp-plan lp-anim lp-delay-3" style={{ border: '1px solid var(--gold-border)' }}>
                <div className="lp-plan-name" style={{ color: 'var(--gold)' }}>Black</div>
                <div className="lp-plan-price"><span>R$</span>99,97</div>
                <div className="lp-plan-period">por mês</div>
                <div className="lp-plan-desc">Para quem não quer limites</div>
                <ul className="lp-plan-features">
                  {['Verificação de identidade', 'Curtidas ilimitadas', '10 supercurtidas por dia', 'Acesso ao Camarote', 'Filtros sugar e fetiche', '2 boosts simultâneos', 'Videochamada até 10h/dia', 'Suporte prioritário 24h', 'Emblema de Fundador'].map(f => (
                    <li key={f}><IcCheck size={14} />{f}</li>
                  ))}
                </ul>
                <a href="/planos" className="lp-plan-cta lp-plan-cta--gold">Assinar Black</a>
              </div>
            </div>
            <p className="lp-anim" style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--dim)' }}>
              Pagamento seguro via PIX ou cartão. Cancele a qualquer momento.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section">
          <div className="lp-section-inner" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="lp-section-label">Perguntas frequentes</span>
              <h2 className="lp-section-title">Ficou com dúvida?</h2>
            </div>
            <div className="lp-anim">
              {faqItems.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
            </div>
          </div>
        </section>

        {/* ── PWA ── */}
        <section className="lp-section lp-section--dark">
          <div className="lp-section-inner">
            <div className="lp-pwa lp-anim">
              {(installPrompt && !installDone) && (
                <button className="lp-btn-primary lp-magnetic" style={{ marginBottom: 24 }} onClick={handleInstall}>
                  Instalar no celular
                </button>
              )}
              {installDone && <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>Instalado com sucesso!</p>}
              <span className="lp-section-label">Baixe agora</span>
              <h2 className="lp-section-title" style={{ marginBottom: 8 }}>Direto no seu celular.</h2>
              <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>Ícone na tela inicial, notificações em tempo real. Sem precisar de loja de apps.</p>
              <div className="lp-pwa-steps">
                <div className="lp-pwa-step">
                  <div className="lp-pwa-step-os">Android (Chrome)</div>
                  <ol>
                    <li>Acesse meandyou.com.br pelo Chrome</li>
                    <li>Toque nos 3 pontos no canto superior</li>
                    <li>Selecione &quot;Adicionar à tela inicial&quot;</li>
                  </ol>
                </div>
                <div className="lp-pwa-step">
                  <div className="lp-pwa-step-os">iOS (Safari)</div>
                  <ol>
                    <li>Acesse meandyou.com.br pelo Safari</li>
                    <li>Toque no ícone de compartilhar</li>
                    <li>Selecione &quot;Adicionar à tela de início&quot;</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="lp-cta-final">
          <div className="lp-anim">
            <h2 className="lp-cta-final-title">Chega de apps que<br />não entendem você.</h2>
            <p className="lp-cta-final-sub">O MeAndYou é o único app brasileiro onde você pode ser exatamente quem você é — e encontrar pessoas reais que estão procurando o mesmo.</p>
            <a href="/planos" className="lp-btn-primary lp-magnetic" style={{ fontSize: 17, padding: '16px 36px' }}>
              Quero meu emblema de fundador <IcArrow />
            </a>
            <div className="lp-cta-final-proof">
              <span>Perfis verificados por biometria</span>
              <span>·</span>
              <span>Pagamento seguro</span>
              <span>·</span>
              <span>Cancele quando quiser</span>
              <span>·</span>
              <span>Lançamento 2026</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <a href="/" className="lp-footer-logo">MeAnd<span>You</span></a>
          <div className="lp-footer-links">
            <a href="/privacidade">Privacidade</a>
            <a href="/termos">Termos de uso</a>
            <a href="/ajuda">Ajuda</a>
            <a href="/fale-conosco">Contato</a>
            <a href="/suporte">Suporte</a>
          </div>
          <div className="lp-footer-copy">© 2026 MeAndYou. Todos os direitos reservados.</div>
        </footer>

        {/* ── NOTIFICAÇÕES ── */}
        <div className="lp-notif-wrap">
          {notifList.map(n => (
            <div key={n.id} className={`lp-notif ${n.exiting ? 'lp-notif--out' : ''}`}>{n.text}</div>
          ))}
        </div>

      </div>
    </>
  )
}

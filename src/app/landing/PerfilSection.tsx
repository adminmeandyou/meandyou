'use client'

import { useState } from 'react'

export default function PerfilSection() {
  const [perfMode, setPerfMode] = useState<'ind' | 'cas'>('ind')

  return (
    <section className="lp-perf-v2">
      <div className="lp-perf-v2-inner">
        <div className="lp-perf-v2-header lp-anim">
          <p className="lp-section-label">Perfil</p>
          <h2 className="lp-perf-v2-title">Você entra do jeito que faz sentido para você.</h2>
          <p className="lp-perf-v2-text">Individual ou casal. Você define sua forma de se apresentar e se conectar.</p>
        </div>
        <div className="lp-perf-v2-demo lp-anim">
          <div className="lp-perf-v2-toggle">
            <div className="lp-perf-v2-pill" style={{ left: perfMode === 'ind' ? 4 : 'calc(50% - 2px)' }} />
            <span className="lp-perf-v2-opt lp-perf-v2-opt--a" style={{ color: perfMode === 'ind' ? '#fff' : 'rgba(248,249,250,0.45)' }} onClick={() => setPerfMode('ind')}>Individual</span>
            <span className="lp-perf-v2-opt lp-perf-v2-opt--b" style={{ color: perfMode === 'cas' ? '#fff' : 'rgba(248,249,250,0.45)', display:'flex', alignItems:'center', gap:6 }} onClick={() => setPerfMode('cas')}>
              Casal
              <span style={{ fontSize:10, fontWeight:700, background:'var(--accent)', color:'#fff', borderRadius:6, padding:'1px 6px', letterSpacing:'0.05em' }}>BLACK</span>
            </span>
          </div>
          <div className="lp-perf-v2-card-wrap">
            <div className="lp-perf-v2-card lp-perf-v2-card--a" style={{ display: perfMode === 'cas' ? 'none' : 'flex' }}>
              <div className="lp-perf-v2-avatar" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div>
                <div className="lp-perf-v2-card-name">Sofia, 27</div>
                <div className="lp-perf-v2-card-sub">São Paulo · Escritora</div>
              </div>
            </div>
            <div className="lp-perf-v2-card lp-perf-v2-card--b" style={{ display: perfMode === 'ind' ? 'none' : 'flex' }}>
              <div className="lp-perf-v2-avatars">
                <div className="lp-perf-v2-avatar" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="lp-perf-v2-avatar lp-perf-v2-avatar--2" style={{ background: 'rgba(255,255,255,0.12)' }} />
              </div>
              <div>
                <div className="lp-perf-v2-card-name">Ana e Pedro</div>
                <div className="lp-perf-v2-card-sub">Rio de Janeiro · Casal</div>
              </div>
            </div>
          </div>
          {perfMode === 'cas' && (
            <p style={{ marginTop:16, fontSize:13, color:'var(--muted)', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Modo Casal é exclusivo do plano Black.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

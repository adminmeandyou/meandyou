'use client'

import { useState } from 'react'

export default function PerfilSection() {
  const [perfMode, setPerfMode] = useState<'ind' | 'cas'>('ind')

  return (
    <section className="lp-perf-v2">
      <div className="lp-perf-v2-inner">
        <div className="lp-perf-v2-header lp-anim">
          <p className="lp-section-label">Perfil</p>
          <h2 className="lp-perf-v2-title">Você entra do jeito<br />que faz sentido para você.</h2>
          <p className="lp-perf-v2-text">Individual ou casal. Você define sua forma de se apresentar e se conectar.</p>
        </div>
        <div className="lp-perf-v2-demo lp-anim">
          <div className="lp-perf-v2-toggle">
            <div className="lp-perf-v2-pill" style={{ left: perfMode === 'ind' ? 4 : 'calc(50%)' }} />
            <span className="lp-perf-v2-opt lp-perf-v2-opt--a" style={{ color: perfMode === 'ind' ? '#fff' : 'rgba(248,249,250,0.45)' }} onClick={() => setPerfMode('ind')}>Individual</span>
            <span className="lp-perf-v2-opt lp-perf-v2-opt--b" style={{ color: perfMode === 'cas' ? '#fff' : 'rgba(248,249,250,0.45)' }} onClick={() => setPerfMode('cas')}>Casal</span>
          </div>
          <div className="lp-perf-v2-card-wrap">
            <div className="lp-perf-v2-card lp-perf-v2-card--a" style={{ display: perfMode === 'cas' ? 'none' : 'flex' }}>
              <div className="lp-perf-v2-avatar" style={{ background: 'linear-gradient(135deg,#1a0a14,#3d1530)' }} />
              <div>
                <div className="lp-perf-v2-card-name">Sofia, 27</div>
                <div className="lp-perf-v2-card-sub">São Paulo · Escritora</div>
              </div>
            </div>
            <div className="lp-perf-v2-card lp-perf-v2-card--b" style={{ display: perfMode === 'ind' ? 'none' : 'flex' }}>
              <div className="lp-perf-v2-avatars">
                <div className="lp-perf-v2-avatar" style={{ background: 'linear-gradient(135deg,#0a1020,#1a2a4a)' }} />
                <div className="lp-perf-v2-avatar lp-perf-v2-avatar--2" style={{ background: 'linear-gradient(135deg,#1a0a14,#3d1530)' }} />
              </div>
              <div>
                <div className="lp-perf-v2-card-name">Ana e Pedro</div>
                <div className="lp-perf-v2-card-sub">Rio de Janeiro · Casal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

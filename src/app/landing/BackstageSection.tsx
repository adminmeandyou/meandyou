'use client'

import { useState } from 'react'

export default function BackstageSection() {
  const [backstageOpen, setBackstageOpen] = useState(false)

  return (
    <section className="lp-back-v2">
      <div className="lp-back-v2-inner">
        <div className="lp-anim">
          <span className="lp-back-v2-label">Backstage</span>
          <h2 className="lp-back-v2-title">Nem tudo é<br />para todo mundo.</h2>
          <p className="lp-back-v2-text">Existe um espaço reservado para quem busca experiências mais específicas, com mais liberdade e menos limitações.</p>
          <p className="lp-back-v2-comp">Aqui, você escolhe até o nível da experiência.</p>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:40, flexWrap:'wrap' }}>
            <a href="/planos" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'rgba(120,0,20,0.35)', border:'1px solid rgba(180,0,30,0.35)', color:'rgba(248,249,250,0.85)', fontSize:14, fontWeight:700, textDecoration:'none' }}>
              Ver o plano Black
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <div className="lp-back-v2-badge">
              <span className="lp-back-v2-badge-dot" />
              Exclusivo para plano Black
            </div>
          </div>
          <button
            onClick={() => setBackstageOpen(o => !o)}
            style={{ marginTop:24, background:'none', border:'1px solid rgba(180,0,30,0.30)', borderRadius:10, color:'rgba(248,249,250,0.60)', fontSize:13, fontWeight:600, padding:'10px 20px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-jakarta), sans-serif', transition:'color 0.2s, border-color 0.2s' }}
          >
            {backstageOpen ? 'Fechar' : 'Saiba mais sobre o Backstage'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: backstageOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.3s' }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {backstageOpen && (
            <div style={{ marginTop:16, padding:'20px 24px', borderRadius:14, background:'rgba(120,0,20,0.12)', border:'1px solid rgba(180,0,30,0.20)', maxWidth:520 }}>
              <p style={{ fontSize:14, color:'rgba(248,249,250,0.65)', lineHeight:1.75, margin:0 }}>
                O Backstage e a area privada exclusiva do plano Black. Aqui voce encontra perfis com intencoes especificas que nao aparecem em nenhum outro lugar: Sugar, Swing, Fetiches, BDSM e Poliamor. A regra e simples: voce so ve quem marcou as mesmas intencoes. Zero exposicao, zero julgamento.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

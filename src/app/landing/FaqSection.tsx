'use client'

import { useState } from 'react'
import { faqItems as faqFallback } from './data'

type FaqEntry = { q: string; a: string }

interface FaqProps {
  items?: FaqEntry[]
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 0' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', fontWeight: 600, fontSize: '15px', color: '#F8F9FA',
          fontFamily: "var(--font-jakarta), sans-serif", textAlign: 'left', padding: 0,
        }}
      >
        {pergunta}
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: aberto ? '#E11D48' : 'rgba(225,29,72,0.12)',
          border: '1px solid rgba(225,29,72,0.3)',
          color: aberto ? '#fff' : '#E11D48',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0, fontWeight: 700,
          transform: aberto ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.3s, background 0.2s, color 0.2s',
        }}>+</span>
      </button>
      {aberto && (
        <p style={{
          fontSize: '14px', color: 'rgba(248,249,250,0.55)',
          lineHeight: 1.75, marginTop: '14px', paddingRight: '44px',
        }}>{resposta}</p>
      )}
    </div>
  )
}

export default function FaqSection({ items }: FaqProps = {}) {
  const list = items && items.length > 0 ? items : faqFallback
  return (
    <section className="lp-faq">
      <div className="lp-faq-inner">
        <p className="lp-section-label">FAQ</p>
        <h2 className="lp-section-title">Dúvidas frequentes</h2>
        <div className="lp-faq-list">
          {list.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
        </div>
      </div>
    </section>
  )
}

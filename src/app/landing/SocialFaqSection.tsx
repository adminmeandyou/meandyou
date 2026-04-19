'use client'

import { useState } from 'react'
import { faqItems as faqFallback } from './data'

type FaqEntry = { q: string; a: string }

const depoimentos = [
  { avatarCls: 'a', name: 'Mariana, 34', txt: 'Finalmente um app em que não preciso ficar adivinhando o que a pessoa quer. Todo mundo já entra sabendo.' },
  { avatarCls: 'b', name: 'Rafael, 41', txt: 'Os filtros são o que fazem a diferença. Zero perda de tempo com perfis que não fazem sentido.' },
  { avatarCls: 'c', name: 'Camila, 29', txt: 'A videochamada antes de encontrar alguém foi um divisor de águas. Cheguei no café sem nenhuma surpresa.' },
  { avatarCls: 'd', name: 'Thiago, 43', txt: 'Matching por intenção real muda tudo. Sem joguinho, sem ambiguidade. Direto ao ponto.' },
]

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
      <button
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontWeight: 600, fontSize: 14, color: '#F8F9FA', fontFamily: 'var(--font-jakarta), sans-serif', textAlign: 'left', padding: 0 }}
      >
        {pergunta}
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: aberto ? '#E11D48' : 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.3)', color: aberto ? '#fff' : '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, fontWeight: 700, transform: aberto ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s, background 0.2s' }}>+</span>
      </button>
      {aberto && (
        <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.55)', lineHeight: 1.75, marginTop: 12, paddingRight: 40 }}>{resposta}</p>
      )}
    </div>
  )
}

export default function SocialFaqSection({ items }: { items?: FaqEntry[] }) {
  const list = items && items.length > 0 ? items : faqFallback

  return (
    <section style={{ padding: '100px 56px', background: 'var(--bg)', borderTop: '1px solid var(--border-premium)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

        {/* Depoimentos */}
        <div className="lp-anim">
          <p className="lp-section-label">O que dizem</p>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 36 }}>
            Quem entrou,<br />não quer sair.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {depoimentos.map((m, i) => (
              <div key={i} className="lp-anim" style={{ animationDelay: `${i * 100}ms`, background: 'var(--bg-card)', border: '1px solid var(--border-premium)', borderRadius: 16, padding: '20px 22px' }}>
                <p style={{ fontSize: 14, color: 'rgba(248,249,250,0.72)', lineHeight: 1.75, marginBottom: 14, fontStyle: 'italic' }}>&ldquo;{m.txt}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`lp-social-v2-avatar lp-social-v2-avatar--${m.avatarCls}`} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,249,250,0.50)' }}>{m.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="lp-anim" style={{ transitionDelay: '0.1s' }}>
          <p className="lp-section-label">FAQ</p>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 36 }}>
            Dúvidas<br />frequentes.
          </h2>
          <div>
            {list.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
          </div>
        </div>

      </div>
    </section>
  )
}

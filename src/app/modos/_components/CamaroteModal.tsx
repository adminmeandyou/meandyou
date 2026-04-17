'use client'

import { Crown } from 'lucide-react'

export function CamaroteModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={26} strokeWidth={1.5} color="#F59E0B" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: 0 }}>Camarote</h2>
            <p style={{ fontSize: 12, color: '#F59E0B', margin: '2px 0 0', fontWeight: 600 }}>Exclusivo para assinantes Black</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Um ambiente reservado para quem busca experiências além do convencional. Dentro do Camarote você encontra perfis e filtros que não existem em nenhum outro lugar do app.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Sugar', desc: 'Encontros com benefícios mútuos', color: '#ec4899' },
            { label: 'Fetiche', desc: 'Interesses e estilos de vida alternativos', color: '#a855f7' },
            { label: 'Chat VIP', desc: 'Salas exclusivas para assinantes Black', color: '#F59E0B' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="/planos"
          style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 14, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, textAlign: 'center', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
        >
          Fazer upgrade para Black
        </a>
        <button onClick={onClose} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  )
}

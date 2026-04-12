'use client'

import { ShieldX } from 'lucide-react'

export default function BanidoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-jakarta)' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldX size={28} color="#f87171" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', margin: '0 0 12px' }}>Conta suspensa</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
          Sua conta foi suspensa por violar os termos de uso do MeAndYou. Se acredita que isso é um erro, entre em contato com o suporte.
        </p>
        <a
          href="mailto:suporte@meandyou.com.br"
          style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', transition: 'color 0.2s' }}
        >
          Entrar em contato com o suporte
        </a>
      </div>
    </div>
  )
}

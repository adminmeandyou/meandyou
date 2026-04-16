'use client'

import { useState } from 'react'
import { ArrowLeft, Crown, Shield, Check } from 'lucide-react'
import { SAFETY_ITEMS, G, G_SOFT, G_BORDER, G_BORDER2, BG, BG_CARD_GRADIENT } from './helpers'

interface Props {
  onAccept: () => void
  onBack: () => void
}

export default function CamaroteTerms({ onAccept, onBack }: Props) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--font-jakarta)', paddingBottom: 32 }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER2}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={18} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff' }}>Camarote Black</span>
      </header>

      <div style={{ padding: '32px 24px 24px' }}>
        {/* Titulo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={24} color={G} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#fff', margin: '0 0 8px' }}>
            Antes de entrar
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            O Camarote é um ambiente adulto e privado. Leia com atenção antes de continuar.
          </p>
        </div>

        {/* Lista de termos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {SAFETY_ITEMS.map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, background: BG_CARD_GRADIENT, border: `1px solid rgba(255,255,255,0.06)`, boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: G_SOFT, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={G} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.55, margin: 0, paddingTop: 6 }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, cursor: 'pointer' }}>
          <div
            onClick={() => setAccepted(a => !a)}
            style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: accepted ? G : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${accepted ? G : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {accepted && <Check size={13} color="#fff" strokeWidth={2.5} />}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 1.55 }}>
            Li e compreendo as recomendações de segurança. Estou ciente de que o Camarote é um ambiente para adultos maiores de 18 anos.
          </span>
        </label>

        {/* Botao */}
        <button
          onClick={onAccept}
          disabled={!accepted}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
            cursor: accepted ? 'pointer' : 'not-allowed',
            background: accepted ? `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)` : 'rgba(255,255,255,0.05)',
            color: accepted ? '#fff' : 'rgba(255,255,255,0.20)',
            border: 'none', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          Entrar no Camarote
        </button>
      </div>
    </div>
  )
}

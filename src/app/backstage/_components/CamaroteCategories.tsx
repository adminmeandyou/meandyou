'use client'

import { useState } from 'react'
import { ArrowLeft, Crown, Check, Loader2 } from 'lucide-react'
import { CATEGORIAS, G, G_SOFT, G_BORDER, G_BORDER2, BG } from './helpers'

interface Props {
  initial: string[]
  onSave: (cats: string[]) => Promise<void>
  onBack: () => void
}

export default function CamaroteCategories({ initial, onSave, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    if (selected.length === 0) return
    setSaving(true)
    await onSave(selected)
    setSaving(false)
  }

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
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
            No que você tem interesse?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6, margin: 0 }}>
            Selecione tudo que você está aberto(a) a explorar. Você aparecerá na vitrine apenas para quem compartilha seus interesses.
          </p>
        </div>

        {/* Grid de categorias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {CATEGORIAS.map(({ key, label }) => {
            const active = selected.includes(key)
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  border: `1.5px solid ${active ? G : 'rgba(255,255,255,0.08)'}`,
                  background: active ? G_SOFT : 'rgba(255,255,255,0.03)',
                  color: active ? G : 'rgba(255,255,255,0.50)',
                  fontFamily: 'var(--font-jakarta)',
                  fontWeight: active ? 700 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span>{label}</span>
                {active && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#fff" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Nota */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55, margin: 0 }}>
            Você pode alterar seus interesses a qualquer momento voltando aqui. Quanto mais categorias, mais perfis você verá na vitrine.
          </p>
        </div>

        {/* Botao */}
        <button
          onClick={handleSave}
          disabled={selected.length === 0 || saving}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
            cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            background: selected.length > 0 ? `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)` : 'rgba(255,255,255,0.05)',
            color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.20)',
            border: 'none', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving
            ? <Loader2 size={18} className="animate-spin" />
            : `Entrar no Camarote${selected.length > 0 ? ` (${selected.length})` : ''}`
          }
        </button>
      </div>
    </div>
  )
}

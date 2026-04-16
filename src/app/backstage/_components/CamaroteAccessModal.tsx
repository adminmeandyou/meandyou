'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  X, CheckCircle, Crown, Check, AlertTriangle, Loader2,
} from 'lucide-react'
import { CATEGORIAS, G, G_SOFT, G_BORDER, G_BORDER2, BG_CARD } from './helpers'

interface Props {
  user: any
  plan: 'plus' | 'essencial'
  onClose: () => void
}

export default function CamaroteAccessModal({ user, plan, onClose }: Props) {
  const [selectedCat, setSelectedCat] = useState<string>('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!user || !selectedCat || !accepted) return
    setLoading(true)
    try {
      const { error } = await supabase.rpc('create_access_request', {
        p_requester_id: user.id,
        p_category: selectedCat,
        p_tier: plan === 'plus' ? 'premium' : 'basic',
      })
      if (!error) setSent(true)
    } catch {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 480, background: BG_CARD, borderRadius: '24px 24px 0 0', borderTop: `1px solid ${G_BORDER2}`, maxHeight: '92vh', overflowY: 'auto', animation: 'ui-slide-up 0.25s ease' }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', margin: '16px auto 0' }} />

        <div style={{ padding: '20px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#fff', margin: 0 }}>Como funciona o acesso</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="rgba(255,255,255,0.40)" />
            </button>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={48} color={G} strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff', margin: '0 0 8px' }}>Pedido enviado!</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6, margin: 0 }}>
                Assinantes Black da categoria <strong style={{ color: G }}>{CATEGORIAS.find(c => c.key === selectedCat)?.label}</strong> foram notificados. Se alguém pagar, você receberá uma notificação para iniciar a conversa.
              </p>
            </div>
          ) : (
            <>
              {/* Secao 1: o que recebe sendo resgatado */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: G, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>O que você recebe sendo resgatado</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Um assinante Black usa fichas para iniciar uma conversa com você',
                    'Você e o resgatador terão acesso ao chat exclusivo do Camarote por 30 dias',
                    'O que acontece depende da conversa entre vocês, não é garantia de nada',
                    'Assinantes Black da sua categoria são notificados assim que você pede acesso',
                    'Quem pagar primeiro tem acesso: os demais não veem mais o seu pedido',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={14} color={G} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secao 2: com o Black voce teria */}
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>Com o plano Black você teria</p>
                {[
                  'Acesso completo a vitrine do Camarote',
                  'Interação com todos os Black disponíveis',
                  'Categorias de fetiche e Sugar desbloqueadas',
                  'Chat exclusivo preto e dourado',
                  'Curtidas ilimitadas, SuperCurtidas, Boosts e muito mais',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < 4 ? 6 : 0 }}>
                    <Crown size={12} color={G} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '12px 0 0', fontStyle: 'italic' }}>
                  Ser resgatado é apenas um gostinho. Não tem comparação com ser assinante Black.
                </p>
              </div>

              {/* Aviso importante */}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: `1px solid ${G_BORDER}`, marginBottom: 20, display: 'flex', gap: 10 }}>
                <AlertTriangle size={15} color={G} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.80)', lineHeight: 1.55, margin: 0 }}>
                  <strong>Importante:</strong> isso não é uma compra de serviço. O assinante está pagando para iniciar uma conversa, não por qualquer ato. O que acontece entre vocês é resultado da troca e da conexão, não de uma transação.
                </p>
              </div>

              {/* Selecao de categoria */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>Em qual categoria você quer entrar?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCat(cat.key)}
                      style={{
                        padding: '11px 10px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${selectedCat === cat.key ? G : 'rgba(255,255,255,0.08)'}`,
                        background: selectedCat === cat.key ? G_SOFT : 'rgba(255,255,255,0.03)',
                        color: selectedCat === cat.key ? G : 'rgba(255,255,255,0.40)',
                        fontFamily: 'var(--font-jakarta)', fontWeight: selectedCat === cat.key ? 700 : 400,
                        fontSize: 13, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <div
                  onClick={() => setAccepted(a => !a)}
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: accepted ? G : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${accepted ? G : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {accepted && <Check size={12} color="#fff" strokeWidth={2.5} />}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', lineHeight: 1.55 }}>
                  Entendo que isso não é uma compra de serviço e que o resultado depende da troca entre nós dois.
                </span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={!selectedCat || !accepted || loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 16, border: 'none', cursor: selectedCat && accepted ? 'pointer' : 'not-allowed',
                  background: selectedCat && accepted ? `linear-gradient(135deg, #c9a84c, ${G})` : 'rgba(255,255,255,0.05)',
                  color: selectedCat && accepted ? '#fff' : 'rgba(255,255,255,0.20)',
                  fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar pedido de acesso'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { Coins, Loader2, X } from 'lucide-react'
import { StoreItem } from './helpers'

export function PurchaseSheet({
  item,
  qty,
  fichas,
  onConfirm,
  onClose,
  loading,
}: {
  item: StoreItem
  qty: number
  fichas: number
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  const total = item.baseFichas * qty
  const canAfford = fichas >= total
  const qtyLabel = qty > 1 ? `${qty}x ${item.unit}` : `1 ${item.unit}`

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: '0 0 0 0', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'all', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 20px 40px', animation: 'slideUp 0.25s ease-out' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.accentColor, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>{item.description}</p>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, backgroundColor: canAfford ? 'rgba(245,158,11,0.08)' : 'rgba(225,29,72,0.08)', border: `1px solid ${canAfford ? 'rgba(245,158,11,0.25)' : 'rgba(225,29,72,0.25)'}`, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Comprando</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '2px 0 0' }}>{qtyLabel}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 2 }}>
                <Coins size={15} color="#F59E0B" strokeWidth={1.5} />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{total}</span>
                <span style={{ fontSize: 12, color: 'rgba(245,158,11,0.6)' }}>fichas</span>
              </div>
              {qty > 1 && <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.30)' }}>{item.baseFichas} cada</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Seu saldo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Coins size={13} color={canAfford ? '#F59E0B' : '#f87171'} strokeWidth={1.5} />
              <span style={{ fontSize: 14, fontWeight: 600, color: canAfford ? '#F59E0B' : '#f87171' }}>{fichas} fichas</span>
            </div>
          </div>

          {canAfford ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: loading ? 'rgba(225,29,72,0.40)' : 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Coins size={18} strokeWidth={1.5} />}
              {loading ? 'Processando...' : `Confirmar (${total} fichas)`}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#f87171', margin: 0 }}>
                Fichas insuficientes: faltam {total - fichas} fichas
              </p>
              <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
                Comprar fichas acima
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

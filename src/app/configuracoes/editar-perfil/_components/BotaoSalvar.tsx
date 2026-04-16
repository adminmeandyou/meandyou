'use client'

import { Check } from 'lucide-react'

export function BotaoSalvar({ loading, sucesso, onClick }: { loading: boolean; sucesso: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        marginTop: '8px', width: '100%', padding: '13px', borderRadius: '14px', border: sucesso ? '1px solid rgba(16,185,129,0.30)' : 'none',
        backgroundColor: sucesso ? 'rgba(16,185,129,0.15)' : '#E11D48',
        color: sucesso ? '#10b981' : '#fff', fontWeight: 700, fontSize: '14px',
        fontFamily: 'var(--font-jakarta)', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {loading ? (
        <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.25)', borderTop: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : sucesso ? (
        <><Check size={16} /> Salvo!</>
      ) : 'Salvar'}
    </button>
  )
}

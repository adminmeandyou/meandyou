'use client'

import { Check } from 'lucide-react'

export function TagChip({ label, ativo, onClick, desabilitado }: {
  label: string; ativo?: boolean; onClick?: () => void; desabilitado?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      style={{
        padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
        border: `1.5px solid ${ativo ? 'rgba(225,29,72,0.30)' : 'rgba(255,255,255,0.07)'}`,
        backgroundColor: ativo ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.04)',
        color: ativo ? '#E11D48' : desabilitado ? 'rgba(248,249,250,0.20)' : 'rgba(248,249,250,0.55)',
        cursor: desabilitado ? 'not-allowed' : 'pointer',
        opacity: desabilitado ? 0.35 : 1,
        display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {ativo && <Check size={12} />}
      {label}
    </button>
  )
}

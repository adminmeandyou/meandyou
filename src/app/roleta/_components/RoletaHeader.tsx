'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket } from 'lucide-react'

type Props = {
  tickets: number
  loading: boolean
}

export default function RoletaHeader({ tickets, loading }: Props) {
  const router = useRouter()

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={() => router.back()}
        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
      </button>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Roleta</h1>
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0' }}>Gire e ganhe prêmios todos os dias</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', backgroundColor: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.25)', flexShrink: 0 }}>
        <Ticket size={13} color="#eab308" strokeWidth={1.5} />
        <span style={{ fontSize: '13px', color: '#eab308', fontWeight: 700 }}>{loading ? '...' : tickets}</span>
      </div>
    </header>
  )
}

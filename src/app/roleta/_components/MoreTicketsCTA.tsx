'use client'

export default function MoreTicketsCTA() {
  return (
    <div style={{ width: '100%', borderRadius: '16px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px' }}>Quer mais giros?</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/indicar" style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
          Indicar amigos (+5 tickets)
        </a>
        <a href="/streak" style={{ padding: '9px 18px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', fontWeight: 600 }}>
          Prêmios diários
        </a>
      </div>
    </div>
  )
}

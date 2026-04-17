'use client'

import { CheckCircle2, Phone } from 'lucide-react'

export function CheckinModal({
  otherName,
  checkinMeeting,
  onCheckinBem,
}: {
  otherName: string
  checkinMeeting: { id: string; local: string; date: string }
  onCheckinBem: () => void
}) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:70,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.90)',backdropFilter:'blur(12px)',padding:20 }}>
      <div style={{ background:'var(--bg-card)',border:'1px solid rgba(225,29,72,0.30)',borderRadius:24,padding:'32px 24px',maxWidth:340,width:'100%',textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:16 }}>🔔</div>
        <h3 style={{ fontFamily:'var(--font-fraunces)',fontSize:22,color:'var(--text)',margin:'0 0 8px' }}>Check-in de segurança</h3>
        <p style={{ fontSize:13,color:'var(--muted)',margin:'0 0 6px',lineHeight:1.55 }}>Você tinha um encontro com <strong style={{ color:'rgba(248,249,250,0.75)' }}>{otherName}</strong></p>
        <p style={{ fontSize:12,color:'var(--muted-2)',margin:'0 0 28px' }}>{checkinMeeting.local} · {new Date(checkinMeeting.date).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
        <p style={{ fontSize:14,color:'var(--text)',fontWeight:600,margin:'0 0 20px' }}>Como você está?</p>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button onClick={onCheckinBem} style={{ width:'100%',padding:'15px 0',borderRadius:14,background:'#10b981',border:'none',color:'#fff',fontFamily:'var(--font-jakarta)',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
            <CheckCircle2 size={18} />
            Estou bem
          </button>
          <a href="tel:190" style={{ width:'100%',padding:'15px 0',borderRadius:14,background:'var(--accent)',border:'none',color:'#fff',fontFamily:'var(--font-jakarta)',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,textDecoration:'none' }}>
            <Phone size={18} />
            Preciso de ajuda (190)
          </a>
        </div>
      </div>
    </div>
  )
}

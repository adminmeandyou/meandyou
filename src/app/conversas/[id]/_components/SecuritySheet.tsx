'use client'

import { ArrowLeft, Shield, ShieldAlert, HeartCrack, Phone } from 'lucide-react'

export function SecuritySheet({
  otherName,
  unmatchConfirm,
  setUnmatchConfirm,
  onClose,
  onReport,
  onUnmatch,
}: {
  otherName: string
  unmatchConfirm: boolean
  setUnmatchConfirm: (v: boolean) => void
  onClose: () => void
  onReport: () => void
  onUnmatch: () => void
}) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:60,background:'var(--bg)',overflow:'auto' }}>
      {/* Header */}
      <header style={{
        position:'sticky',top:0,zIndex:10,
        background:'rgba(8,9,14,0.92)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'14px 20px',display:'flex',alignItems:'center',gap:12,
      }}>
        <button onClick={() => { onClose(); setUnmatchConfirm(false) }} style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
          <ArrowLeft size={18} color="var(--muted)" />
        </button>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <Shield size={16} color="var(--muted)" strokeWidth={1.5} />
          <h1 style={{ fontFamily:'var(--font-fraunces)',fontSize:20,color:'var(--text)',margin:0 }}>Central de seguranca</h1>
        </div>
      </header>

      <div style={{ padding:'24px 20px',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column',gap:12 }}>
        {/* Info */}
        <p style={{ fontSize:13,color:'var(--muted-2)',margin:'0 0 8px',lineHeight:1.5 }}>
          Gerencie sua seguranca nesta conversa com {otherName}. Todas as acoes sao confidenciais.
        </p>

        {/* Denunciar */}
        <button onClick={onReport} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',borderRadius:16,background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><ShieldAlert size={20} color="#ef4444" strokeWidth={1.5} /></div>
          <div style={{ textAlign:'left',flex:1 }}>
            <p style={{ fontSize:15,fontWeight:600,color:'var(--text)',margin:0 }}>Denunciar {otherName}</p>
            <p style={{ fontSize:12,color:'var(--muted-2)',margin:'3px 0 0' }}>Perfil falso, assedio, golpe, comportamento inadequado</p>
          </div>
        </button>

        {/* Desfazer match */}
        {unmatchConfirm ? (
          <div style={{ padding:'20px',borderRadius:16,background:'rgba(225,29,72,0.06)',border:'1px solid rgba(225,29,72,0.20)' }}>
            <p style={{ fontSize:14,color:'var(--text)',margin:'0 0 4px',fontWeight:600,textAlign:'center' }}>Desfazer match?</p>
            <p style={{ fontSize:13,color:'var(--muted-2)',margin:'0 0 16px',textAlign:'center' }}>O chat sera encerrado e esta pessoa voltara para o final da sua fila.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setUnmatchConfirm(false)} style={{ flex:1,padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,cursor:'pointer',fontFamily:'var(--font-jakarta)',fontWeight:600 }}>Cancelar</button>
              <button onClick={onUnmatch} style={{ flex:1,padding:'12px',borderRadius:12,background:'linear-gradient(135deg, #E11D48, #be123c)',border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>Desfazer</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setUnmatchConfirm(true)} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',borderRadius:16,background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font-jakarta)' }}>
            <div style={{ width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><HeartCrack size={20} color="rgba(248,249,250,0.50)" strokeWidth={1.5} /></div>
            <div style={{ textAlign:'left',flex:1 }}>
              <p style={{ fontSize:15,fontWeight:600,color:'var(--text)',margin:0 }}>Desfazer match</p>
              <p style={{ fontSize:12,color:'var(--muted-2)',margin:'3px 0 0' }}>Encerrar conversa imediatamente</p>
            </div>
          </button>
        )}

        {/* Emergencia */}
        <a href="tel:190" style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',borderRadius:16,background:'rgba(225,29,72,0.06)',border:'1px solid rgba(225,29,72,0.20)',textDecoration:'none',marginTop:8 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'rgba(225,29,72,0.12)',border:'1px solid rgba(225,29,72,0.30)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Phone size={20} color="#F43F5E" strokeWidth={1.5} /></div>
          <div style={{ textAlign:'left',flex:1 }}>
            <p style={{ fontSize:15,fontWeight:600,color:'#F43F5E',margin:0 }}>Ligar 190</p>
            <p style={{ fontSize:12,color:'var(--muted-2)',margin:'3px 0 0' }}>Policia Militar - emergencia real</p>
          </div>
        </a>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { X, MapPin, CheckCircle2 } from 'lucide-react'

export function MeetingModal({
  otherName,
  meetingSaved,
  meetingLocal,
  meetingDateVal,
  meetingTimeVal,
  meetingCep,
  meetingRua,
  meetingNumero,
  meetingBairro,
  meetingCidade,
  meetingUf,
  cepLoading,
  cepError,
  meetingPlaceSuggestions,
  showMeetingPlaces,
  onClose,
  onSave,
  onPlaceSearch,
  onSelectPlace,
  onCepLookup,
  setMeetingDateVal,
  setMeetingTimeVal,
  setMeetingRua,
  setMeetingNumero,
  setMeetingBairro,
  setMeetingCidade,
  setMeetingUf,
  setShowMeetingPlaces,
}: {
  otherName: string
  meetingSaved: boolean
  meetingLocal: string
  meetingDateVal: string
  meetingTimeVal: string
  meetingCep: string
  meetingRua: string
  meetingNumero: string
  meetingBairro: string
  meetingCidade: string
  meetingUf: string
  cepLoading: boolean
  cepError: string
  meetingPlaceSuggestions: Array<{ display_name: string; name: string; address: any }>
  showMeetingPlaces: boolean
  onClose: () => void
  onSave: () => void
  onPlaceSearch: (query: string) => void
  onSelectPlace: (place: any) => void
  onCepLookup: (raw: string) => void
  setMeetingDateVal: (v: string) => void
  setMeetingTimeVal: (v: string) => void
  setMeetingRua: (v: string) => void
  setMeetingNumero: (v: string) => void
  setMeetingBairro: (v: string) => void
  setMeetingCidade: (v: string) => void
  setMeetingUf: (v: string) => void
  setShowMeetingPlaces: (v: boolean) => void
}) {
  const canSave = meetingLocal.trim() && meetingDateVal && meetingTimeVal
  const inputStyle: React.CSSProperties = {
    width:'100%',
    background:'transparent',
    border:'none',
    borderBottom:'1px solid rgba(255,255,255,0.12)',
    borderRadius:0,
    padding:'10px 2px',
    fontSize:15,
    color:'var(--text)',
    fontFamily:'var(--font-jakarta)',
    boxSizing:'border-box',
    outline:'none',
    transition:'border-color 220ms cubic-bezier(0.4,0,0.2,1)',
  }
  const onFocusInput = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderBottomColor = 'var(--accent)' }
  const onBlurInput = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.12)' }
  const labelStyle: React.CSSProperties = {
    fontSize:10,
    color:'rgba(255,255,255,0.45)',
    display:'block',
    marginBottom:8,
    fontFamily:'var(--font-jakarta)',
    fontWeight:600,
    textTransform:'uppercase',
    letterSpacing:'0.16em',
  }

  return (
    <div
      style={{
        position:'fixed',inset:0,zIndex:60,
        display:'flex',alignItems:'center',justifyContent:'center',
        padding:20,
        background:'radial-gradient(ellipse at center, rgba(225,29,72,0.18), rgba(0,0,0,0.92) 65%)',
        backdropFilter:'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        animation:'ui-fade-in 260ms cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position:'relative',
          background:'rgba(15,17,23,0.95)',
          border:'1px solid rgba(255,255,255,0.05)',
          borderRadius:24,
          padding:'32px 26px 28px',
          width:'100%',
          maxWidth:440,
          maxHeight:'calc(100vh - 40px)',
          overflowY:'auto',
          boxShadow:'0 20px 40px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position:'absolute',top:16,right:16,
            width:32,height:32,borderRadius:'50%',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.06)',
            display:'flex',alignItems:'center',justifyContent:'center',
            cursor:'pointer',padding:0,
          }}
        >
          <X size={14} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>

        {meetingSaved ? (
          <div style={{ textAlign:'center',padding:'28px 8px 8px' }}>
            <CheckCircle2 size={44} color="#10b981" strokeWidth={1.5} style={{ margin:'0 auto 18px' }} />
            <h3 style={{ fontFamily:'var(--font-fraunces)',fontStyle:'italic',fontSize:28,fontWeight:400,color:'var(--text)',margin:'0 0 10px',lineHeight:1.15 }}>
              Registro <span style={{ color:'#F43F5E' }}>salvo</span>.
            </h3>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.5)',margin:0,lineHeight:1.6 }}>Faremos um check-in com voce depois do horario marcado.</p>
          </div>
        ) : (
          <>
            <h2 style={{
              fontFamily:'var(--font-fraunces)',
              fontStyle:'italic',
              fontSize:32,
              fontWeight:400,
              color:'var(--text)',
              margin:'4px 0 6px',
              lineHeight:1.1,
              letterSpacing:'-0.01em',
            }}>
              Registrar <span style={{ color:'#F43F5E' }}>encontro</span>?
            </h2>
            <p style={{
              fontSize:13,
              color:'rgba(255,255,255,0.45)',
              margin:'0 0 28px',
              lineHeight:1.55,
              fontFamily:'var(--font-jakarta)',
            }}>
              Com <span style={{ color:'rgba(255,255,255,0.75)' }}>{otherName}</span>. Fica so no seu dispositivo.
            </p>

            <div style={{ marginBottom:24 }}>
              <div style={labelStyle}>Onde?</div>
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <div style={{ position:'relative' }}>
                  <input
                    value={meetingLocal}
                    onChange={e => onPlaceSearch(e.target.value)}
                    onFocus={() => { if (meetingPlaceSuggestions.length > 0) setShowMeetingPlaces(true) }}
                    placeholder="Buscar local, restaurante, shopping..."
                    autoFocus
                    autoComplete="off"
                    style={inputStyle}
                    onBlur={e => { onBlurInput(e); setTimeout(() => setShowMeetingPlaces(false), 200) }}
                  />
                  {showMeetingPlaces && meetingPlaceSuggestions.length > 0 && (
                    <div style={{
                      position:'absolute', left:0, right:0, top:'100%', zIndex:30,
                      background:'rgba(15,17,23,0.98)', border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:12, marginTop:4, overflow:'hidden',
                      maxHeight:200, overflowY:'auto',
                      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      {meetingPlaceSuggestions.map((place, i) => {
                        const addr = place.address || {}
                        const nome = place.name || ''
                        const cidade = addr.city || addr.town || addr.village || addr.municipality || ''
                        const estado = addr.state || ''
                        const bairro = addr.suburb || addr.neighbourhood || ''
                        const sub = [bairro, cidade, estado].filter(Boolean).join(', ')
                        return (
                          <button
                            key={i}
                            onMouseDown={e => { e.preventDefault(); onSelectPlace(place) }}
                            style={{
                              width:'100%', display:'flex', alignItems:'flex-start', gap:10,
                              padding:'11px 14px', background:'transparent',
                              border:'none', borderBottom: i < meetingPlaceSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                              cursor:'pointer', textAlign:'left',
                              fontFamily:'var(--font-jakarta)',
                            }}
                          >
                            <MapPin size={14} color="var(--accent)" strokeWidth={1.5} style={{ flexShrink:0, marginTop:2 }} />
                            <div style={{ minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nome || place.display_name.split(',')[0]}</p>
                              {sub && <p style={{ fontSize:11, color:'var(--muted)', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</p>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <input
                  value={meetingCep}
                  onChange={e => onCepLookup(e.target.value)}
                  placeholder={cepLoading ? 'Buscando CEP...' : cepError ? cepError : 'CEP'}
                  inputMode="numeric"
                  maxLength={9}
                  style={{
                    ...inputStyle,
                    color: cepError ? '#F43F5E' : cepLoading ? 'var(--accent)' : 'var(--text)',
                  }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
                <div style={{ display:'flex',gap:14 }}>
                  <input
                    value={meetingRua}
                    onChange={e => setMeetingRua(e.target.value)}
                    placeholder="Rua / Avenida"
                    style={{ ...inputStyle, flex:2 }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                  <input
                    value={meetingNumero}
                    onChange={e => setMeetingNumero(e.target.value)}
                    placeholder="No"
                    inputMode="numeric"
                    style={{ ...inputStyle, flex:1 }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                </div>
                <input
                  value={meetingBairro}
                  onChange={e => setMeetingBairro(e.target.value)}
                  placeholder="Bairro"
                  style={inputStyle}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
                <div style={{ display:'flex',gap:14 }}>
                  <input
                    value={meetingCidade}
                    onChange={e => setMeetingCidade(e.target.value)}
                    placeholder="Cidade"
                    style={{ ...inputStyle, flex:2 }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                  <input
                    value={meetingUf}
                    onChange={e => setMeetingUf(e.target.value.toUpperCase().slice(0,2))}
                    placeholder="UF"
                    maxLength={2}
                    style={{ ...inputStyle, flex:1, textTransform:'uppercase' }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom:28 }}>
              <div style={labelStyle}>Quando?</div>
              <div style={{ display:'flex',gap:14 }}>
                <input
                  type="date"
                  value={meetingDateVal}
                  onChange={e => setMeetingDateVal(e.target.value)}
                  style={{ ...inputStyle, flex:1, colorScheme:'dark' }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
                <input
                  type="time"
                  value={meetingTimeVal}
                  onChange={e => setMeetingTimeVal(e.target.value)}
                  style={{ ...inputStyle, flex:1, colorScheme:'dark' }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
            </div>

            <p style={{
              fontSize:11,
              color:'rgba(255,255,255,0.35)',
              lineHeight:1.6,
              margin:'0 0 22px',
              fontFamily:'var(--font-jakarta)',
              textAlign:'center',
            }}>
              Faremos um check-in 2h apos o horario marcado.
            </p>

            <button
              onClick={onSave}
              disabled={!canSave}
              style={{
                width:'100%',
                padding:'16px 0',
                borderRadius:100,
                background: canSave ? 'linear-gradient(135deg, #E11D48, #be123c)' : 'rgba(255,255,255,0.06)',
                border:'none',
                color: canSave ? '#fff' : 'rgba(255,255,255,0.35)',
                fontFamily:'var(--font-jakarta)',
                fontSize:12,
                fontWeight:700,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                cursor: canSave ? 'pointer' : 'not-allowed',
                boxShadow: canSave ? '0 12px 32px rgba(225,29,72,0.35)' : 'none',
                transition:'all 220ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              Salvar registro
            </button>

            <button
              onClick={onClose}
              style={{
                width:'100%',
                marginTop:16,
                background:'none',
                border:'none',
                color:'rgba(255,255,255,0.4)',
                fontFamily:'var(--font-jakarta)',
                fontSize:11,
                fontWeight:600,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                cursor:'pointer',
                padding:'4px 0',
              }}
            >
              Agora nao
            </button>
          </>
        )}
      </div>
    </div>
  )
}

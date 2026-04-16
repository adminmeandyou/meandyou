'use client'

import { CalendarPlus, MapPin, X } from 'lucide-react'

export function ConvitePanel({
  conviteText,
  setConviteText,
  conviteLocalQuery,
  conviteLocal,
  conviteDate,
  setConviteDate,
  conviteTime,
  setConviteTime,
  placeSuggestions,
  showPlaces,
  sending,
  onClose,
  onPlaceSearch,
  onSelectPlace,
  onClearPlace,
  onSend,
}: {
  conviteText: string
  setConviteText: (v: string) => void
  conviteLocalQuery: string
  conviteLocal: string
  conviteDate: string
  setConviteDate: (v: string) => void
  conviteTime: string
  setConviteTime: (v: string) => void
  placeSuggestions: Array<{ display_name: string; name: string; address: any }>
  showPlaces: boolean
  sending: boolean
  onClose: () => void
  onPlaceSearch: (query: string) => void
  onSelectPlace: (place: any) => void
  onClearPlace: () => void
  onSend: () => void
}) {
  return (
    <div style={{
      flexShrink: 0, margin: '0 14px 10px',
      background: 'rgba(15,17,23,0.96)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '16px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarPlus size={15} color="var(--accent)" strokeWidth={1.5} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jakarta)', letterSpacing: '0.02em' }}>
            Chamar para um encontro
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={15} color="var(--muted)" />
        </button>
      </div>

      {/* Local com autocomplete */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Onde?
        </label>
        <div style={{ position: 'relative' }}>
          <MapPin size={15} color="var(--muted)" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={conviteLocalQuery}
            onChange={e => onPlaceSearch(e.target.value)}
            onFocus={() => {}}
            placeholder="Buscar local, restaurante, shopping..."
            autoFocus
            autoComplete="off"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              padding: '11px 14px 11px 36px', fontSize: 14, color: 'var(--text)',
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-jakarta)',
            }}
          />
        </div>
        {/* Dropdown de sugestoes */}
        {showPlaces && placeSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20,
            background: 'rgba(15,17,23,0.98)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, marginTop: 4, overflow: 'hidden',
            maxHeight: 220, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {placeSuggestions.map((place, i) => {
              const addr = place.address || {}
              const nome = place.name || ''
              const cidade = addr.city || addr.town || addr.village || addr.municipality || ''
              const estado = addr.state || ''
              const bairro = addr.suburb || addr.neighbourhood || ''
              const sub = [bairro, cidade, estado].filter(Boolean).join(', ')
              return (
                <button
                  key={i}
                  onClick={() => onSelectPlace(place)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 14px', background: 'transparent',
                    border: 'none', borderBottom: i < placeSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  <MapPin size={14} color="var(--accent)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome || place.display_name.split(',')[0]}</p>
                    {sub && <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
        {/* Local selecionado */}
        {conviteLocal && (
          <div style={{
            marginTop: 8, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <MapPin size={13} color="var(--accent)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, lineHeight: 1.45, flex: 1 }}>{conviteLocal}</p>
            <button onClick={onClearPlace} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <X size={13} color="var(--muted)" />
            </button>
          </div>
        )}
      </div>

      {/* Data + Hora lado a lado */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Quando?
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={conviteDate}
              onChange={e => setConviteDate(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
                padding: '11px 12px', fontSize: 13,
                color: conviteDate ? 'var(--text)' : 'rgba(248,249,250,0.4)',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
                colorScheme: 'dark',
                WebkitAppearance: 'none',
                appearance: 'none',
                minHeight: 42,
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Que horas?
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="time"
              value={conviteTime}
              onChange={e => setConviteTime(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
                padding: '11px 12px', fontSize: 13,
                color: conviteTime ? 'var(--text)' : 'rgba(248,249,250,0.4)',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
                colorScheme: 'dark',
                WebkitAppearance: 'none',
                appearance: 'none',
                minHeight: 42,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mensagem opcional */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Mensagem <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
        </label>
        <input
          type="text"
          value={conviteText}
          onChange={e => setConviteText(e.target.value)}
          placeholder="Adicione um recado..."
          maxLength={200}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
            padding: '11px 14px', fontSize: 14, color: 'var(--text)',
            outline: 'none', boxSizing: 'border-box',
            fontFamily: 'var(--font-jakarta)',
          }}
        />
      </div>

      {/* Botao enviar */}
      <button
        onClick={onSend}
        disabled={!conviteLocal.trim() || sending}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12,
          background: conviteLocal.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
          border: 'none', cursor: conviteLocal.trim() ? 'pointer' : 'default',
          color: conviteLocal.trim() ? '#fff' : 'rgba(248,249,250,0.35)',
          fontFamily: 'var(--font-jakarta)', fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}
      >
        <CalendarPlus size={15} strokeWidth={2} />
        Enviar convite
      </button>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { buscarMunicipios } from './helpers'

export function LocationAutocomplete({
  displayValue,
  onSelect,
}: {
  displayValue: string
  onSelect: (city: string, state: string, display: string) => void
}) {
  const [query, setQuery] = useState(displayValue)
  const [suggestions, setSuggestions] = useState<{ label: string; city: string; state: string }[]>([])
  const [loadingLoc, setLoadingLoc] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(displayValue) }, [displayValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) {
      setSuggestions([])
      onSelect('', '', '')
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoadingLoc(true)
      const results = await buscarMunicipios(q)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoadingLoc(false)
    }, 300)
  }

  function handleSelect(s: { label: string; city: string; state: string }) {
    setQuery(s.label)
    setSuggestions([])
    setOpen(false)
    onSelect(s.city, s.state, s.label)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={15} strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar cidade ou estado..."
          style={{
            width: '100%', paddingLeft: 36, paddingRight: query ? 32 : 12,
            paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', color: 'var(--text)',
            fontSize: 14, fontFamily: 'var(--font-jakarta)', outline: 'none',
          }}
        />
        {loadingLoc && (
          <div className="ui-spinner" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted)' }} />
        )}
        {!loadingLoc && query && (
          <button
            onMouseDown={() => { setQuery(''); setSuggestions([]); setOpen(false); onSelect('', '', '') }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={13} color="var(--muted)" strokeWidth={1.5} />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
          borderRadius: 12, marginTop: 4, overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={`${s.city}-${s.state}`}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <MapPin size={13} color="var(--muted)" strokeWidth={1.5} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

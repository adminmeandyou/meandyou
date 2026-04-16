'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ViewMode, MODE_LABELS } from './helpers'

export function ModeSelectorTabs({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (m: ViewMode) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 100,
            border: '1px solid rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'var(--text)', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-jakarta)', cursor: 'pointer',
          }}
        >
          <span>Modos</span>
          <ChevronDown size={13} strokeWidth={1.5} color="var(--muted)" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>

        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)', zIndex: 100,
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
              borderRadius: 14, padding: 6, minWidth: 160,
            }}>
              {(Object.keys(MODE_LABELS) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { onChange(mode); setOpen(false) }}
                  style={{
                    width: '100%', padding: '9px 14px', borderRadius: 10,
                    border: 'none',
                    backgroundColor: viewMode === mode ? 'var(--accent-light)' : 'transparent',
                    color: viewMode === mode ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 14, fontWeight: viewMode === mode ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-jakarta)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

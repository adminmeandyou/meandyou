'use client'

import { Crown } from 'lucide-react'
import { ViewMode, MODES_CONFIG } from './helpers'

export function ModesHubView({ userPlan, onSelect, onCamarote }: {
  userPlan: string
  onSelect: (m: ViewMode) => void
  onCamarote: () => void
}) {
  return (
    <div style={{ overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 24px' }}>
      {/* Label + título editorial */}
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(248,249,250,0.35)',
          fontFamily: 'var(--font-jakarta)',
          margin: '0 0 6px',
        }}>
          Conexões curadas
        </p>
        <h2 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 32, fontWeight: 700,
          color: '#F8F9FA',
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Escolha seu{' '}
          <br />
          <span style={{ color: '#E11D48' }}>ritmo</span> hoje.
        </h2>
      </div>

      {/* Grid 2x2 de modos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {MODES_CONFIG.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            style={{
              aspectRatio: '3/4',
              borderRadius: 10, overflow: 'hidden',
              position: 'relative', cursor: 'pointer',
              background: m.bg,
              border: '1px solid rgba(255,255,255,0.04)',
              padding: 0,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <img
              src={m.img}
              alt={m.label}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: m.imgPosition ?? 'center center', filter: 'grayscale(0.2)' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(8,9,14,0.15) 0%, rgba(8,9,14,0.92) 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 14px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0,
            }}>
              {m.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 100,
                  background: 'rgba(46,196,160,0.15)',
                  color: '#2ec4a0',
                  border: '1px solid rgba(46,196,160,0.25)',
                  fontFamily: 'var(--font-jakarta)',
                  marginBottom: 6,
                }}>
                  {m.badge}
                </span>
              )}
              <p style={{
                margin: '0 0 3px', fontSize: 15, fontWeight: 700,
                color: '#F8F9FA',
                fontFamily: 'var(--font-fraunces)',
                letterSpacing: '-0.01em',
              }}>
                {m.label}
              </p>
              <p style={{
                margin: 0, fontSize: 11,
                color: 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)',
                fontWeight: 400,
                lineHeight: 1.4,
              }}>
                {m.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Camarote Black — banner editorial */}
      <button
        onClick={onCamarote}
        style={{
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 0 50px rgba(245,158,11,0.08)',
          padding: 0,
          background: '#0d0900',
        }}
      >
        <img
          src="/images/camarote-bg.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.35 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.75) 50%, rgba(8,9,14,0.3) 100%)',
        }} />
        <div style={{
          position: 'relative',
          padding: '22px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          minHeight: 130,
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Crown size={13} strokeWidth={1.5} color="#F59E0B" />
            <span style={{
              fontSize: 9, fontWeight: 800,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: '#F59E0B',
              fontFamily: 'var(--font-jakarta)',
            }}>
              Exclusivo VIP
            </span>
          </div>
          <h3 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 26, fontWeight: 700,
            fontStyle: 'italic',
            color: '#F8F9FA',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            Camarote Black
          </h3>
          <p style={{
            fontSize: 12, color: 'rgba(248,249,250,0.60)',
            margin: '0 0 14px',
            maxWidth: '65%',
            fontFamily: 'var(--font-jakarta)',
            lineHeight: 1.5,
          }}>
            Acesso prioritario e perfis verificados de alta relevancia.
          </p>
          <div style={{
            padding: '7px 16px', borderRadius: 9999,
            background: 'linear-gradient(135deg, #F59E0B 0%, #B47B00 100%)',
            boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
            display: 'inline-flex',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#000',
              fontFamily: 'var(--font-jakarta)',
            }}>
              Entrar agora
            </span>
          </div>
        </div>
      </button>
      </div>{/* fim maxWidth wrapper */}
    </div>
  )
}

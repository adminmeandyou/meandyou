'use client'

import { useState, useRef } from 'react'
import { CalendarPlus, CheckCircle2 } from 'lucide-react'
import { RESPOSTAS_RAPIDAS } from './helpers'

export function ConviteCard({
  text, isMe, time, onReply, respondedWith,
}: {
  text: string
  isMe: boolean
  time: string
  onReply: (r: string) => void
  respondedWith?: string | null
}) {
  const [localResponse, setLocalResponse] = useState<string | null>(null)
  const replySent = useRef(false)
  const answered = respondedWith || localResponse

  function handleReply(r: string) {
    if (answered || replySent.current) return
    replySent.current = true
    setLocalResponse(r)
    onReply(r)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '80%',
        background: isMe ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: `1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        overflow: 'hidden',
      }}>
        {/* Header do card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px 8px',
          borderBottom: `1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'}`,
        }}>
          <CalendarPlus size={14} color={answered === 'Aceito!' ? '#22c55e' : 'var(--accent)'} strokeWidth={1.5} />
          <span style={{ fontSize: 12, fontWeight: 700, color: answered === 'Aceito!' ? '#22c55e' : 'var(--accent)' }}>
            {answered === 'Aceito!' ? 'Encontro marcado' : 'Convite de Encontro'}
          </span>
        </div>

        {/* Texto da proposta */}
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{text}</p>
          <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{time}</span>
        </div>

        {/* Estado respondido */}
        {answered && (
          <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} color={answered === 'Aceito!' ? '#22c55e' : 'var(--muted)'} />
            <span style={{ fontSize: 12, color: answered === 'Aceito!' ? '#22c55e' : 'var(--muted)', fontWeight: 600 }}>
              {answered}
            </span>
          </div>
        )}

        {/* Respostas rapidas — so para quem recebeu e ainda nao respondeu */}
        {!isMe && !answered && (
          <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {RESPOSTAS_RAPIDAS.map((r) => (
              <button
                key={r}
                onClick={() => handleReply(r)}
                style={{
                  padding: '5px 12px', borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text)', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

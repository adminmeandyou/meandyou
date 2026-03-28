'use client'

import { Check, CheckCheck } from 'lucide-react'

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

interface ChatBubbleProps {
  message: string
  direction: 'sent' | 'received'
  time?: string
  status?: MessageStatus
  loading?: boolean
}

export function ChatBubble({
  message,
  direction,
  time,
  status = 'sent',
  loading = false,
}: ChatBubbleProps) {
  const isSent = direction === 'sent'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            backgroundColor: isSent ? 'rgba(225,29,72,0.25)' : 'rgba(255,255,255,0.07)',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isSent ? 'rgba(225,29,72,0.6)' : 'rgba(248,249,250,0.4)',
                animation: `ui-pulse 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  const StatusIcon =
    status === 'read'
      ? CheckCheck
      : status === 'delivered' || status === 'sent'
      ? Check
      : null

  const statusColor = status === 'read' ? '#E11D48' : 'rgba(248,249,250,0.4)'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isSent ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          padding: '10px 14px',
          borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isSent
            ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)'
            : 'var(--bg-card2)',
          border: isSent ? 'none' : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isSent
            ? '0 2px 8px rgba(225,29,72,0.2)'
            : '0 1px 4px rgba(0,0,0,0.15)',
        }}
      >
        <p
          style={{
            fontSize: 15,
            color: isSent ? '#fff' : 'var(--text)',
            fontFamily: 'var(--font-jakarta)',
            lineHeight: 1.45,
            margin: 0,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginTop: 5,
          }}
        >
          {time && (
            <span
              style={{
                fontSize: 11,
                color: isSent ? 'rgba(255,255,255,0.6)' : 'var(--muted-2)',
                fontFamily: 'var(--font-jakarta)',
              }}
            >
              {time}
            </span>
          )}
          {isSent && StatusIcon && status !== 'sending' && (
            <StatusIcon size={14} strokeWidth={2} style={{ color: statusColor }} />
          )}
          {isSent && status === 'sending' && (
            <span
              className="ui-spinner"
              style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.5)', borderWidth: 1.5 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

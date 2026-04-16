'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Archive } from 'lucide-react'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { Conversation, formatTime } from './helpers'

export function ConvRow({ conv, currentUserId, isArchived, onArchive }: {
  conv: Conversation
  currentUserId: string
  isArchived: boolean
  onArchive: (matchId: string) => void
}) {
  const isMyMessage = conv.lastSenderId === currentUserId
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <button
        onClick={() => onArchive(conv.matchId)}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isArchived ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
          border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 4,
          borderLeft: '1px solid var(--border-soft)',
        }}
      >
        <Archive size={16} color={isArchived ? '#10b981' : 'rgba(248,249,250,0.4)'} strokeWidth={1.5} />
        <span style={{ fontSize: 10, color: isArchived ? '#10b981' : 'rgba(248,249,250,0.4)', fontWeight: 600 }}>
          {isArchived ? 'Restaurar' : 'Arquivar'}
        </span>
      </button>

      <Link
        href={`/conversas/${conv.matchId}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 20px', borderBottom: '1px solid var(--border-soft)',
          textDecoration: 'none', background: isArchived ? 'rgba(255,255,255,0.015)' : 'var(--bg)',
          position: 'relative', zIndex: 1, marginRight: 80,
          opacity: isArchived ? 0.65 : 1,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {conv.otherPhoto ? (
              <Image src={conv.otherPhoto} alt={conv.otherName} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{conv.otherName[0]}</span>
              </div>
            )}
          </div>
          {conv.unreadCount === 0 && (
            <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
              <OnlineIndicator lastActiveAt={conv.lastActiveAt} showLastActive={conv.showLastActive} mode="dot" size={12} />
            </div>
          )}
          {conv.unreadCount > 0 && (
            <div style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 100, background: 'var(--accent)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: conv.unreadCount > 0 ? 700 : 500, color: conv.unreadCount > 0 ? 'var(--text)' : 'rgba(248,249,250,0.80)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.otherName}
            </p>
            {conv.lastMessageAt && (
              <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.30)', flexShrink: 0, marginLeft: 8 }}>
                {formatTime(conv.lastMessageAt)}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, margin: 0, color: conv.unreadCount > 0 ? 'rgba(248,249,250,0.65)' : 'rgba(248,249,250,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(() => {
              const msg = conv.lastMessage
              if (!msg) return 'Nenhuma mensagem ainda'
              if (msg === '__NUDGE__') return 'Chamou sua atenção'
              if (msg.startsWith('__CONVITE__:')) return 'Convite de encontro'
              if (msg.startsWith('__MEETING__:')) return 'Convite de encontro'
              return `${isMyMessage ? 'Você: ' : ''}${msg}`
            })()}
          </p>
        </div>
      </Link>
    </div>
  )
}

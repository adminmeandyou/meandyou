'use client'

import { useState } from 'react'
import { MessageCircle, Archive } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Conversation } from './helpers'
import { ConvRow } from './ConvRow'

export function AbaConversas({
  conversations, currentUserId, archivedIds, onArchive, onEmpty, searchTerm,
}: {
  conversations: Conversation[]
  currentUserId: string
  archivedIds: Set<string>
  onArchive: (matchId: string) => void
  onEmpty: () => void
  searchTerm: string
}) {
  const [showArchived, setShowArchived] = useState(false)

  const active = conversations.filter(c => !archivedIds.has(c.matchId))
  const archived = conversations.filter(c => archivedIds.has(c.matchId))

  if (active.length === 0 && archived.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={28} />}
        title={searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
        description={searchTerm ? undefined : 'Quando der match e trocar mensagens, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar pessoas', onClick: onEmpty } : undefined}
      />
    )
  }

  if (active.length === 0 && archived.length > 0 && !searchTerm) {
    return (
      <div>
        <div style={{ padding: '32px 20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Nenhuma conversa ativa</p>
        </div>
        <button
          onClick={() => setShowArchived(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', background: 'none', border: 'none',
            borderTop: '1px solid var(--border-soft)',
            cursor: 'pointer', color: 'rgba(248,249,250,0.35)',
            fontFamily: 'var(--font-jakarta)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}
        >
          <Archive size={13} strokeWidth={1.5} />
          Arquivadas ({archived.length})
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
            {showArchived ? 'Ocultar' : 'Ver'}
          </span>
        </button>
        {showArchived && archived.map(conv => (
          <ConvRow key={conv.matchId} conv={conv} currentUserId={currentUserId} isArchived onArchive={onArchive} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {active.map(conv => (
        <ConvRow key={conv.matchId} conv={conv} currentUserId={currentUserId} isArchived={false} onArchive={onArchive} />
      ))}

      {archived.length > 0 && (
        <>
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', background: 'none', border: 'none',
              borderTop: '1px solid var(--border-soft)',
              cursor: 'pointer', color: 'rgba(248,249,250,0.35)',
              fontFamily: 'var(--font-jakarta)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            <Archive size={13} strokeWidth={1.5} />
            Arquivadas ({archived.length})
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
              {showArchived ? 'Ocultar' : 'Ver'}
            </span>
          </button>
          {showArchived && archived.map(conv => (
            <ConvRow key={conv.matchId} conv={conv} currentUserId={currentUserId} isArchived onArchive={onArchive} />
          ))}
        </>
      )}
    </div>
  )
}

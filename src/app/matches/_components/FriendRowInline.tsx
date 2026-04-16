'use client'

import Link from 'next/link'
import { UserCircle, X } from 'lucide-react'
import { Friendship } from './helpers'

export function FriendRowInline({
  friendship, onRemove, actionLoading, online,
}: {
  friendship: Friendship
  onRemove: (id: string) => void
  actionLoading: string | null
  online: boolean
}) {
  const p = friendship.other
  if (!p) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Link href={`/perfil/${p.id}`} style={{ position: 'relative', flexShrink: 0, textDecoration: 'none' }}>
        {p.photo_best ? (
          <img src={p.photo_best} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle size={28} color="var(--muted)" />
          </div>
        )}
        {online && (
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--bg)' }} />
        )}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: '#F8F9FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
        <p style={{ fontSize: 12, color: online ? '#10b981' : 'var(--muted)', margin: '2px 0 0' }}>
          {online ? 'Online agora' : p.city ?? 'MeAndYou'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Link
          href={`/perfil/${p.id}`}
          style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--muted)' }}
        >
          <UserCircle size={15} />
        </Link>
        <button
          onClick={() => onRemove(friendship.id)}
          disabled={actionLoading === friendship.id}
          style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

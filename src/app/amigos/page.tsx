'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { ArrowLeft, UserPlus, Check, X, UserCircle, Clock } from 'lucide-react'
import Link from 'next/link'

type FriendProfile = {
  id: string
  name: string
  photo_best: string | null
  city: string | null
  plan: string
  last_seen: string | null
}

type Friendship = {
  id: string
  requester_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  other: FriendProfile | null
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000
}

export default function AmigosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState('')
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pending, setPending] = useState<Friendship[]>([])
  const [tab, setTab] = useState<'amigos' | 'pendentes'>('amigos')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyUserId(user.id)
      await loadFriends()
    }
    load()
  }, [])

  // Realtime: escuta mudanças na tabela friendships (novo pedido, aceito, removido)
  useEffect(() => {
    if (!myUserId) return
    const channel = supabase
      .channel('amigos-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, (payload) => {
        const row = (payload.new || payload.old) as Record<string, string> | undefined
        if (!row) return
        // Só recarrega se envolve o user atual
        if (row.requester_id === myUserId || row.receiver_id === myUserId) {
          loadFriends()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myUserId])

  async function loadFriends() {
    setLoading(true)
    try {
      const res = await fetch('/api/amigos')
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends ?? [])
        setPending(data.pending ?? [])
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }

  async function respond(friendshipId: string, action: 'accept' | 'decline') {
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/amigos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      })
      if (res.ok) await loadFriends()
    } catch { /* silencioso */ }
    setActionLoading(null)
  }

  async function remove(friendshipId: string) {
    if (!confirm('Remover este amigo?')) return
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/amigos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action: 'remove' }),
      })
      if (res.ok) await loadFriends()
    } catch { /* silencioso */ }
    setActionLoading(null)
  }

  const onlineFriends = friends.filter(f => isOnline(f.other?.last_seen ?? null))
  const offlineFriends = friends.filter(f => !isOnline(f.other?.last_seen ?? null))
  const receivedPending = pending.filter(f => f.receiver_id === myUserId)
  const sentPending = pending.filter(f => f.requester_id === myUserId)

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', position: 'sticky', top: 0, backgroundColor: 'var(--bg)', zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>Amigos</h1>
        {receivedPending.length > 0 && (
          <div style={{ marginLeft: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{receivedPending.length}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '14px 16px 0', gap: 8 }}>
        {[
          { key: 'amigos' as const,    label: `Amigos (${friends.length})` },
          { key: 'pendentes' as const, label: `Pendentes (${pending.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 100,
              border: `1px solid ${tab === t.key ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
              backgroundColor: tab === t.key ? 'rgba(225,29,72,0.12)' : 'transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* Tab: amigos */}
        {tab === 'amigos' && (
          <>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 64, borderRadius: 14, backgroundColor: 'var(--bg-card)', marginBottom: 8, animation: 'ui-pulse 1.5s ease infinite' }} />
              ))
            ) : friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <UserPlus size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhum amigo ainda.</p>
                <p style={{ color: 'var(--muted-2)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
                  Depois de um match, você pode adicionar a pessoa como amigo.
                </p>
              </div>
            ) : (
              <>
                {/* Online agora */}
                {onlineFriends.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
                      Online agora ({onlineFriends.length})
                    </p>
                    {onlineFriends.map(f => (
                      <FriendRow key={f.id} friendship={f} myUserId={myUserId} onRemove={remove} actionLoading={actionLoading} online />
                    ))}
                    <div style={{ height: 12 }} />
                  </>
                )}

                {/* Outros */}
                {offlineFriends.length > 0 && (
                  <>
                    {onlineFriends.length > 0 && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
                        Todos os amigos ({offlineFriends.length})
                      </p>
                    )}
                    {offlineFriends.map(f => (
                      <FriendRow key={f.id} friendship={f} myUserId={myUserId} onRemove={remove} actionLoading={actionLoading} online={false} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: pendentes */}
        {tab === 'pendentes' && (
          <>
            {receivedPending.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>Pedidos recebidos</p>
                {receivedPending.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <Link href={`/perfil/${f.other?.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                      {f.other?.photo_best ? (
                        <img src={f.other.photo_best} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserCircle size={28} color="var(--muted)" />
                        </div>
                      )}
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{f.other?.name ?? 'Usuário'}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Quer ser seu amigo</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => respond(f.id, 'accept')}
                        disabled={actionLoading === f.id}
                        style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => respond(f.id, 'decline')}
                        disabled={actionLoading === f.id}
                        style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ height: 16 }} />
              </>
            )}

            {sentPending.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>Pedidos enviados</p>
                {sentPending.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <Link href={`/perfil/${f.other?.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                      {f.other?.photo_best ? (
                        <img src={f.other.photo_best} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserCircle size={28} color="var(--muted)" />
                        </div>
                      )}
                    </Link>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{f.other?.name ?? 'Usuário'}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> Aguardando resposta
                      </p>
                    </div>
                    <button
                      onClick={() => remove(f.id)}
                      style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </>
            )}

            {pending.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <UserPlus size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum pedido pendente</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Linha de amigo ───────────────────────────────────────────────────────────
function FriendRow({
  friendship, myUserId, onRemove, actionLoading, online,
}: {
  friendship: Friendship
  myUserId: string
  onRemove: (id: string) => void
  actionLoading: string | null
  online: boolean
}) {
  const p = friendship.other
  if (!p) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
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
        <p style={{ fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
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

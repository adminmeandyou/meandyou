'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Search, Archive, Heart, Zap, X, User } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Conversation {
  matchId: string
  otherUserId: string
  otherName: string
  otherPhoto: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  lastSenderId: string | null
  unreadCount: number
  lastActiveAt?: string | null
  showLastActive?: boolean
}

interface Match {
  match_id: string
  other_user_id: string
  name: string
  photo_best: string | null
  city: string | null
  matched_at: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  last_active_at?: string | null
  show_last_active?: boolean
}

type Aba = 'conversas' | 'todos' | 'online'

interface Friend {
  userId: string
  name: string
  photo: string | null
  lastSeen: string | null
  matchId: string | null
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

const ARCHIVED_KEY = 'meandyou_archived_convs'

function getArchivedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ARCHIVED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function isOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < 3600000
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  if (hrs < 24) return `${hrs}h`
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function MatchesHubPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [aba, setAba] = useState<Aba>('conversas')
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([])
  const [myShowOnline, setMyShowOnline] = useState(true)

  useEffect(() => {
    setArchivedIds(getArchivedIds())
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadAll(user.id)

      channel = supabase
        .channel(`matches-hub-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          loadAll(user.id)
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function loadAll(uid: string) {
    setLoading(true)
    try {
      const [convsResult, matchesResult] = await Promise.all([
        supabase.rpc('get_my_conversations', { p_user_id: uid }),
        supabase.rpc('get_my_matches', { p_user_id: uid }),
      ])

      if (convsResult.data) {
        const convs: Conversation[] = convsResult.data.map((row: any) => ({
          matchId: row.match_id,
          otherUserId: row.other_user_id,
          otherName: row.other_name ?? 'Usuário',
          otherPhoto: row.other_photo ?? null,
          lastMessage: row.last_message ?? null,
          lastMessageAt: row.last_message_at ?? null,
          lastSenderId: row.last_sender_id ?? null,
          unreadCount: row.unread_count ?? 0,
          lastActiveAt: row.other_last_active_at ?? null,
          showLastActive: row.other_show_last_active ?? false,
        }))
        convs.sort((a, b) => {
          if (!a.lastMessageAt) return 1
          if (!b.lastMessageAt) return -1
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        })
        setConversations(convs)
      }

      if (matchesResult.data) {
        setMatches(matchesResult.data)
      }

      // Busca show_last_active do usuario logado
      const { data: myProf } = await supabase
        .from('profiles')
        .select('show_last_active')
        .eq('id', uid)
        .single()

      const canSeeOnline = myProf?.show_last_active !== false
      setMyShowOnline(canSeeOnline)

      if (canSeeOnline) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, receiver_id')
          .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
          .eq('status', 'accepted')

        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map(f =>
            f.requester_id === uid ? f.receiver_id : f.requester_id
          )

          const { data: friendProfiles } = await supabase
            .from('profiles')
            .select('id, name, photo_best, last_seen, show_last_active')
            .in('id', friendIds)

          const orFilter = friendIds
            .map(fId => `and(user1.eq.${uid},user2.eq.${fId}),and(user1.eq.${fId},user2.eq.${uid})`)
            .join(',')
          const { data: friendMatches } = await supabase
            .from('matches')
            .select('id, user1, user2')
            .or(orFilter)

          const now = Date.now()
          const online: Friend[] = (friendProfiles || [])
            .filter(p => {
              if (p.show_last_active === false) return false
              const t = p.last_seen ? new Date(p.last_seen).getTime() : 0
              return t > 0 && (now - t) < 5 * 60 * 1000
            })
            .map(p => {
              const m = (friendMatches || []).find(
                x => x.user1 === p.id || x.user2 === p.id
              )
              return {
                userId: p.id,
                name: p.name ?? 'Usuário',
                photo: p.photo_best ?? null,
                lastSeen: p.last_seen ?? null,
                matchId: m?.id ?? null,
              }
            })

          setOnlineFriends(online)
        } else {
          setOnlineFriends([])
        }
      } else {
        setOnlineFriends([])
      }
    } catch {
      toast.error('Erro ao carregar matches.')
    }
    setLoading(false)
  }

  function handleArchive(matchId: string) {
    const ids = getArchivedIds()
    if (ids.has(matchId)) { ids.delete(matchId) } else { ids.add(matchId) }
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(Array.from(ids)))
    setArchivedIds(new Set(ids))
    haptics.tap()
    toast.success(ids.has(matchId) ? 'Conversa arquivada.' : 'Conversa restaurada.')
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const convsAtivas = conversations
    .filter(c => !archivedIds.has(c.matchId))
    .filter(c => c.otherName.toLowerCase().includes(searchTerm.toLowerCase()))

  const todosFiltrados = matches
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const onlineFiltrados = onlineFriends.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs: { key: Aba; label: string; count: number }[] = [
    { key: 'conversas', label: 'Conversas', count: conversations.filter(c => !archivedIds.has(c.matchId)).length },
    { key: 'todos',     label: 'Todos',     count: matches.length },
    { key: 'online',    label: 'Online',    count: onlineFriends.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)', fontFamily: 'var(--font-jakarta)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: 'var(--text)', margin: 0 }}>
            Matches
          </h1>
          {totalUnread > 0 && (
            <span style={{
              minWidth: 22, height: 22, borderRadius: 100,
              background: 'var(--accent)', color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
            }}>
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={14} color="rgba(248,249,250,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
              paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-jakarta)',
            }}
          />
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { haptics.tap(); setAba(key); setSearchTerm('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 100,
                border: aba === key ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                background: aba === key ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)' : 'rgba(255,255,255,0.05)',
                color: aba === key ? '#fff' : 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)', fontSize: 13, fontWeight: aba === key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                  background: aba === key ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                  color: aba === key ? '#fff' : 'rgba(248,249,250,0.6)',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Conteudo */}
      <main style={{ paddingBottom: 96 }}>
        {loading ? (
          <div style={{ padding: '12px 0' }}>
            <SkeletonList rows={6} />
          </div>
        ) : aba === 'conversas' ? (
          <AbaConversas
            conversations={convsAtivas}
            currentUserId={userId ?? ''}
            archivedIds={archivedIds}
            onArchive={handleArchive}
            onEmpty={() => router.push('/modos')}
            searchTerm={searchTerm}
          />
        ) : aba === 'todos' ? (
          <AbaTodos
            matches={todosFiltrados}
            onEmpty={() => router.push('/modos')}
            onOpen={(matchId) => router.push(`/conversas/${matchId}`)}
            searchTerm={searchTerm}
          />
        ) : (
          <AbaOnline
            friends={onlineFiltrados}
            myShowOnline={myShowOnline}
            onEmpty={() => router.push('/modos')}
            searchTerm={searchTerm}
          />
        )}
      </main>
    </div>
  )
}

// ─── Aba Conversas ─────────────────────────────────────────────────────────────

function AbaConversas({
  conversations, currentUserId, archivedIds, onArchive, onEmpty, searchTerm,
}: {
  conversations: Conversation[]
  currentUserId: string
  archivedIds: Set<string>
  onArchive: (matchId: string) => void
  onEmpty: () => void
  searchTerm: string
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={28} />}
        title={searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
        description={searchTerm ? undefined : 'Quando der match e trocar mensagens, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar pessoas', onClick: onEmpty } : undefined}
      />
    )
  }

  return (
    <div>
      {conversations.map((conv) => {
        const isMyMessage = conv.lastSenderId === currentUserId
        const isArchived = archivedIds.has(conv.matchId)
        return (
          <div key={conv.matchId} style={{ position: 'relative', overflow: 'hidden' }}>
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
                textDecoration: 'none', background: 'var(--bg)',
                position: 'relative', zIndex: 1, marginRight: 80,
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
                  {conv.lastMessage
                    ? `${isMyMessage ? 'Você: ' : ''}${conv.lastMessage}`
                    : 'Nenhuma mensagem ainda'}
                </p>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ─── Aba Todos ─────────────────────────────────────────────────────────────────

function AbaTodos({ matches, onEmpty, onOpen, searchTerm }: {
  matches: Match[]
  onEmpty: () => void
  onOpen: (matchId: string) => void
  searchTerm: string
}) {
  const router = useRouter()
  const haptics = useHaptics()
  const [selected, setSelected] = useState<Match | null>(null)

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={28} />}
        title={searchTerm ? 'Nenhum match encontrado' : 'Nenhum match ainda'}
        description={searchTerm ? undefined : 'Continue curtindo! Quando alguém curtir de volta, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar perfis', onClick: onEmpty } : undefined}
      />
    )
  }

  return (
    <>
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {matches.map((m) => (
          <button
            key={m.match_id}
            onClick={() => { haptics.tap(); setSelected(m) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}
          >
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
                background: 'var(--bg-card2)',
                border: isOnline(m.last_active_at) && m.show_last_active !== false
                  ? '2px solid #2ec4a0'
                  : '1.5px solid rgba(255,255,255,0.06)',
              }}>
                {m.photo_best ? (
                  <Image src={m.photo_best} alt={m.name} width={120} height={120} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 28 }}>{m.name[0]}</span>
                  </div>
                )}
              </div>
              {isOnline(m.last_active_at) && m.show_last_active !== false && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, borderRadius: '50%', background: '#2ec4a0', border: '2px solid var(--bg)' }} />
              )}
              {(m.unread_count || 0) > 0 && (
                <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 100, background: 'var(--accent)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{(m.unread_count || 0) > 9 ? '9+' : m.unread_count}</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>{formatAgo(m.matched_at)}</p>
          </button>
        ))}
      </div>

      {/* Popup de acao ao clicar no match */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430, margin: '0 auto',
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none',
              padding: '20px 20px 32px',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }} />

            {/* Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid var(--accent-border)', flexShrink: 0 }}>
                {selected.photo_best ? (
                  <Image src={selected.photo_best} alt={selected.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{selected.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                  Match {formatAgo(selected.matched_at)}
                  {isOnline(selected.last_active_at) && selected.show_last_active !== false && (
                    <span style={{ color: '#2ec4a0', marginLeft: 6 }}>· Online agora</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={14} color="var(--muted)" strokeWidth={2} />
              </button>
            </div>

            {/* Acoes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { haptics.medium(); router.push(`/conversas/${selected.match_id}`) }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', boxShadow: '0 4px 20px rgba(225,29,72,0.25)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                <MessageCircle size={18} strokeWidth={1.5} />
                Enviar mensagem
              </button>
              <button
                onClick={() => { haptics.tap(); router.push(`/perfil/${selected.other_user_id}`) }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                <User size={18} strokeWidth={1.5} />
                Ver perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Aba Online ────────────────────────────────────────────────────────────────

function AbaOnline({ friends, myShowOnline, onEmpty, searchTerm }: {
  friends: Friend[]
  myShowOnline: boolean
  onEmpty: () => void
  searchTerm: string
}) {
  const router = useRouter()
  const haptics = useHaptics()
  const [selected, setSelected] = useState<Friend | null>(null)

  if (!myShowOnline) {
    return (
      <EmptyState
        icon={<Zap size={28} />}
        title="Status online ocultado"
        description="Você ocultou seu status online. Ative nas configurações para ver amigos online."
        action={{ label: 'Ir para configurações', onClick: () => router.push('/configuracoes') }}
      />
    )
  }

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<Zap size={28} />}
        title={searchTerm ? 'Nenhum amigo encontrado' : 'Nenhum amigo online agora'}
        description={searchTerm ? undefined : 'Quando um amigo estiver ativo nos últimos 5 minutos, aparece aqui.'}
        action={!searchTerm ? { label: 'Explorar perfis', onClick: onEmpty } : undefined}
      />
    )
  }

  return (
    <>
      <div>
        <p style={{ padding: '12px 20px 4px', fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          {friends.length} {friends.length === 1 ? 'amigo online' : 'amigos online'} agora
        </p>
        {friends.map((f) => (
          <button
            key={f.userId}
            onClick={() => { haptics.tap(); setSelected(f) }}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', borderBottom: '1px solid var(--border-soft)',
              textAlign: 'left',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid #2ec4a0' }}>
                {f.photo ? (
                  <Image src={f.photo} alt={f.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{f.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#2ec4a0', border: '2px solid var(--bg)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </p>
              <p style={{ fontSize: 13, margin: 0, color: '#2ec4a0', fontWeight: 500 }}>
                Ativo agora
              </p>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 100, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Mensagem
            </div>
          </button>
        ))}
      </div>

      {/* Popup de acao */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none', padding: '20px 20px 32px', boxShadow: '0 -4px 32px rgba(0,0,0,0.4)' }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', border: '2px solid #2ec4a0', flexShrink: 0 }}>
                {selected.photo ? (
                  <Image src={selected.photo} alt={selected.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{selected.name[0]}</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: '#2ec4a0', margin: '2px 0 0', fontWeight: 500 }}>Online agora</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} color="var(--muted)" strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.matchId ? (
                <button
                  onClick={() => { haptics.medium(); router.push(`/conversas/${selected.matchId}`) }}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', boxShadow: '0 4px 20px rgba(225,29,72,0.25)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                >
                  <MessageCircle size={18} strokeWidth={1.5} />
                  Enviar mensagem
                </button>
              ) : null}
              <button
                onClick={() => { haptics.tap(); router.push(`/perfil/${selected.userId}`) }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              >
                <User size={18} strokeWidth={1.5} />
                Ver perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

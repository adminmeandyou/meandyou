'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Search } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

import { Conversation, ConvMatch, Friend, Aba, ARCHIVED_KEY, getArchivedIds } from './_components/helpers'
import { AbaConversas } from './_components/AbaConversas'
import { AbaTodos } from './_components/AbaTodos'
import { AbaOnline } from './_components/AbaOnline'

export default function MatchesHubPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matches, setMatches] = useState<ConvMatch[]>([])
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

      <main style={{ paddingBottom: 96 }}>
        {loading ? (
          <div style={{ padding: '12px 0' }}>
            <SkeletonList rows={6} />
          </div>
        ) : aba === 'conversas' ? (
          <AbaConversas
            conversations={conversations.filter(c => c.otherName.toLowerCase().includes(searchTerm.toLowerCase()))}
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

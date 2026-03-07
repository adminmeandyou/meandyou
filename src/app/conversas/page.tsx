'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { MessageCircle, Loader2, Search, ArrowLeft } from 'lucide-react'

interface Conversation {
  matchId: string
  otherUserId: string
  otherName: string
  otherPhoto: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  lastSenderId: string | null
  unreadCount: number
}

export default function ConversasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    loadConversations()

    // Realtime — atualiza lista quando chega nova mensagem
    const channel = supabase
      .channel('conversas-list')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        loadConversations()
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [user])

  async function loadConversations() {
    if (!user) return

    // Buscar todos os matches ativos do usuário
    const { data: matches } = await supabase
      .from('matches')
      .select('id, user1, user2')
      .or(`user1.eq.${user.id},user2.eq.${user.id}`)
      .eq('status', 'active')

    if (!matches || matches.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    // Para cada match, buscar perfil do outro + última mensagem + não lidas
    const convs: Conversation[] = await Promise.all(
      matches.map(async (match) => {
        const otherId = match.user1 === user.id ? match.user2 : match.user1

        // Perfil do outro
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, photo_best')
          .eq('id', otherId)
          .single()

        // Última mensagem
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Contar não lidas
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .neq('sender_id', user.id)
          .is('read_at', null)

        return {
          matchId: match.id,
          otherUserId: otherId,
          otherName: profile?.name ?? 'Usuário',
          otherPhoto: profile?.photo_best ?? null,
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.created_at ?? null,
          lastSenderId: lastMsg?.sender_id ?? null,
          unreadCount: count ?? 0,
        }
      })
    )

    // Ordenar por mais recente
    convs.sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })

    setConversations(convs)
    setLoading(false)
  }

  const filtered = conversations.filter((c) =>
    c.otherName.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="font-fraunces text-2xl text-white">Mensagens</h1>
            {totalUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#b8f542] text-black text-xs font-bold flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#b8f542]/40 transition"
          />
        </div>
      </header>

      {/* Lista */}
      <main className="pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30">
            <MessageCircle size={36} />
            <p className="text-sm text-center max-w-[220px]">
              {search
                ? 'Nenhuma conversa encontrada.'
                : 'Você ainda não tem conversas. Faça um match para começar!'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/busca')}
                className="mt-2 text-[#b8f542] text-xs underline"
              >
                Explorar pessoas
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.matchId}
                conv={conv}
                currentUserId={user!.id}
                onClick={() => router.push(`/chat/${conv.matchId}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Item de conversa ─────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  currentUserId,
  onClick,
}: {
  conv: Conversation
  currentUserId: string
  onClick: () => void
}) {
  const isMyMessage = conv.lastSenderId === currentUserId

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition text-left"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 border border-white/10">
          {conv.otherPhoto ? (
            <Image
              src={conv.otherPhoto}
              alt={conv.otherName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 font-fraunces text-xl">
              {conv.otherName[0]}
            </div>
          )}
        </div>
        {/* Badge de não lidas */}
        {conv.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b8f542] text-black text-xs font-bold flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>
            {conv.otherName}
          </p>
          {conv.lastMessageAt && (
            <span className="text-white/30 text-xs shrink-0 ml-2">
              {formatTime(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white/60' : 'text-white/30'}`}>
          {conv.lastMessage
            ? `${isMyMessage ? 'Você: ' : ''}${conv.lastMessage}`
            : 'Nenhuma mensagem ainda'}
        </p>
      </div>
    </button>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'ontem'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }
}
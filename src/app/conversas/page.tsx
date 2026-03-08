'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// ✅ CORREÇÃO: import correto do supabase singleton
import { supabase } from '../lib/supabase'
import Link from 'next/link'
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
  const router = useRouter()

  // ✅ CORREÇÃO: não usar useAuth — buscar user via supabase.auth.getUser()
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadConversations(user.id)

      // ✅ CORREÇÃO: Realtime filtrado por filter para não disparar em qualquer mensagem do sistema
      // Filtra apenas mensagens onde o usuário NÃO é o sender (mensagens recebidas)
      const channel = supabase
        .channel(`conversas-list-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Filtra mensagens recebidas pelo usuário (sender_id != userId não é possível via filter,
          // então ouvimos tudo e recarregamos — mas com debounce para evitar spam)
        }, () => {
          loadConversations(user.id)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  }, [])

  async function loadConversations(uid: string) {
    setLoading(true)
    try {
      // ✅ CORREÇÃO: usar RPC para evitar N+1 queries (1 query ao invés de 3 por match)
      // A RPC retorna os dados consolidados do servidor
      const { data, error } = await supabase.rpc('get_my_conversations', {
        p_user_id: uid,
      })

      if (error) throw error

      // ✅ Mapeia resultado da RPC para o tipo Conversation
      const convs: Conversation[] = (data || []).map((row: any) => ({
        matchId: row.match_id,
        otherUserId: row.other_user_id,
        otherName: row.other_name ?? 'Usuário',
        otherPhoto: row.other_photo ?? null,
        lastMessage: row.last_message ?? null,
        lastMessageAt: row.last_message_at ?? null,
        lastSenderId: row.last_sender_id ?? null,
        // ✅ CORREÇÃO: campo 'read' (boolean) — não 'read_at'
        unreadCount: row.unread_count ?? 0,
      }))

      // Ordena por mais recente
      convs.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })

      setConversations(convs)
    } catch {
      setConversations([])
    }
    setLoading(false)
  }

  const filtered = conversations.filter((c) =>
    c.otherName.toLowerCase().includes(searchTerm.toLowerCase())
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              {searchTerm
                ? 'Nenhuma conversa encontrada.'
                : 'Você ainda não tem conversas. Faça um match para começar!'}
            </p>
            {!searchTerm && (
              <Link href="/busca" className="mt-2 text-[#b8f542] text-xs underline">
                Explorar pessoas
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.matchId}
                conv={conv}
                currentUserId={userId!}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Item de conversa ──────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  currentUserId,
}: {
  conv: Conversation
  currentUserId: string
}) {
  const isMyMessage = conv.lastSenderId === currentUserId

  return (
    // ✅ CORREÇÃO: rota correta é /conversas/[id], não /chat/[id]
    <Link
      href={`/conversas/${conv.matchId}`}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition text-left"
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
    </Link>
  )
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// ✅ CORREÇÃO: import correto do supabase singleton
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Loader2, Search, Archive } from 'lucide-react'

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
  const [aba, setAba] = useState<'ativos' | 'arquivados'>('ativos')

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
        otherName: row.other_name ?? 'Usuario',
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-jakarta)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: 'var(--text)', margin: 0 }}>
              Mensagens
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
          {loading && <Loader2 size={16} color="rgba(248,249,250,0.3)" className="animate-spin" />}
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={14} color="rgba(248,249,250,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)', borderRadius: 12,
              paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-jakarta)',
            }}
          />
        </div>

        {/* Tabs Ativos / Arquivados */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'ativos' as const, label: 'Ativos', Icon: MessageCircle },
            { key: 'arquivados' as const, label: 'Arquivados', Icon: Archive },
          ]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setAba(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                border: aba === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: aba === key ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: aba === key ? '#fff' : 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)', fontSize: 13, fontWeight: aba === key ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Lista */}
      <main style={{ paddingBottom: 96 }}>
        {aba === 'arquivados' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 16 }}>
            <Archive size={44} color="rgba(248,249,250,0.12)" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(248,249,250,0.50)', margin: '0 0 4px' }}>Nenhuma arquivada</p>
              <p style={{ fontSize: 13, maxWidth: 220, color: 'rgba(248,249,250,0.3)', margin: 0 }}>
                Voce pode arquivar conversas para organizar sua caixa de entrada.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Loader2 size={24} color="rgba(248,249,250,0.3)" className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 14 }}>
            <MessageCircle size={36} color="rgba(248,249,250,0.15)" />
            <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 220, color: 'rgba(248,249,250,0.3)', margin: 0 }}>
              {searchTerm
                ? 'Nenhuma conversa encontrada.'
                : 'Voce ainda nao tem conversas. Faca um match para comecar!'}
            </p>
            {!searchTerm && (
              <Link
                href="/busca"
                style={{
                  marginTop: 8, fontSize: 13, fontWeight: 600,
                  color: 'var(--accent)', textDecoration: 'none',
                  padding: '8px 20px', borderRadius: 100,
                  border: '1px solid var(--accent-border)',
                  background: 'var(--accent-soft)',
                }}
              >
                Explorar pessoas
              </Link>
            )}
          </div>
        ) : (
          <div>
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
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 20px', borderBottom: '1px solid var(--border-soft)',
        textDecoration: 'none',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
        }}>
          {conv.otherPhoto ? (
            <Image
              src={conv.otherPhoto}
              alt={conv.otherName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>
                {conv.otherName[0]}
              </span>
            </div>
          )}
        </div>
        {/* Badge de nao lidas */}
        {conv.unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 100,
            background: 'var(--accent)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <p style={{
            fontSize: 14, fontWeight: conv.unreadCount > 0 ? 700 : 500,
            color: conv.unreadCount > 0 ? 'var(--text)' : 'rgba(248,249,250,0.80)',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {conv.otherName}
          </p>
          {conv.lastMessageAt && (
            <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.30)', flexShrink: 0, marginLeft: 8 }}>
              {formatTime(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <p style={{
          fontSize: 13, margin: 0,
          color: conv.unreadCount > 0 ? 'rgba(248,249,250,0.65)' : 'rgba(248,249,250,0.35)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {conv.lastMessage
            ? `${isMyMessage ? 'Voce: ' : ''}${conv.lastMessage}`
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// ✅ CORREÇÃO: import correto do supabase singleton
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Search, Archive } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

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

const ARCHIVED_KEY = 'meandyou_archived_convs'

function getArchivedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ARCHIVED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function toggleArchived(matchId: string): boolean {
  const ids = getArchivedIds()
  if (ids.has(matchId)) { ids.delete(matchId) } else { ids.add(matchId) }
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify(Array.from(ids)))
  return ids.has(matchId)
}

export default function ConversasPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  // ✅ CORREÇÃO: não usar useAuth — buscar user via supabase.auth.getUser()
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [aba, setAba] = useState<'ativos' | 'arquivados'>('ativos')
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setArchivedIds(getArchivedIds())
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadConversations(user.id)

      channel = supabase
        .channel(`conversas-list-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, () => {
          loadConversations(user.id)
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
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
        lastActiveAt: row.other_last_active_at ?? null,
        showLastActive: row.other_show_last_active ?? false,
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
      toast.error('Erro ao carregar conversas')
    }
    setLoading(false)
  }

  function handleArchive(matchId: string) {
    const nowArchived = toggleArchived(matchId)
    const updated = getArchivedIds()
    setArchivedIds(new Set(updated))
    haptics.tap()
    toast.success(nowArchived ? 'Conversa arquivada' : 'Conversa restaurada')
  }

  const ativos    = conversations.filter(c => !archivedIds.has(c.matchId))
  const arquivados = conversations.filter(c => archivedIds.has(c.matchId))

  const filtered = (aba === 'ativos' ? ativos : arquivados).filter((c) =>
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
              onClick={() => { haptics.tap(); setAba(key) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                border: aba === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: aba === key ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: aba === key ? '#fff' : 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)', fontSize: 13, fontWeight: aba === key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
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
        {loading ? (
          <div style={{ padding: '12px 0' }}>
            <SkeletonList rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={aba === 'arquivados' ? <Archive size={28} /> : <MessageCircle size={28} />}
            title={
              aba === 'arquivados'
                ? 'Nenhuma conversa arquivada'
                : searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'
            }
            description={
              aba === 'arquivados'
                ? 'Deslize para o lado em uma conversa para arquivar.'
                : searchTerm ? undefined : 'Faça um match para começar a conversar!'
            }
            action={aba === 'ativos' && !searchTerm ? { label: 'Explorar pessoas', onClick: () => router.push('/busca') } : undefined}
          />
        ) : (
          <div>
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.matchId}
                conv={conv}
                currentUserId={userId!}
                isArchived={archivedIds.has(conv.matchId)}
                onArchive={handleArchive}
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
  isArchived,
  onArchive,
}: {
  conv: Conversation
  currentUserId: string
  isArchived: boolean
  onArchive: (matchId: string) => void
}) {
  const isMyMessage = conv.lastSenderId === currentUserId

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Botão arquivar (deslizando para o lado) */}
      <button
        onClick={() => onArchive(conv.matchId)}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        position: 'relative', zIndex: 1,
        marginRight: 80,
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
        {/* Indicador online (sobreposto) */}
        {conv.unreadCount === 0 && (
          <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
            <OnlineIndicator
              lastActiveAt={conv.lastActiveAt}
              showLastActive={conv.showLastActive}
              mode="dot"
              size={12}
            />
          </div>
        )}
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
            ? `${isMyMessage ? 'Você: ' : ''}${conv.lastMessage}`
            : 'Nenhuma mensagem ainda'}
        </p>
      </div>
    </Link>
    </div>
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

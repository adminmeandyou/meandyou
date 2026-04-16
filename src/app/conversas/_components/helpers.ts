export interface Conversation {
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

export interface ConvMatch {
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

export interface Friend {
  userId: string
  name: string
  photo: string | null
  lastSeen: string | null
  matchId: string | null
}

export type Aba = 'conversas' | 'todos' | 'online'

export const ARCHIVED_KEY = 'meandyou_archived_convs'

export function getArchivedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ARCHIVED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function isOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < 3600000
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatAgo(dateStr: string): string {
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

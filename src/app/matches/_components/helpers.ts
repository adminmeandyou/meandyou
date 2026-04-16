// Helpers e tipos compartilhados da página de Matches

export type Match = {
  match_id: string
  other_user_id: string
  name: string
  photo_best: string | null
  city: string | null
  state: string | null
  matched_at: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  conversation_id: string | null
  last_active_at?: string | null
  show_last_active?: boolean
  is_friend?: boolean
}

export type FriendProfile = {
  id: string
  name: string
  photo_best: string | null
  city: string | null
  plan: string
  last_seen: string | null
}

export type Friendship = {
  id: string
  requester_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  other: FriendProfile | null
}

export type MeetingInvite = {
  id: string
  match_id: string
  proposer_id: string
  receiver_id: string
  local: string
  meeting_date: string
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled' | 'cancelled'
  created_at: string
  responded_at: string | null
  reschedule_note: string | null
  other_id: string
  other_name: string
  other_photo: string | null
  is_proposer: boolean
}

// Lógica: sem conversa expira em 7 dias, com conversa expira em 14 dias sem interação
// Amigos (is_friend = true) nunca expiram
export function getExpiryInfo(matchedAt: string, lastMessageAt: string | null, isFriend?: boolean): { label: string; urgent: boolean } | null {
  if (isFriend) return null

  const now = Date.now()
  const matchAge = (now - new Date(matchedAt).getTime()) / 3600000

  if (lastMessageAt === null) {
    if (matchAge < 2) return { label: 'Novo', urgent: false }
    const horasRestantes = 168 - matchAge
    if (horasRestantes <= 0) return null
    if (horasRestantes <= 24) return { label: 'Expira hoje', urgent: true }
    if (horasRestantes <= 48) return { label: `Expira em ${Math.ceil(horasRestantes / 24)}d`, urgent: true }
    return null
  } else {
    const inativo = (now - new Date(lastMessageAt).getTime()) / 3600000
    const horasRestantes = 336 - inativo
    if (horasRestantes <= 0) return null
    if (horasRestantes <= 24) return { label: 'Expira hoje', urgent: true }
    if (horasRestantes <= 48) return { label: `Expira em ${Math.ceil(horasRestantes / 24)}d`, urgent: true }
    return null
  }
}

export function getNivel(matchedAt: string, lastMessageAt: string | null): { label: string; color: string } | null {
  if (!lastMessageAt) return null
  const daysSinceMatch = (Date.now() - new Date(matchedAt).getTime()) / 86400000
  if (daysSinceMatch > 30) return { label: 'História', color: '#F59E0B' }
  if (daysSinceMatch > 7)  return { label: 'Conexão',  color: '#10b981' }
  return { label: 'Sintonia', color: '#60a5fa' }
}

export function isFriendOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000
}

export function formatTempo(dateStr: string | null): string {
  if (!dateStr) return ''
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

export function formatMeetingDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)

  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  if (diffDays === 0) return `Hoje às ${time}`
  if (diffDays === 1) return `Amanhã às ${time}`
  if (diffDays === -1) return `Ontem às ${time}`
  if (diffDays < -1) return `${date} às ${time} (passado)`
  if (diffDays <= 7) return `${d.toLocaleDateString('pt-BR', { weekday: 'long' })} às ${time}`
  return `${date} às ${time}`
}

export function getMeetingStatusInfo(status: string, isProposer: boolean): { label: string; color: string; bg: string; border: string } {
  switch (status) {
    case 'pending':
      return isProposer
        ? { label: 'Aguardando resposta', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' }
        : { label: 'Pendente', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.25)' }
    case 'accepted':
      return { label: 'Confirmado', color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' }
    case 'declined':
      return { label: 'Recusado', color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' }
    case 'rescheduled':
      return { label: 'Reagendado', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' }
    case 'cancelled':
      return { label: 'Cancelado', color: 'rgba(248,249,250,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' }
    default:
      return { label: status, color: 'var(--muted)', bg: 'transparent', border: 'rgba(255,255,255,0.06)' }
  }
}

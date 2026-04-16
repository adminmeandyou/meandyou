// Types, constants e funcoes utilitarias do chat

export interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface OtherUser {
  id: string
  name: string
  photo_best: string | null
  verified: boolean
  last_seen: string | null
  show_last_active: boolean
}

export const MAX_CHARS = 500
export const CONVITE_PREFIX = '__CONVITE__:'
export const NUDGE_TOKEN = '__NUDGE__'
export const RESPOSTAS_RAPIDAS = ['Aceito!', 'Não posso', 'Em breve', 'Me conta mais!']

export function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export function getConviteResponse(messages: Message[], msgIndex: number): string | null {
  for (let i = msgIndex + 1; i < messages.length; i++) {
    const m = messages[i]
    if (m.content.startsWith(CONVITE_PREFIX) || m.content.startsWith('__MEETING__:')) break
    if (m.sender_id !== messages[msgIndex].sender_id && RESPOSTAS_RAPIDAS.includes(m.content)) {
      return m.content
    }
  }
  return null
}

export function checkRateLimit(messages: Message[], userId: string): boolean {
  const ultimas = [...messages].reverse()
  let seguidas = 0
  for (const m of ultimas) {
    if (m.sender_id === userId) seguidas++
    else break
  }
  return seguidas >= 5
}

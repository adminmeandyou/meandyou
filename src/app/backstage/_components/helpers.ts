import {
  Shield, CheckCircle, MapPin, Users, Heart, AlertTriangle, Flame,
  ThumbsUp, ThumbsDown, HeartHandshake, Trophy, Flag,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Step = 'loading' | 'terms' | 'categories' | 'vitrine'
export type MainTab = 'vitrine' | 'resgates'

export interface Profile {
  id: string
  name: string
  age: number
  city: string
  state: string
  photo_body: string | null
  photo_best: string | null
  camarote_interests: string[]
}

export interface Filters {
  city: string
  state: string
  ageMin: number
  ageMax: number
}

export interface AccessRequest {
  id: string
  requester_id: string
  category: string
  tier: string
  city: string
  state: string
  age: number
  display_name: string
  created_at: string
}

export interface RescuedRequest {
  id: string
  requester_id: string
  category: string
  city: string
  state: string
  age: number
  display_name: string
  rescued_at: string
  expires_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIAS = [
  { key: 'trisal',   label: 'Trisal' },
  { key: 'menage',   label: 'Menage' },
  { key: 'bdsm',     label: 'BDSM' },
  { key: 'sado',     label: 'Sadomasoquismo' },
  { key: 'sugar',    label: 'Sugar' },
  { key: 'swing',    label: 'Swing' },
  { key: 'poliamor', label: 'Poliamor' },
]

export const TERMS_KEY = 'camarote_terms_v1'

export const G = '#F59E0B'
export const G_SOFT = 'rgba(245,158,11,0.10)'
export const G_BORDER = 'rgba(245,158,11,0.25)'
export const G_BORDER2 = 'rgba(245,158,11,0.15)'
export const BG = '#08090E'
export const BG_CARD_GRADIENT = 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)'
export const BG_CARD = '#0F1117'
export const BG_DARK = '#050608'

export const DEFAULT_FILTERS: Filters = { city: '', state: '', ageMin: 18, ageMax: 60 }

export const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export const SAFETY_ITEMS = [
  { icon: Shield, text: 'Mantenha toda comunicação pelo app. Suas conversas ficam salvas e protegidas.' },
  { icon: CheckCircle, text: 'Use a videochamada para verificar que a pessoa é real antes de marcar um encontro.' },
  { icon: MapPin, text: 'Marque encontros em locais públicos e seguros na primeira vez.' },
  { icon: Users, text: 'Avise alguém de confiança: onde vai, com quem e em que horário.' },
  { icon: Heart, text: 'Leve seu telefone carregado e comunique-se durante o encontro.' },
  { icon: AlertTriangle, text: 'Não compartilhe dados pessoais (endereço, trabalho) antes de ter confiança.' },
  { icon: Flame, text: 'Use o botão de denúncia se algo parecer errado. Estamos aqui para proteger você.' },
]

export const BACKSTAGE_RATING_OPTIONS = [
  { key: 'bom_papo',  label: 'Bom de papo',              icon: ThumbsUp,       color: '#2ec4a0' },
  { key: 'sairam',    label: 'Sairam para se conhecer',  icon: HeartHandshake, color: '#E11D48' },
  { key: 'objetivo',  label: 'Alcancaram o objetivo',    icon: Trophy,         color: G         },
  { key: 'bolo',      label: 'Levou bolo',               icon: ThumbsDown,     color: 'rgba(248,249,250,0.40)' },
  { key: 'denuncia',  label: 'Denunciar',                icon: Flag,           color: '#f87171' },
]

// ─── Utility functions ────────────────────────────────────────────────────────

export function isRated(requestId: string): boolean {
  if (typeof window === 'undefined') return false
  const v = localStorage.getItem(`camarote_rating_${requestId}`)
  return !!v && v !== 'skip'
}

export function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function catLabel(key: string) {
  return CATEGORIAS.find(c => c.key === key)?.label ?? key
}

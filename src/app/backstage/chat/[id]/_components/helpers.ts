'use client'

import { ThumbsUp, HeartHandshake, Trophy, ThumbsDown, Flag } from 'lucide-react'

export const G        = '#F59E0B'
export const G_SOFT   = 'rgba(245,158,11,0.10)'
export const G_BORDER = 'rgba(245,158,11,0.25)'
export const BG       = '#08090E'
export const BG_CARD  = '#0F1117'

export const CATEGORIAS: Record<string, string> = {
  trisal: 'Trisal', menage: 'Menage', bdsm: 'BDSM',
  sado: 'Sadomasoquismo', sugar: 'Sugar', swing: 'Swing', poliamor: 'Poliamor',
}

export const MAX_CHARS = 500

export const RATING_OPTIONS = [
  { key: 'bom_papo',  label: 'Bom de papo',              icon: ThumbsUp,       color: '#2ec4a0' },
  { key: 'sairam',    label: 'Saíram para se conhecer',   icon: HeartHandshake, color: '#E11D48' },
  { key: 'objetivo',  label: 'Alcançaram o objetivo',    icon: Trophy,         color: G         },
  { key: 'bolo',      label: 'Levou bolo',               icon: ThumbsDown,     color: 'rgba(248,249,250,0.40)' },
  { key: 'denuncia',  label: 'Denunciar',                icon: Flag,           color: '#f87171' },
]

export const INVITE_PREFIX = '__CONVITE__:'
export const INVITE_RESPONSES = ['Aceito!', 'Não posso', 'Em breve', 'Me conta mais!']

export interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
}

export interface RequestData {
  id: string
  requester_id: string
  rescued_by: string
  category: string
  expires_at: string
  rescued_at: string | null
  created_at: string
}

export interface OtherProfile {
  id: string
  name: string
  photo_best: string | null
}

export interface MeetingForm {
  local: string
  date: string
  time: string
}

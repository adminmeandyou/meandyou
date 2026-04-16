import {
  Star, Zap, Search, RotateCcw, Ghost, Eye, Gift, BadgeCheck,
  TrendingUp, Coins, Crown, Video,
} from 'lucide-react'
import React from 'react'

export const FICHAS_PACKAGES = [
  { label: '50 fichas',   price: 'R$ 5,97',  amountCents: 597,  qtd: 50,  highlight: false, tag: null,         packageId: 'fichas_50' },
  { label: '150 fichas',  price: 'R$ 14,97', amountCents: 1497, qtd: 150, highlight: true,  tag: 'Mais popular', packageId: 'fichas_150' },
  { label: '400 fichas',  price: 'R$ 34,97', amountCents: 3497, qtd: 400, highlight: false, tag: null,         packageId: 'fichas_400' },
  { label: '900 fichas',  price: 'R$ 59,97', amountCents: 5997, qtd: 900, highlight: false, tag: 'Melhor valor', packageId: 'fichas_900' },
]

export type ItemKey =
  | 'superlike' | 'boost' | 'lupa' | 'rewind'
  | 'ghost_7d' | 'ghost_35d'
  | 'reveals_5' | 'xp_bonus_3d' | 'verified_plus' | 'caixa_surpresa' | 'caixa_lendaria'
  | 'passaporte_camarote'
  | 'live_1h' | 'live_5h' | 'live_15h' | 'live_30h'

export interface StoreItem {
  key: ItemKey
  label: string
  description: string
  unit: string
  icon: React.ReactNode
  baseFichas: number
  accentColor: string
  blackOnly?: boolean
  accentBg: string
  accentBorder: string
  balanceKey?: string
  maxQty: number
  new?: boolean
}

export const STORE_ITEMS: StoreItem[] = [
  {
    key: 'superlike', label: 'SuperCurtida', description: 'Se destaque para quem você mais quer',
    unit: 'SuperCurtida',
    icon: React.createElement(Star, { size: 20, strokeWidth: 1.5 }), baseFichas: 30, maxQty: 10,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    balanceKey: 'superlikes',
  },
  {
    key: 'boost', label: 'Boost', description: '1 hora em destaque na sua região',
    unit: 'Boost',
    icon: React.createElement(Zap, { size: 20, strokeWidth: 1.5 }), baseFichas: 40, maxQty: 5,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    balanceKey: 'boosts',
  },
  {
    key: 'lupa', label: 'Lupa', description: 'Revele perfis borrados na aba Destaque',
    unit: 'Lupa',
    icon: React.createElement(Search, { size: 20, strokeWidth: 1.5 }), baseFichas: 25, maxQty: 10,
    accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.10)', accentBorder: 'rgba(59,130,246,0.25)',
    balanceKey: 'lupas',
  },
  {
    key: 'rewind', label: 'Desfazer', description: 'Volte atrás em perfis que passou',
    unit: 'Desfazer',
    icon: React.createElement(RotateCcw, { size: 20, strokeWidth: 1.5 }), baseFichas: 20, maxQty: 10,
    accentColor: '#a855f7', accentBg: 'rgba(168,85,247,0.10)', accentBorder: 'rgba(168,85,247,0.25)',
    balanceKey: 'rewinds',
  },
  {
    key: 'ghost_7d', label: 'Fantasma 7 dias', description: 'Fique invisível nas buscas por 7 dias',
    unit: 'ativação',
    icon: React.createElement(Ghost, { size: 20, strokeWidth: 1.5 }), baseFichas: 60, maxQty: 1,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  {
    key: 'ghost_35d', label: 'Fantasma 35 dias', description: 'Invisibilidade por mais de um mês',
    unit: 'ativação',
    icon: React.createElement(Ghost, { size: 20, strokeWidth: 1.5 }), baseFichas: 220, maxQty: 1,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  {
    key: 'reveals_5', label: 'Ver quem curtiu', description: 'Revela todos os perfis que curtiram você por 24 horas',
    unit: 'acesso (24h)',
    icon: React.createElement(Eye, { size: 20, strokeWidth: 1.5 }), baseFichas: 50, maxQty: 5,
    accentColor: '#ec4899', accentBg: 'rgba(236,72,153,0.10)', accentBorder: 'rgba(236,72,153,0.25)',
    new: true,
  },
  {
    key: 'xp_bonus_3d', label: 'Bônus de XP (7 dias)', description: 'Ganhe o dobro de XP em tudo por 7 dias',
    unit: 'ativação',
    icon: React.createElement(TrendingUp, { size: 20, strokeWidth: 1.5 }), baseFichas: 100, maxQty: 1,
    accentColor: '#10b981', accentBg: 'rgba(16,185,129,0.10)', accentBorder: 'rgba(16,185,129,0.25)',
    new: true,
  },
  {
    key: 'verified_plus', label: 'Selo Verificado Plus', description: 'Selo especial exibido no seu perfil para sempre',
    unit: 'ativação',
    icon: React.createElement(BadgeCheck, { size: 20, strokeWidth: 1.5 }), baseFichas: 200, maxQty: 1,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    new: true,
  },
  {
    key: 'caixa_surpresa', label: 'Caixa Surpresa', description: 'Prêmio aleatório, pode ser raro!',
    unit: 'caixa',
    icon: React.createElement(Gift, { size: 20, strokeWidth: 1.5 }), baseFichas: 35, maxQty: 5,
    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.10)', accentBorder: 'rgba(139,92,246,0.25)',
    new: true,
  },
  {
    key: 'caixa_lendaria', label: 'Caixa Super Lendária', description: 'Recompensas exclusivas e raras, itens que não existem em outro lugar',
    unit: 'caixa',
    icon: React.createElement(Gift, { size: 20, strokeWidth: 1.5 }), baseFichas: 2250, maxQty: 1,
    accentColor: '#F59E0B', accentBg: 'rgba(139,92,246,0.15)', accentBorder: 'rgba(245,158,11,0.50)',
    new: true,
  },
  {
    key: 'live_1h', label: 'Tempo Live +1h', description: '1 hora extra de videochamada',
    unit: 'hora',
    icon: React.createElement(Video, { size: 20, strokeWidth: 1.5 }), baseFichas: 40, maxQty: 10,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    new: true,
  },
  {
    key: 'live_5h', label: 'Tempo Live +5h', description: '5 horas extras de videochamada',
    unit: 'pacote',
    icon: React.createElement(Video, { size: 20, strokeWidth: 1.5 }), baseFichas: 170, maxQty: 5,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    new: true,
  },
  {
    key: 'live_15h', label: 'Tempo Live +15h', description: '15 horas extras de videochamada',
    unit: 'pacote',
    icon: React.createElement(Video, { size: 20, strokeWidth: 1.5 }), baseFichas: 350, maxQty: 3,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    new: true,
  },
  {
    key: 'live_30h', label: 'Tempo Live +30h', description: '30 horas extras de videochamada',
    unit: 'pacote',
    icon: React.createElement(Video, { size: 20, strokeWidth: 1.5 }), baseFichas: 600, maxQty: 2,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    new: true,
  },
  {
    key: 'passaporte_camarote', label: 'Passaporte Camarote', description: 'Acesso ao Camarote por 30 dias: Sugar, Fetiche e salas VIP',
    unit: 'acesso (30 dias)',
    icon: React.createElement(Crown, { size: 20, strokeWidth: 1.5 }), baseFichas: 70, maxQty: 1,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.30)',
    blackOnly: true,
    new: true,
  },
]

export const SURPRESA_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  fichas:        { label: 'Fichas',           color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: React.createElement(Coins, { size: 44, color: '#F59E0B', strokeWidth: 1.5 }) },
  ticket:        { label: 'Fichas',           color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: React.createElement(Coins, { size: 44, color: '#F59E0B', strokeWidth: 1.5 }) },
  supercurtida:  { label: 'SuperCurtida',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: React.createElement(Star, { size: 44, color: '#F59E0B', strokeWidth: 1.5 }) },
  boost:         { label: 'Boost',            color: '#E11D48', bg: 'rgba(225,29,72,0.15)',  icon: React.createElement(Zap, { size: 44, color: '#E11D48', strokeWidth: 1.5 }) },
  lupa:          { label: 'Lupa',             color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: React.createElement(Search, { size: 44, color: '#3b82f6', strokeWidth: 1.5 }) },
  rewind:        { label: 'Desfazer',         color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: React.createElement(RotateCcw, { size: 44, color: '#a855f7', strokeWidth: 1.5 }) },
  invisivel_1d:  { label: '1 dia Invisível',  color: '#9ca3af', bg: 'rgba(107,114,128,0.15)', icon: React.createElement(Ghost, { size: 44, color: '#9ca3af', strokeWidth: 1.5 }) },
  plan_plus_1d:  { label: '1 dia Plus',       color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: React.createElement(BadgeCheck, { size: 44, color: '#10b981', strokeWidth: 1.5 }) },
  plan_black_1d: { label: '1 dia Black',      color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: React.createElement(BadgeCheck, { size: 44, color: '#F59E0B', strokeWidth: 1.5 }) },
}

// src/hooks/usePlan.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type PlanType = 'essencial' | 'plus' | 'black' | null

export interface PlanLimits {
  plan: PlanType
  // Curtidas
  likesPerDay: number
  likesUsedToday: number
  likesRemaining: number
  // SuperCurtidas
  superlikesPerDay: number
  superlikesBalance: number  // saldo avulso em user_superlikes
  // Funcionalidades
  canUndo: boolean
  rewindsBalance: number
  canSeeWhoLiked: boolean
  canUseAllFilters: boolean
  canUseExclusionFilter: boolean
  canAccessBackstage: boolean
  canAccessFetiche: boolean
  // Boost
  boostsBalance: number
  maxSimultaneousBoosts: number
  // Lupa / Destaque
  lupasBalance: number
  lupasPerDay: number
  // Tickets roleta
  ticketsBalance: number
  ticketsPerDay: number
  // Limites fixos
  maxPhotos: number           // todos os planos: 10
  videoMinutesPerDay: number
  isBlack: boolean
  isPlus: boolean
}

// Limites estáticos por plano — valores dinâmicos (saldos) vêm do banco
const PLAN_CONFIG: Record<string, Partial<PlanLimits>> = {
  essencial: {
    likesPerDay:            5,
    superlikesPerDay:       1,
    canUndo:                false,
    canSeeWhoLiked:         false,
    canUseAllFilters:       false,
    canUseExclusionFilter:  false,
    canAccessBackstage:     false,
    canAccessFetiche:       true,   // Essencial pode solicitar Fetiche
    maxSimultaneousBoosts:  1,
    lupasPerDay:            0,
    ticketsPerDay:          1,
    maxPhotos:              10,     // todos os planos têm 10 fotos
    videoMinutesPerDay:     60,
    isBlack:                false,
    isPlus:                 false,
  },
  plus: {
    likesPerDay:            30,
    superlikesPerDay:       5,
    canUndo:                true,
    canSeeWhoLiked:         true,
    canUseAllFilters:       true,
    canUseExclusionFilter:  true,
    canAccessBackstage:     false,
    canAccessFetiche:       true,
    maxSimultaneousBoosts:  1,
    lupasPerDay:            1,
    ticketsPerDay:          2,
    maxPhotos:              10,
    videoMinutesPerDay:     300,
    isBlack:                false,
    isPlus:                 true,
  },
  black: {
    likesPerDay:            Infinity,
    superlikesPerDay:       10,      // Black NÃO é ilimitado — máx 10/dia
    canUndo:                true,
    canSeeWhoLiked:         true,
    canUseAllFilters:       true,
    canUseExclusionFilter:  true,
    canAccessBackstage:     true,
    canAccessFetiche:       true,
    maxSimultaneousBoosts:  2,       // máx 2 boosts simultâneos
    lupasPerDay:            2,
    ticketsPerDay:          3,
    maxPhotos:              10,
    videoMinutesPerDay:     600,
    isBlack:                true,
    isPlus:                 true,
  },
}

export function usePlan() {
  const { user } = useAuth()

  const [limits, setLimits] = useState<PlanLimits>({
    plan:                   null,
    likesPerDay:            5,
    likesUsedToday:         0,
    likesRemaining:         5,
    superlikesPerDay:       1,
    superlikesBalance:      0,
    canUndo:                false,
    rewindsBalance:         0,
    canSeeWhoLiked:         false,
    canUseAllFilters:       false,
    canUseExclusionFilter:  false,
    canAccessBackstage:     false,
    canAccessFetiche:       true,
    boostsBalance:          0,
    maxSimultaneousBoosts:  1,
    lupasBalance:           0,
    lupasPerDay:            0,
    ticketsBalance:         0,
    ticketsPerDay:          1,
    maxPhotos:              10,
    videoMinutesPerDay:     60,
    isBlack:                false,
    isPlus:                 false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadPlan()
  }, [user?.id])

  async function loadPlan() {
    if (!user) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    // Buscar tudo em paralelo
    const [profileRes, likesRes, superlikesRes, boostsRes, lupasRes, ticketsRes, rewindsRes] =
      await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        // likes usados hoje — coluna from_user (não user_id)
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('from_user', user.id)
          .eq('type', 'like')
          .gte('created_at', `${today}T00:00:00`),
        supabase.from('user_superlikes').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_boosts').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_lupas').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_tickets').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_rewinds').select('amount').eq('user_id', user.id).single(),
      ])

    const plan = (profileRes.data?.plan as PlanType) ?? 'essencial'
    const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.essencial

    const likesUsedToday = likesRes.count ?? 0
    const likesPerDay    = config.likesPerDay ?? 5
    const likesRemaining = likesPerDay === Infinity
      ? Infinity
      : Math.max(0, likesPerDay - likesUsedToday)

    setLimits({
      plan,
      likesPerDay,
      likesUsedToday,
      likesRemaining,
      superlikesBalance:     superlikesRes.data?.amount ?? 0,
      boostsBalance:         boostsRes.data?.amount     ?? 0,
      lupasBalance:          lupasRes.data?.amount      ?? 0,
      ticketsBalance:        ticketsRes.data?.amount    ?? 0,
      rewindsBalance:        rewindsRes.data?.amount    ?? 0,
      ...config,
    } as PlanLimits)

    setLoading(false)
  }

  function canLike(): boolean {
    return limits.likesRemaining > 0 || limits.likesPerDay === Infinity
  }

  function getUpgradeMessage(feature: string): string {
    const msgs: Record<string, string> = {
      likes:      `Você usou todas as ${limits.likesPerDay} curtidas de hoje. Faça upgrade para curtir mais!`,
      superlike:  'SuperLike está disponível a partir do plano Plus.',
      undo:       'Desfazer curtida está disponível a partir do plano Plus.',
      whoLiked:   'Ver quem curtiu você está disponível a partir do plano Plus.',
      filters:    'Filtros avançados estão disponíveis a partir do plano Plus.',
      backstage:  'O Backstage é exclusivo para assinantes Black.',
      photos:     `Seu plano permite até ${limits.maxPhotos} fotos.`,
    }
    return msgs[feature] ?? 'Faça upgrade para acessar esta função.'
  }

  return {
    limits,
    loading,
    canLike,
    getUpgradeMessage,
    reload: loadPlan,
  }
}

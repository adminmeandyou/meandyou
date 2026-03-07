// src/hooks/usePlan.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export type PlanType = 'essencial' | 'plus' | 'black' | null

export interface PlanLimits {
  plan: PlanType
  likesPerDay: number
  likesUsedToday: number
  likesRemaining: number
  canSuperlike: boolean
  superlikesPerDay: number
  canUndo: boolean
  canSeeWhoLiked: boolean
  canUseAllFilters: boolean
  canUseExclusionFilter: boolean
  maxPhotos: number
  hasWeeklyBoost: boolean
  isBlack: boolean
  isPlus: boolean
  canAccessBackstage: boolean
}

const PLAN_LIMITS: Record<string, Omit<PlanLimits, 'plan' | 'likesUsedToday' | 'likesRemaining'>> = {
  essencial: {
    likesPerDay: 5,
    canSuperlike: false,
    superlikesPerDay: 0,
    canUndo: false,
    canSeeWhoLiked: false,
    canUseAllFilters: false,
    canUseExclusionFilter: false,
    maxPhotos: 3,
    hasWeeklyBoost: false,
    isBlack: false,
    isPlus: false,
    canAccessBackstage: false,
  },
  plus: {
    likesPerDay: 30,
    canSuperlike: true,
    superlikesPerDay: 5,
    canUndo: true,
    canSeeWhoLiked: true,
    canUseAllFilters: true,
    canUseExclusionFilter: true,
    maxPhotos: 5,
    hasWeeklyBoost: true,
    isBlack: false,
    isPlus: true,
    canAccessBackstage: false,
  },
  black: {
    likesPerDay: Infinity,
    canSuperlike: true,
    superlikesPerDay: Infinity,
    canUndo: true,
    canSeeWhoLiked: true,
    canUseAllFilters: true,
    canUseExclusionFilter: true,
    maxPhotos: 8,
    hasWeeklyBoost: true,
    isBlack: true,
    isPlus: true,
    canAccessBackstage: true,
  },
}

export function usePlan() {
  const { user } = useAuth()
  const supabase = createClient()

  const [limits, setLimits] = useState<PlanLimits>({
    plan: null,
    likesPerDay: 5,
    likesUsedToday: 0,
    likesRemaining: 5,
    ...PLAN_LIMITS.essencial,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadPlan()
  }, [user])

  async function loadPlan() {
    setLoading(true)

    // Buscar plano ativo
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status, ends_at')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .single()

    const plan = (sub?.plan as PlanType) ?? 'essencial'
    const planConfig = PLAN_LIMITS[plan] ?? PLAN_LIMITS.essencial

    // Contar likes usados hoje
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', `${today}T00:00:00`)

    const likesUsedToday = count ?? 0
    const likesRemaining = planConfig.likesPerDay === Infinity
      ? Infinity
      : Math.max(0, planConfig.likesPerDay - likesUsedToday)

    setLimits({
      plan,
      likesUsedToday,
      likesRemaining,
      ...planConfig,
    })
    setLoading(false)
  }

  function canLike(): boolean {
    return limits.likesRemaining > 0 || limits.likesPerDay === Infinity
  }

  function getUpgradeMessage(feature: string): string {
    const messages: Record<string, string> = {
      likes: `Você usou todas as ${limits.likesPerDay} curtidas de hoje. Faça upgrade para curtir mais!`,
      superlike: 'SuperLike está disponível a partir do plano Plus.',
      undo: 'Desfazer curtida está disponível a partir do plano Plus.',
      whoLiked: 'Ver quem curtiu você está disponível a partir do plano Plus.',
      filters: 'Filtros avançados estão disponíveis a partir do plano Plus.',
      backstage: 'O Backstage é exclusivo para assinantes Black.',
      photos: `Seu plano permite até ${limits.maxPhotos} fotos. Faça upgrade para adicionar mais.`,
    }
    return messages[feature] ?? 'Faça upgrade para acessar esta função.'
  }

  return {
    limits,
    loading,
    canLike,
    getUpgradeMessage,
    reload: loadPlan,
  }
}
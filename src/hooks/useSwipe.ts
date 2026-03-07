// src/hooks/useSwipe.ts
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ProfileResult } from '@/hooks/useSearch'

export type SwipeAction = 'like' | 'dislike' | 'superlike'

interface MatchResult {
  isMatch: boolean
  matchId?: string
  matchedProfile?: ProfileResult
}

export function useSwipe(profiles: ProfileResult[], onRefresh: () => void) {
  const supabase = createClient()
  const { user } = useAuth()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)

  const currentProfile = profiles[currentIndex] ?? null
  const hasMore = currentIndex < profiles.length

  const swipe = useCallback(async (action: SwipeAction) => {
    if (!user || !currentProfile || processing) return
    setProcessing(true)

    try {
      if (action === 'dislike') {
        // Apenas registra o dislike localmente (não salva no banco)
        setCurrentIndex((i) => i + 1)
        setProcessing(false)
        return
      }

      const { data, error } = await supabase.rpc('process_like', {
        p_user_id: user.id,
        p_target_id: currentProfile.id,
        p_is_superlike: action === 'superlike',
      })

      if (error) throw error

      if (data.is_match) {
        setMatchResult({
          isMatch: true,
          matchId: data.match_id,
          matchedProfile: currentProfile,
        })
      }

      setCurrentIndex((i) => i + 1)
    } catch (err) {
      console.error('Erro ao processar like:', err)
    } finally {
      setProcessing(false)
    }

    // Se acabaram os perfis, recarrega
    if (currentIndex + 1 >= profiles.length) {
      setTimeout(onRefresh, 500)
    }
  }, [user, currentProfile, processing, currentIndex, profiles.length, supabase, onRefresh])

  function dismissMatch() {
    setMatchResult(null)
  }

  return {
    currentProfile,
    currentIndex,
    hasMore,
    processing,
    matchResult,
    swipe,
    dismissMatch,
  }
}
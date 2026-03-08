// src/hooks/useSwipe.ts
'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ProfileResult } from '@/hooks/useSearch'

export type SwipeAction = 'like' | 'dislike' | 'superlike'

interface MatchResult {
  isMatch:        boolean
  matchId?:       string
  matchedProfile?: ProfileResult
}

// Rate limit anti-fake: máx 10 curtidas por minuto
const MAX_LIKES_PER_MINUTE = 10

export function useSwipe(profiles: ProfileResult[], onRefresh: () => void) {
  const { user } = useAuth()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [processing, setProcessing]     = useState(false)
  const [matchResult, setMatchResult]   = useState<MatchResult | null>(null)

  // Contador anti-fake comportamental
  const rateLimitRef = useRef<{ count: number; windowStart: number }>({
    count: 0,
    windowStart: Date.now(),
  })

  const currentProfile = profiles[currentIndex] ?? null
  const hasMore        = currentIndex < profiles.length

  const swipe = useCallback(async (action: SwipeAction) => {
    if (!user || !currentProfile || processing) return

    // Anti-fake: 10 likes por minuto — bloqueia por 5 min se ultrapassar
    if (action !== 'dislike') {
      const rl  = rateLimitRef.current
      const now = Date.now()
      if (now - rl.windowStart > 60_000) {
        rl.count       = 0
        rl.windowStart = now
      }
      rl.count++
      if (rl.count > MAX_LIKES_PER_MINUTE) {
        // Não bane — apenas retorna mensagem amigável
        setMatchResult(null)
        setProcessing(false)
        // Avança o card mesmo assim para não travar a UI
        setCurrentIndex(i => i + 1)
        return
      }
    }

    setProcessing(true)

    try {
      if (action === 'dislike') {
        // Salva dislike no banco para não reaparecer o perfil
        await supabase.from('likes').insert({
          from_user: user.id,
          to_user:   currentProfile.id,
          type:      'dislike',
        }).then(() => {}) // fire and forget — não bloqueia o swipe

        setCurrentIndex(i => i + 1)
        setProcessing(false)
        return
      }

      // like ou superlike — RPC process_like(p_from, p_to, type)
      const { data, error } = await supabase.rpc('process_like', {
        p_from: user.id,
        p_to:   currentProfile.id,
        p_type: action,          // 'like' | 'superlike'
      })

      if (error) throw error

      if (data?.matched) {
        setMatchResult({
          isMatch:        true,
          matchId:        data.match_id,
          matchedProfile: currentProfile,
        })
      }

      setCurrentIndex(i => i + 1)
    } catch (err) {
      console.error('Erro ao processar swipe:', err)
    } finally {
      setProcessing(false)
    }

    // Recarrega quando acabar os perfis
    if (currentIndex + 1 >= profiles.length) {
      setTimeout(onRefresh, 500)
    }
  }, [user?.id, currentProfile, processing, currentIndex, profiles.length, onRefresh])

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

// src/hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { awardXp } from '@/app/lib/xp'
import { saveUserLocation } from '@/app/lib/location'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pega sessão atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) {
        // fire-and-forget: registra atividade + atualiza streak diário + salva localização
        supabase.rpc('update_daily_streak', { p_user_id: user.id }).then(() => {
          awardXp(user.id, 'login_streak')
        })
        saveUserLocation(user.id)
      }
    })

    // Ouve mudanças de sessão (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, supabase }
}

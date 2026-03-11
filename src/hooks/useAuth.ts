// src/hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
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
        // fire-and-forget: registra atividade sem bloquear carregamento da sessão
        supabase.from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', user.id)
          .then(() => {})
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

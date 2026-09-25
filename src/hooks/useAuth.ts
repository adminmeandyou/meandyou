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
        // fire-and-forget: streak diário + XP de login (1x por dia) e localização (a cada 30 min).
        // Antes rodava a cada troca de página: XP/tickets infinitos e ipapi.co estourando o limite.
        const hoje = new Date().toISOString().slice(0, 10)
        if (lerSessao(`may_streak_${user.id}`) !== hoje) {
          gravarSessao(`may_streak_${user.id}`, hoje)
          supabase.rpc('update_daily_streak', { p_user_id: user.id }).then(() => {
            awardXp(user.id, 'login_streak')
          })
        }
        const ultimaLoc = Number(lerSessao(`may_loc_${user.id}`) ?? 0)
        if (Date.now() - ultimaLoc > 30 * 60 * 1000) {
          gravarSessao(`may_loc_${user.id}`, String(Date.now()))
          saveUserLocation(user.id)
        }
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

function lerSessao(chave: string): string | null {
  try { return sessionStorage.getItem(chave) } catch { return null }
}

function gravarSessao(chave: string, valor: string) {
  try { sessionStorage.setItem(chave, valor) } catch { /* modo privado etc. — segue sem cache */ }
}

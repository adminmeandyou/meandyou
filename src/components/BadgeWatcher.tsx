'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import { BadgeUnlockedToast, BadgeData } from './BadgeUnlockedToast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos entre checagens automáticas
const LS_KEY = 'may_badge_last_check'

export function BadgeWatcher() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<BadgeData[]>([])
  const lastCheckRef = useRef<number>(0)

  const checkBadges = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    const now = Date.now()
    if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return
    lastCheckRef.current = now
    localStorage.setItem(LS_KEY, String(now))

    try {
      const res = await fetch('/api/badges/check-user', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      const { awarded } = await res.json()
      if (awarded?.length > 0) {
        setQueue(prev => [...prev, ...awarded])
      }
    } catch { /* silencioso */ }
  }, [])

  // Checagem inicial (respeita intervalo salvo no localStorage)
  useEffect(() => {
    if (!user) return
    const lastCheck = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10)
    lastCheckRef.current = lastCheck
    checkBadges()
  }, [user, checkBadges])

  // Checagem ao voltar para o app (focus)
  useEffect(() => {
    if (!user) return
    const onFocus = () => checkBadges()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, checkBadges])

  // Realtime: escuta novos badges concedidos (pelo admin ou pela API)
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`user-badges-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const badgeId = payload.new?.badge_id
          if (!badgeId) return
          // Busca os detalhes do badge para mostrar na notificação
          const { data } = await supabase
            .from('badges')
            .select('id, name, description, icon_url, rarity')
            .eq('id', badgeId)
            .single()
          if (data) {
            setQueue(prev => {
              // Evita duplicatas na fila
              if (prev.some(b => b.id === data.id)) return prev
              return [...prev, data as BadgeData]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  function dequeue() {
    setQueue(prev => prev.slice(1))
  }

  return <BadgeUnlockedToast queue={queue} onDequeue={dequeue} />
}

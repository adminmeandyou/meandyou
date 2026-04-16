'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useHaptics } from '@/hooks/useHaptics'
import { playSoundDirect } from '@/hooks/useSounds'

interface NotificationContextType {
  unreadCount: number
  markAllRead: () => void
  decrementUnread: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markAllRead: () => {},
  decrementUnread: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const haptics = useHaptics()

  // Busca userId e contagem inicial
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Contagem inicial via API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch('/api/notificacoes', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.nao_lidas ?? 0)
        }
      } catch { /* silencioso */ }
    }
    init()
  }, [])

  // Realtime: escuta novas notificações
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notif-global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        setUnreadCount(prev => prev + 1)
        haptics.tap()
        playSoundDirect('notification')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, haptics])

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const decrementUnread = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead, decrementUnread }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export function useFriendRequests() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch('/api/amigos')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        // Contar pedidos recebidos pendentes
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !mounted) return
        const received = (data.pending ?? []).filter(
          (f: { receiver_id: string }) => f.receiver_id === user.id
        )
        setPendingCount(received.length)
      } catch { /* silencioso */ }
    }

    load()

    return () => { mounted = false }
  }, [])

  return { pendingCount }
}

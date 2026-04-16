'use client'

import { useState, useEffect } from 'react'

export function useCountdownStr(until?: string): string {
  const [str, setStr] = useState('')
  useEffect(() => {
    if (!until) return
    const update = () => {
      const diff = new Date(until).getTime() - Date.now()
      if (diff <= 0) { setStr('Expirando'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 24) setStr(`${Math.floor(h / 24)}d ${h % 24}h`)
      else if (h > 0) setStr(`${h}h ${m}m`)
      else setStr(`${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [until])
  return str
}

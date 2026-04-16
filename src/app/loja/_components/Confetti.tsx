'use client'

import { useRef, useEffect } from 'react'

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight
    const COLS = ['#E11D48','#F59E0B','#10b981','#3b82f6','#a855f7','#F43F5E','#ffffff','#f97316','#06b6d4']
    type P = { x:number; y:number; vx:number; vy:number; color:string; w:number; h:number; r:number; rv:number }
    const ps: P[] = Array.from({ length: 130 }, () => ({
      x: Math.random() * c.width,
      y: -30 - Math.random() * 400,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      color: COLS[Math.floor(Math.random() * COLS.length)],
      w: Math.random() * 12 + 5, h: Math.random() * 6 + 3,
      r: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.14,
    }))
    let alive = true
    const tick = () => {
      if (!alive) return
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.r += p.rv
        if (p.y > c.height + 30) { p.y = -30; p.x = Math.random() * c.width; p.vy = Math.random() * 3 + 2 }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r)
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      requestAnimationFrame(tick)
    }
    tick()
    return () => { alive = false }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
}

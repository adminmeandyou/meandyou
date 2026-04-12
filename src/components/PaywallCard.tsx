'use client'

import { useRouter } from 'next/navigation'
import { Lock, Crown, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PaywallCardProps {
  title: string
  description: string
  resetAt?: Date        // quando o bloqueio reseta (ex: meia-noite para curtidas)
  ctaLabel?: string
}

function useCountdown(resetAt?: Date) {
  const calc = () =>
    resetAt ? Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000)) : 0

  const [seconds, setSeconds] = useState(calc)

  useEffect(() => {
    if (!resetAt) return
    const id = setInterval(() => setSeconds(calc()), 1000)
    return () => clearInterval(id)
  }, [resetAt])

  if (!resetAt || seconds === 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function PaywallCard({
  title,
  description,
  resetAt,
  ctaLabel = 'Ver planos',
}: PaywallCardProps) {
  const router = useRouter()
  const countdown = useCountdown(resetAt)

  return (
    <div className="rounded-3xl border border-[#E11D48]/20 bg-[#E11D48]/5 p-6">
      <div className="flex flex-col items-center text-center gap-4">

        {/* Ícone */}
        <div className="w-16 h-16 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/25 flex items-center justify-center">
          <Lock size={24} className="text-[#E11D48]" />
        </div>

        {/* Texto */}
        <div>
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-white/40 text-sm mt-1 max-w-xs leading-relaxed">{description}</p>
        </div>

        {/* Cronômetro */}
        {countdown && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/8">
            <Clock size={13} className="text-white/40" />
            <span className="text-white/60 text-sm font-mono tabular-nums">{countdown}</span>
            <span className="text-white/30 text-xs">para resetar</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => router.push('/planos')}
          className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#E11D48] text-white font-semibold text-sm hover:bg-[#be123c] transition active:scale-95"
        >
          <Crown size={15} />
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}

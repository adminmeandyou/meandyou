'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dices, Gift, Star, ShoppingBag, ChevronRight, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HubCard {
  href: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  description: string
  badge?: string
  badgeColor?: string
}

const CARDS: HubCard[] = [
  {
    href: '/roleta',
    icon: Dices,
    iconColor: 'var(--accent)',
    iconBg: 'var(--accent-light)',
    title: 'Roleta diária',
    description: 'Gire e ganhe SuperCurtidas, Lupas, Boosts e mais.',
    badge: 'Grátis',
    badgeColor: 'var(--green)',
  },
  {
    href: '/streak',
    icon: Flame,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    title: 'Prêmios diários',
    description: 'Acesse todo dia e acumule recompensas cada vez maiores.',
    badge: 'Streak',
    badgeColor: '#F59E0B',
  },
  {
    href: '/destaque',
    icon: Star,
    iconColor: 'var(--accent)',
    iconBg: 'var(--accent-light)',
    title: 'Perfis em destaque',
    description: 'Veja quem está no topo e use suas Lupas para revelar.',
  },
  {
    href: '/loja',
    icon: ShoppingBag,
    iconColor: 'rgba(248,249,250,0.70)',
    iconBg: 'rgba(255,255,255,0.06)',
    title: 'Loja',
    description: 'Compre SuperCurtidas, Boosts, Lupas e muito mais.',
  },
]

export default function RecompensasPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setChecked(true)
    })
  }, [])

  if (!checked) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text)',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Recompensas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
          Gire, acumule e resgate prêmios todos os dias.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CARDS.map(({ href, icon: Icon, iconColor, iconBg, title, description, badge, badgeColor }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            {/* Icone */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={22} strokeWidth={1.5} color={iconColor} />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}>
                  {title}
                </span>
                {badge && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: badgeColor,
                    background: `${badgeColor}18`,
                    border: `1px solid ${badgeColor}33`,
                    borderRadius: 100,
                    padding: '2px 7px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{
                fontSize: 12,
                color: 'var(--muted)',
                margin: 0,
                lineHeight: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {description}
              </p>
            </div>

            {/* Seta */}
            <ChevronRight size={16} strokeWidth={1.5} color="var(--muted-2)" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Dica */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(225,29,72,0.08) 0%, rgba(225,29,72,0.04) 100%)',
        border: '1px solid rgba(225,29,72,0.20)',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <Gift size={16} strokeWidth={1.5} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.75)', margin: 0, lineHeight: 1.6 }}>
          Indique amigos e ganhe tickets de roleta bonus. Quanto mais amigos, mais premios!
        </p>
      </div>
    </div>
  )
}

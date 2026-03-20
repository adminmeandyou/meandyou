'use client'

import { useRouter } from 'next/navigation'
import { Dices, Gift, Star, ShoppingBag, ChevronRight, Flame } from 'lucide-react'

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
    title: 'Roleta diaria',
    description: 'Gire e ganhe SuperCurtidas, Lupas, Boosts e mais.',
    badge: 'Gratis',
    badgeColor: 'var(--green)',
  },
  {
    href: '/streak',
    icon: Flame,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    title: 'Premios diarios',
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
    description: 'Veja quem esta no topo e use suas Lupas para revelar.',
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
          Gire, acumule e resgate premios todos os dias.
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
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
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
        background: 'var(--accent-light)',
        border: '1px solid var(--accent-border)',
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

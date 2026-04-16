'use client'

import { Award, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { EmblemaDef, DbBadge } from './types'

function EmblemaSvg({ id, desbloqueado }: { id: string; desbloqueado: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/badges/${id}.svg`}
      alt=""
      width={40}
      height={40}
      style={{ display: 'block', opacity: desbloqueado ? 1 : 0.20, filter: desbloqueado ? 'none' : 'grayscale(1)' }}
    />
  )
}

// ─── Conquistas & Legado ─────────────────────────────────────────────────────

interface BadgesSectionProps {
  showConquistas: boolean
  publicStatic: EmblemaDef[]
  publicDb: DbBadge[]
  conquistas: { label: string }[]
  isOwnProfile: boolean
  badgeShowcase: string[]
  onToggleBadge: (id: string) => void
  onSelectBadge: (badge: EmblemaDef) => void
  onViewAll: () => void
}

export function BadgesSection({
  showConquistas, publicStatic, publicDb, conquistas,
  isOwnProfile, badgeShowcase, onToggleBadge, onSelectBadge, onViewAll,
}: BadgesSectionProps) {
  if (!showConquistas) return null

  const hasBadges = publicStatic.length + publicDb.length + conquistas.length > 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(248,249,250,0.30)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={12} strokeWidth={2} />
          Emblemas &amp; Conquistas
        </span>
        <button
          onClick={onViewAll}
          style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', borderRadius: 100, padding: '3px 0', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Ver todos os emblemas
        </button>
      </div>

      {!hasBadges && (
        <div style={{ padding: '20px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-soft, rgba(255,255,255,0.04))', textAlign: 'center' }}>
          <Award size={24} color="rgba(248,249,250,0.20)" strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.40)', margin: '0 0 4px', fontWeight: 500 }}>
            {isOwnProfile ? 'Voce ainda nao tem emblemas' : 'Nenhum emblema ainda'}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.25)', margin: 0 }}>
            {isOwnProfile ? 'Complete acoes para desbloquear emblemas exclusivos' : 'Emblemas aparecem conforme a pessoa usa o app'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', ...(hasBadges ? {} : { display: 'none' }) }}>
        {publicStatic.map(emblema => {
          const active = isOwnProfile && badgeShowcase.includes(emblema.id)
          return (
            <button
              key={emblema.id}
              onClick={() => isOwnProfile ? onToggleBadge(emblema.id) : onSelectBadge(emblema)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', flexShrink: 0 }}
            >
              <div style={{ position: 'relative', width: '68px', height: '68px', borderRadius: '14px', backgroundColor: active ? 'rgba(225,29,72,0.10)' : '#292a2f', border: active ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
                <EmblemaSvg id={emblema.id} desbloqueado={true} />
                {active && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={8} color="#fff" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '68px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {emblema.name}
              </span>
            </button>
          )
        })}
        {publicDb.map(ub => {
          const active = isOwnProfile && badgeShowcase.includes(ub.badge_id)
          return (
            <button
              key={ub.badge_id}
              onClick={() => isOwnProfile ? onToggleBadge(ub.badge_id) : undefined}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: isOwnProfile ? 'pointer' : 'default', padding: '4px 0', flexShrink: 0 }}
            >
              <div style={{ position: 'relative', width: '68px', height: '68px', borderRadius: '14px', backgroundColor: active ? 'rgba(225,29,72,0.10)' : '#292a2f', border: active ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', overflow: 'hidden', transition: 'all 0.25s' }}>
                {ub.badges?.icon_url ? <img src={ub.badges.icon_url} alt={ub.badges.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : ub.badges?.icon}
                {active && <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={8} color="#fff" strokeWidth={2.5} /></div>}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '68px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ub.badges?.name}</span>
            </button>
          )
        })}
        {conquistas.filter(c => !publicStatic.find(e => e.name === c.label)).map((c, i) => (
          <div key={`c-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', flexShrink: 0 }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '14px', backgroundColor: '#292a2f', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="var(--accent)" strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '68px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.label}</span>
          </div>
        ))}
      </div>
      {isOwnProfile && (
        <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)', margin: '12px 0 0', lineHeight: 1.5 }}>
          Toque para escolher quais aparecem no seu perfil
        </p>
      )}
    </div>
  )
}

// ─── Ver todos os emblemas (perfil alheio) ───────────────────────────────────

interface HiddenBadgesProps {
  hasHiddenBadges: boolean
  totalCount: number
  hiddenStatic: EmblemaDef[]
  hiddenDb: DbBadge[]
  allBadgesOpen: boolean
  onToggle: () => void
  onSelectBadge: (badge: EmblemaDef) => void
}

export function HiddenBadgesToggle({
  hasHiddenBadges, totalCount, hiddenStatic, hiddenDb,
  allBadgesOpen, onToggle, onSelectBadge,
}: HiddenBadgesProps) {
  if (!hasHiddenBadges) return null
  return (
    <>
      <button
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'rgba(248,249,250,0.40)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', padding: 0 }}
      >
        {allBadgesOpen ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
        {allBadgesOpen ? 'Ocultar emblemas' : `Ver todos os emblemas (${totalCount})`}
      </button>
      {allBadgesOpen && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {hiddenStatic.map(emblema => (
            <button key={emblema.id} onClick={() => onSelectBadge(emblema)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', flexShrink: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '14px', backgroundColor: '#292a2f', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmblemaSvg id={emblema.id} desbloqueado={true} />
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '68px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{emblema.name}</span>
            </button>
          ))}
          {hiddenDb.map(ub => (
            <div key={ub.badge_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', flexShrink: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '14px', backgroundColor: '#292a2f', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', overflow: 'hidden' }}>
                {ub.badges?.icon_url ? <img src={ub.badges.icon_url} alt={ub.badges.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : ub.badges?.icon}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '68px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ub.badges?.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

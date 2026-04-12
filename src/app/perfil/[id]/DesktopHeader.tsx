'use client'

import { CamaroteBadge, LocationLabel, VerifiedPlusBadge } from './HeroSection'

interface DesktopHeaderProps {
  profileName: string
  age: number | null
  city: string | null
  state: string | null
  distance: number | null
  verifiedPlus: boolean
  viewerIsBlack: boolean
  viewedPlan: string | null
}

export function DesktopHeader({
  profileName, age, city, state, distance,
  verifiedPlus, viewerIsBlack, viewedPlan,
}: DesktopHeaderProps) {
  return (
    <div className="perfil-desktop-header" style={{ alignItems: 'flex-start', gap: '12px', flexDirection: 'column', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: '#fff', fontWeight: 700, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {profileName}{age ? `, ${age}` : ''}
        </h1>
        {viewerIsBlack && viewedPlan === 'black' && <CamaroteBadge />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {(city || distance !== null) && (
          <LocationLabel city={city} state={state} distance={distance} fontSize="12px" />
        )}
        {verifiedPlus && <VerifiedPlusBadge />}
      </div>
    </div>
  )
}

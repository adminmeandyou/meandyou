'use client'

import Image from 'next/image'
import { ArrowLeft, Pencil, ShieldAlert } from 'lucide-react'
import type { StatusPill } from './types'
import { STATUS_TEMP_LABELS } from './types'

interface HeroSectionProps {
  photos: string[]
  activePhoto: number
  setActivePhoto: (i: number) => void
  profileName: string
  age: number | null
  city: string | null
  state: string | null
  distance: number | null
  verified: boolean
  verifiedPlus: boolean
  viewerIsBlack: boolean
  viewedPlan: string | null
  isOwnProfile: boolean
  statusPills: StatusPill[]
  statusTempVivo: boolean
  statusTemp: string | null
  swipeAction: 'like' | 'dislike' | 'superlike' | null
  onBack: () => void
  onEditPhotos: () => void
  onEmergency: () => void
}

export function HeroSection({
  photos, activePhoto, setActivePhoto,
  profileName, age, city, state, distance,
  verified, verifiedPlus, viewerIsBlack, viewedPlan,
  isOwnProfile, statusPills, statusTempVivo, statusTemp,
  swipeAction, onBack, onEditPhotos, onEmergency,
}: HeroSectionProps) {
  return (
    <div className="perfil-hero" style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#000', maxHeight: '70vh', overflow: 'hidden' }}>

      {photos.length > 0 ? (
        <Image
          src={photos[activePhoto]}
          alt={profileName ?? ''}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,249,250,0.15)', fontSize: '64px' }}>?</div>
      )}

      {/* Vinheta dark */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #08090E 0%, rgba(8,9,14,0.65) 35%, transparent 65%)' }} />

      {/* Barra de progresso de fotos */}
      {photos.length > 1 && (
        <div style={{ position: 'absolute', top: '10px', left: '14px', right: '14px', zIndex: 10, display: 'flex', gap: '3px' }}>
          {photos.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              style={{
                flex: 1, height: '2px', borderRadius: '100px', border: 'none', cursor: 'pointer', padding: 0,
                backgroundColor: i === activePhoto ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Botao voltar */}
      <button
        onClick={onBack}
        style={{ position: 'absolute', top: '26px', left: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} color="#fff" strokeWidth={1.5} />
      </button>

      {/* Botao emergencia / editar fotos */}
      {isOwnProfile ? (
        <button
          onClick={onEditPhotos}
          style={{ position: 'absolute', top: '26px', right: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer' }}
          title="Editar fotos"
        >
          <Pencil size={16} color="#fff" strokeWidth={1.5} />
        </button>
      ) : (
        <button
          onClick={onEmergency}
          style={{ position: 'absolute', top: '26px', right: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
          title="Emergência"
        >
          <ShieldAlert size={17} color="rgba(248,249,250,0.75)" strokeWidth={1.5} />
        </button>
      )}

      {/* Toque nas bordas para navegar */}
      {photos.length > 1 && (
        <>
          <button style={{ position: 'absolute', left: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))} />
          <button style={{ position: 'absolute', right: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setActivePhoto(Math.min(photos.length - 1, activePhoto + 1))} />
        </>
      )}

      {/* StatusPills flutuantes */}
      {(statusPills.length > 0 || statusTempVivo) && (
        <div style={{ position: 'absolute', bottom: '120px', left: '16px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {statusPills.map((pill, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: pill.bg, color: pill.color, backdropFilter: 'blur(8px)', border: `1px solid ${pill.color}33`, letterSpacing: '0.01em', fontFamily: 'var(--font-jakarta)' }}>
              {pill.label === 'Online agora' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: pill.color, marginRight: '5px', display: 'inline-block' }} />}
              {pill.label}
            </span>
          ))}
          {statusTempVivo && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(96,165,250,0.18)', color: '#60a5fa', backdropFilter: 'blur(8px)', border: '1px solid rgba(96,165,250,0.30)', letterSpacing: '0.01em', fontFamily: 'var(--font-jakarta)', gap: 4 }}>
              {STATUS_TEMP_LABELS[statusTemp as string] ?? statusTemp}
            </span>
          )}
        </div>
      )}

      {/* Overlay nome (oculto no desktop via CSS) */}
      <div className="perfil-hero-name-overlay" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(36px, 10vw, 52px)', color: '#fff', fontWeight: 700, fontStyle: 'normal', margin: 0, lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            {profileName}{age ? `, ${age}` : ''}
          </h1>
          {viewerIsBlack && viewedPlan === 'black' && (
            <CamaroteBadge />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {(city || distance !== null) && (
            <LocationLabel city={city} state={state} distance={distance} />
          )}
          {verified && <VerifiedBadge />}
          {verifiedPlus && <VerifiedPlusBadge />}
        </div>
      </div>

      {/* Overlay de swipe */}
      {swipeAction && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: swipeAction === 'like' ? 'rgba(16,185,129,0.18)' : swipeAction === 'superlike' ? 'rgba(96,165,250,0.18)' : 'rgba(225,29,72,0.18)' }}>
          <div style={{ border: `4px solid ${swipeAction === 'like' ? '#10b981' : swipeAction === 'superlike' ? '#60a5fa' : '#E11D48'}`, borderRadius: '16px', padding: '12px 24px', transform: 'rotate(-15deg)' }}>
            <span style={{ fontWeight: 900, fontSize: '28px', letterSpacing: '4px', color: swipeAction === 'like' ? '#10b981' : swipeAction === 'superlike' ? '#60a5fa' : '#E11D48', fontFamily: 'var(--font-fraunces)' }}>
              {swipeAction === 'like' ? 'CURTIR' : swipeAction === 'superlike' ? 'SUPER' : 'PASSA'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mini componentes reutilizados no hero e desktop header ──────────────────

import { Crown, MapPin } from 'lucide-react'

export function CamaroteBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(245,158,11,0.40)', backgroundColor: 'rgba(245,158,11,0.10)', color: '#F59E0B', backdropFilter: 'blur(8px)' }}>
      <Crown size={10} strokeWidth={2} /> Camarote
    </span>
  )
}

export function LocationLabel({ city, state, distance, fontSize = '10px' }: { city: string | null; state: string | null; distance: number | null; fontSize?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.55)', fontSize, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
      <MapPin size={fontSize === '10px' ? 9 : 12} strokeWidth={2} />
      {distance !== null ? (distance < 1 ? 'Menos de 1 km' : `${distance.toFixed(1)} km`) : ''}
      {distance !== null && city ? ' · ' : ''}
      {city}{state ? `, ${state}` : ''}
    </span>
  )
}

export function VerifiedBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(225,29,72,0.45)', backgroundColor: 'rgba(225,29,72,0.18)', color: '#F43F5E', backdropFilter: 'blur(8px)' }}>
      Perfil verificado
    </span>
  )
}

export function VerifiedPlusBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(245,158,11,0.45)', backgroundColor: 'rgba(245,158,11,0.14)', color: '#F59E0B', backdropFilter: 'blur(8px)' }}>
      ✦ Verificado Plus
    </span>
  )
}

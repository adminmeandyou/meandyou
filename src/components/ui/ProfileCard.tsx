'use client'

import { useState } from 'react'
import { MapPin, ShieldCheck, Zap } from 'lucide-react'
import { SkeletonLoader } from './SkeletonLoader'

interface ProfileCardProps {
  name: string
  age: number
  location?: string
  photo?: string
  photos?: string[]
  verified?: boolean
  online?: boolean
  tags?: string[]
  loading?: boolean
  disabled?: boolean
  superliked?: boolean
}

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%)',
  'linear-gradient(160deg,#0a1020 0%,#1a2a4a 50%,#0d1830 100%)',
]

export function ProfileCard({
  name,
  age,
  location,
  photo,
  photos = [],
  verified = false,
  online = false,
  tags = [],
  loading = false,
  disabled = false,
  superliked = false,
}: ProfileCardProps) {
  const [imgIndex, setImgIndex] = useState(0)
  const allPhotos = photo ? [photo, ...photos] : photos
  const hasPhotos = allPhotos.length > 0
  const currentPhoto = hasPhotos ? allPhotos[imgIndex] : null
  const placeholderGrad = PLACEHOLDER_GRADIENTS[Math.floor(name.charCodeAt(0) % 2)]

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '3/4',
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <SkeletonLoader variant="card" height="100%" borderRadius={20} />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        background: currentPhoto ? undefined : placeholderGrad,
        boxShadow: superliked
          ? '0 0 0 3px #F59E0B, 0 12px 48px rgba(245,158,11,0.35)'
          : '0 12px 40px rgba(0,0,0,0.55)',
        opacity: disabled ? 0.55 : 1,
        userSelect: 'none',
      }}
    >
      {/* Photo */}
      {currentPhoto && (
        <img
          src={currentPhoto}
          alt={name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          draggable={false}
        />
      )}

      {/* Photo navigation zones (tap left/right) */}
      {allPhotos.length > 1 && (
        <>
          <div
            onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
            style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', zIndex: 2 }}
          />
          <div
            onClick={() => setImgIndex((i) => Math.min(allPhotos.length - 1, i + 1))}
            style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', zIndex: 2 }}
          />
        </>
      )}

      {/* Photo dots */}
      {allPhotos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            zIndex: 3,
          }}
        >
          {allPhotos.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3,
                width: i === imgIndex ? 20 : 8,
                borderRadius: 100,
                backgroundColor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Superlike overlay */}
      {superliked && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 100,
            backgroundColor: 'rgba(245,158,11,0.15)',
            border: '1.5px solid rgba(245,158,11,0.4)',
          }}
        >
          <Zap size={14} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-jakarta)' }}>
            Super
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 18px',
          zIndex: 3,
        }}
      >
        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '3px 9px',
                  borderRadius: 100,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--font-fraunces)',
              lineHeight: 1.1,
            }}
          >
            {name}, {age}
          </span>
          {verified && (
            <ShieldCheck size={18} strokeWidth={1.5} style={{ color: '#60a5fa', flexShrink: 0 }} />
          )}
          {online && (
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '1.5px solid #fff',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* Location */}
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.65)',
                fontFamily: 'var(--font-jakarta)',
              }}
            >
              {location}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

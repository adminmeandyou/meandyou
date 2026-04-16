'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users } from 'lucide-react'
import { Profile } from './helpers'

export function SearchGrid({ deck }: { deck: Profile[] }) {
  if (!deck.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
        <Users size={40} color="rgba(255,255,255,0.20)" strokeWidth={1} />
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)' }}>Nenhum perfil encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Tente aumentar o raio de busca ou ajustar os filtros</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '12px 12px 20px',
        overflowY: 'auto',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        alignContent: 'start',
      }}
    >
      {deck.map((profile) => (
        <Link
          key={profile.id}
          href={`/perfil/${profile.id}`}
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              aspectRatio: '3/4',
              position: 'relative',
            }}
          >
            {profile.photo_best ? (
              <Image
                src={profile.photo_best}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>?</div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.2) 50%, transparent 100%)',
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 8px' }}>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </p>
              {profile.city && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={9} /> {profile.city}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

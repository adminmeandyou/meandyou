'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { useSwipe } from '@/hooks/useSwipe'
import Image from 'next/image'
import { Heart, X, Star, MapPin, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

export default function MatchPage() {
  const { results, loading, search, updateLocation } = useSearch()
  const { currentProfile, hasMore, processing, matchResult, swipe, dismissMatch } = useSwipe(
    results,
    search
  )

  useEffect(() => {
    const init = async () => {
      await updateLocation()
      search()
    }
    init()
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta)' }}>

      {/* Header */}
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', margin: 0 }}>
          MeAnd<span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>You</span>
        </h1>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {results.length > 0 ? `${results.length} pessoas perto` : ''}
        </span>
      </header>

      {/* Area do card */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px 16px' }}>
        {loading ? (
          <LoadingState />
        ) : !hasMore || !currentProfile ? (
          <EmptyState onRefresh={search} />
        ) : (
          <>
            <SwipeCard
              profile={currentProfile}
              onSwipe={swipe}
              processing={processing}
            />
            <ActionButtons onSwipe={swipe} processing={processing} />
          </>
        )}
      </main>

      {/* Modal de match */}
      {matchResult?.isMatch && (
        <MatchModal
          profile={matchResult.matchedProfile!}
          matchId={matchResult.matchId!}
          onDismiss={dismissMatch}
        />
      )}
    </div>
  )
}

// ─── Card com swipe ─────────────────────────────────────────────────────────

function SwipeCard({ profile, onSwipe, processing }: {
  profile: any
  onSwipe: (action: any) => void
  processing: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [showBio, setShowBio] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return
    currentX.current = e.touches[0].clientX
    const offset = currentX.current - startX.current
    setDragOffset(offset)
  }

  function onTouchEnd() {
    isDragging.current = false
    const threshold = 100
    if (dragOffset > threshold) onSwipe('like')
    else if (dragOffset < -threshold) onSwipe('dislike')
    setDragOffset(0)
  }

  function onMouseDown(e: React.MouseEvent) {
    startX.current = e.clientX
    isDragging.current = true
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    currentX.current = e.clientX
    setDragOffset(currentX.current - startX.current)
  }

  function onMouseUp() {
    isDragging.current = false
    const threshold = 100
    if (dragOffset > threshold) onSwipe('like')
    else if (dragOffset < -threshold) onSwipe('dislike')
    setDragOffset(0)
  }

  const rotation = dragOffset * 0.08
  const likeOpacity = Math.min(dragOffset / 80, 1)
  const dislikeOpacity = Math.min(-dragOffset / 80, 1)

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative', width: '100%', maxWidth: '384px', userSelect: 'none', cursor: 'grab',
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Card */}
      <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#1a1528', aspectRatio: '3/4', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Foto */}
        {profile.photo_best ? (
          <Image
            src={profile.photo_best}
            alt={profile.name}
            fill
            style={{ objectFit: 'cover', pointerEvents: 'none' }}
            draggable={false}
            sizes="400px"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(225,29,72,0.10), transparent)' }} />
        )}

        {/* Gradiente */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />

        {/* Indicador CURTIR */}
        <div style={{
          position: 'absolute', top: '32px', left: '24px',
          border: '4px solid var(--accent)', borderRadius: '12px', padding: '6px 16px',
          transform: 'rotate(-20deg)', opacity: Math.max(likeOpacity, 0),
        }}>
          <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '24px', letterSpacing: '0.1em' }}>CURTIR</span>
        </div>

        {/* Indicador NOPE */}
        <div style={{
          position: 'absolute', top: '32px', right: '24px',
          border: '4px solid #f87171', borderRadius: '12px', padding: '6px 16px',
          transform: 'rotate(20deg)', opacity: Math.max(dislikeOpacity, 0),
        }}>
          <span style={{ color: '#f87171', fontWeight: 900, fontSize: '24px', letterSpacing: '0.1em' }}>NOPE</span>
        </div>

        {/* Info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {profile.name}, {profile.age}
              </h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.60)', fontSize: '14px', margin: '4px 0 0' }}>
                <MapPin size={12} strokeWidth={1.5} />
                {profile.city} · {profile.distance_km < 1 ? 'menos de 1 km' : `${profile.distance_km} km`}
              </p>
            </div>
            <button
              onClick={() => setShowBio(!showBio)}
              style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}
            >
              {showBio ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronUp size={16} strokeWidth={1.5} />}
            </button>
          </div>

          {showBio && profile.bio && (
            <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.70)', fontSize: '14px', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '12px' }}>
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Botoes de acao ──────────────────────────────────────────────────────────

function ActionButtons({ onSwipe, processing }: {
  onSwipe: (action: any) => void
  processing: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '24px' }}>
      {/* Dislike */}
      <button
        onClick={() => onSwipe('dislike')}
        disabled={processing}
        style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', color: '#f87171' }}
      >
        <X size={26} strokeWidth={2} />
      </button>

      {/* SuperLike */}
      <button
        onClick={() => onSwipe('superlike')}
        disabled={processing}
        style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', color: '#60a5fa' }}
      >
        <Star size={20} strokeWidth={1.5} />
      </button>

      {/* Like */}
      <button
        onClick={() => onSwipe('like')}
        disabled={processing}
        style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', color: 'var(--accent)' }}
      >
        <Heart size={26} strokeWidth={1.5} fill="var(--accent)" />
      </button>
    </div>
  )
}

// ─── Modal de match ──────────────────────────────────────────────────────────

function MatchModal({ profile, matchId, onDismiss }: {
  profile: any
  matchId: string
  onDismiss: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', padding: '24px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--accent-border)', padding: '32px 24px', textAlign: 'center', maxWidth: '360px', width: '100%' }}>

        {/* Foto */}
        <div style={{ position: 'relative', width: '112px', height: '112px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '4px solid var(--accent)' }}>
          {profile.photo_best ? (
            <Image src={profile.photo_best} alt={profile.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-light)' }} />
          )}
        </div>

        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: 'var(--text)', margin: '0 0 6px' }}>
          É um <em style={{ color: 'var(--accent)' }}>match!</em>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 28px' }}>
          Você e {profile.name} curtiram um ao outro
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href={`/conversas/${matchId}`}
            style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', transition: 'opacity 0.2s' }}
          >
            Enviar mensagem
          </a>
          <button
            onClick={onDismiss}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--muted)', backgroundColor: 'transparent', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'color 0.2s' }}
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estados auxiliares ──────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--muted)' }}>
      <div style={{ width: '40px', height: '40px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '14px' }}>Buscando pessoas perto...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '0 32px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} color="var(--accent)" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', margin: 0 }}>Por enquanto é só</h3>
      <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
        Não há mais perfis na sua região. Tente aumentar o raio de busca ou volte mais tarde.
      </p>
      <button
        onClick={onRefresh}
        style={{ padding: '12px 24px', borderRadius: '16px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.2s' }}
      >
        Atualizar perfis
      </button>
    </div>
  )
}

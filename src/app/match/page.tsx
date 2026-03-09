'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { useSwipe } from '@/hooks/useSwipe'
import Image from 'next/image'
import { Heart, X, Star, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Página principal ─────────────────────────────────────────────────────────

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
    <div className="min-h-screen bg-[#0e0b14] flex flex-col font-jakarta">

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <h1 className="font-fraunces text-2xl text-white">
          <span className="italic text-[#b8f542]">Me</span>AndYou
        </h1>
        <span className="text-white/30 text-xs">
          {results.length > 0 ? `${results.length} pessoas perto` : ''}
        </span>
      </header>

      {/* Área do card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
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

// ─── Card com swipe ───────────────────────────────────────────────────────────

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

  // Touch handlers
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

    if (dragOffset > threshold) {
      onSwipe('like')
    } else if (dragOffset < -threshold) {
      onSwipe('dislike')
    }

    setDragOffset(0)
  }

  // Mouse handlers (desktop)
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
      className="relative w-full max-w-sm select-none cursor-grab active:cursor-grabbing"
      style={{
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
      <div className="relative rounded-3xl overflow-hidden bg-[#1a1528] aspect-[3/4] shadow-2xl">

        {/* Foto */}
        {profile.photo_best ? (
          <Image
            src={profile.photo_best}
            alt={profile.name}
            fill
            className="object-cover pointer-events-none"
            draggable={false}
            sizes="400px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#b8f542]/10 to-transparent" />
        )}

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {/* Indicador LIKE */}
        <div
          className="absolute top-8 left-6 border-4 border-[#b8f542] rounded-xl px-4 py-2 rotate-[-20deg]"
          style={{ opacity: Math.max(likeOpacity, 0) }}
        >
          <span className="text-[#b8f542] font-black text-2xl tracking-widest">CURTIR</span>
        </div>

        {/* Indicador NOPE */}
        <div
          className="absolute top-8 right-6 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[20deg]"
          style={{ opacity: Math.max(dislikeOpacity, 0) }}
        >
          <span className="text-red-500 font-black text-2xl tracking-widest">NOPE</span>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-fraunces text-2xl font-bold text-white">
                {profile.name}, {profile.age}
              </h2>
              <p className="flex items-center gap-1 text-white/60 text-sm mt-1">
                <MapPin size={12} />
                {profile.city} · {profile.distance_km < 1 ? 'menos de 1 km' : `${profile.distance_km} km`}
              </p>
            </div>
            <button
              onClick={() => setShowBio(!showBio)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              {showBio ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {/* Bio expansível */}
          {showBio && profile.bio && (
            <p className="mt-3 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-3">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Botões de ação ───────────────────────────────────────────────────────────

function ActionButtons({ onSwipe, processing }: {
  onSwipe: (action: any) => void
  processing: boolean
}) {
  return (
    <div className="flex items-center gap-5 mt-6">
      {/* Dislike */}
      <button
        onClick={() => onSwipe('dislike')}
        disabled={processing}
        className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition active:scale-90"
      >
        <X size={26} className="text-red-400" />
      </button>

      {/* SuperLike */}
      <button
        onClick={() => onSwipe('superlike')}
        disabled={processing}
        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/40 transition active:scale-90"
      >
        <Star size={20} className="text-blue-400" />
      </button>

      {/* Like */}
      <button
        onClick={() => onSwipe('like')}
        disabled={processing}
        className="w-16 h-16 rounded-full bg-[#b8f542]/10 border border-[#b8f542]/30 flex items-center justify-center hover:bg-[#b8f542]/20 transition active:scale-90"
      >
        <Heart size={26} className="text-[#b8f542]" fill="#b8f542" />
      </button>
    </div>
  )
}

// ─── Modal de match ───────────────────────────────────────────────────────────

function MatchModal({ profile, matchId, onDismiss }: {
  profile: any
  matchId: string
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="bg-[#141020] rounded-3xl border border-[#b8f542]/20 p-8 text-center max-w-sm w-full">

        {/* Foto */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden mx-auto mb-5 border-4 border-[#b8f542]">
          {profile.photo_best ? (
            <Image src={profile.photo_best} alt={profile.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#b8f542]/10" />
          )}
        </div>

        <h2 className="font-fraunces text-3xl text-white mb-1">
          É um <span className="italic text-[#b8f542]">match!</span>
        </h2>
        <p className="text-white/50 text-sm mb-7">
          Você e {profile.name} curtiram um ao outro
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={`/chat/${matchId}`}
            className="w-full py-3.5 rounded-2xl bg-[#b8f542] text-black font-semibold text-sm hover:bg-[#a8e030] transition"
          >
            Enviar mensagem
          </a>
          <button
            onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl border border-white/10 text-white/60 text-sm hover:text-white transition"
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estados auxiliares ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 text-white/30">
      <div className="w-10 h-10 border-2 border-white/10 border-t-[#b8f542] rounded-full animate-spin" />
      <span className="text-sm">Buscando pessoas perto…</span>
    </div>
  )
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center px-8">
      <div className="text-5xl">🌎</div>
      <h3 className="font-fraunces text-xl text-white">Por enquanto é só</h3>
      <p className="text-white/40 text-sm">
        Não há mais perfis na sua região. Tente aumentar o raio de busca ou volte mais tarde.
      </p>
      <button
        onClick={onRefresh}
        className="mt-2 px-6 py-3 rounded-2xl bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] text-sm hover:bg-[#b8f542]/20 transition"
      >
        Tentar novamente
      </button>
    </div>
  )
}
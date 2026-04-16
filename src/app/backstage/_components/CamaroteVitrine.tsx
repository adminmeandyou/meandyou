'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import {
  ArrowLeft, Crown, X, Heart, MapPin, Users,
  SlidersHorizontal, Loader2,
} from 'lucide-react'
import {
  type Profile, type Filters, type MainTab,
  CATEGORIAS, DEFAULT_FILTERS, ESTADOS,
  G, G_SOFT, G_BORDER, G_BORDER2, BG, BG_CARD,
} from './helpers'
import ResgatesSection from './ResgatesSection'

interface Props {
  myCategories: string[]
  onChangeCategories: () => void
  onBack: () => void
}

export default function CamaroteVitrine({ myCategories, onChangeCategories, onBack }: Props) {
  const { user } = useAuth()
  const [mainTab, setMainTab] = useState<MainTab>('vitrine')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [localFilters, setLocalFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set())

  // Drag/swipe state
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [isSnapping, setIsSnapping] = useState(false)

  const load = useCallback(async () => {
    if (!user || myCategories.length === 0) return
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('id, name, age, city, state, photo_body, photo_best, camarote_interests')
      .eq('plan', 'black')
      .neq('id', user.id)
      .overlaps('camarote_interests', myCategories)

    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.state) query = query.eq('state', filters.state)
    if (filters.ageMin > 18 || filters.ageMax < 60) query = query.gte('age', filters.ageMin).lte('age', filters.ageMax)

    const { data } = await query.limit(50)
    setProfiles(data ?? [])
    setLikedIds(new Set())
    setPassedIds(new Set())
    setLoading(false)
  }, [user?.id, filters, myCategories])

  useEffect(() => { load() }, [load])

  const deck = profiles.filter(p => !likedIds.has(p.id) && !passedIds.has(p.id))
  const currentProfile = deck[0] ?? null

  async function handleLike() {
    if (!user || !currentProfile) return
    setLikedIds(prev => new Set(prev).add(currentProfile.id))
    await supabase.rpc('process_like', {
      p_user_id: user.id,
      p_target_id: currentProfile.id,
      p_is_superlike: false,
    })
  }

  function handlePass() {
    if (!currentProfile) return
    setPassedIds(prev => new Set(prev).add(currentProfile.id))
  }

  function triggerSwipe(dir: 'left' | 'right') {
    setSwipeDir(dir)
    setDragX(0)
    setDragY(0)
    setIsSnapping(true)
    setTimeout(() => {
      if (dir === 'right') handleLike()
      else handlePass()
      setSwipeDir(null)
      setIsSnapping(false)
    }, 350)
  }

  function onDragStart(clientX: number, clientY: number) {
    if (swipeDir) return
    setIsDragging(true)
    startX.current = clientX
    startY.current = clientY
    setDragX(0)
    setDragY(0)
  }

  function onDragMove(clientX: number, clientY: number) {
    if (!isDragging) return
    setDragX(clientX - startX.current)
    setDragY(clientY - startY.current)
  }

  function onDragEnd(endClientX?: number) {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 80
    const finalX = endClientX !== undefined ? endClientX - startX.current : dragX
    if (finalX > threshold) triggerSwipe('right')
    else if (finalX < -threshold) triggerSwipe('left')
    else { setDragX(0); setDragY(0) }
  }

  function applyFilters() {
    setFilters(localFilters)
    setShowFilters(false)
  }

  const hasActiveFilters = filters.city || filters.state || filters.ageMin > 18 || filters.ageMax < 60

  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : 700) : 0
  const cardY = isDragging ? dragY * 0.3 : 0
  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const likeOpacity = isDragging ? Math.min(1, (dragX - 20) / 80) : 0
  const passOpacity = isDragging ? Math.min(1, (-dragX - 20) / 80) : 0
  const photo = currentProfile?.photo_body ?? currentProfile?.photo_best

  return (
    <div style={{ height: '100vh', background: BG, fontFamily: 'var(--font-jakarta)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER2}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={16} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', flex: 1 }}>Camarote</span>
        <button
          onClick={onChangeCategories}
          style={{ padding: '6px 12px', borderRadius: 100, border: `1px solid ${G_BORDER}`, background: G_SOFT, color: G, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', flexShrink: 0 }}
        >
          Interesses
        </button>
        <button
          onClick={() => { setLocalFilters(filters); setShowFilters(true) }}
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            border: `1px solid ${hasActiveFilters ? G_BORDER : 'rgba(255,255,255,0.08)'}`,
            background: hasActiveFilters ? G_SOFT : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={16} color={hasActiveFilters ? G : 'rgba(255,255,255,0.5)'} strokeWidth={1.5} />
        </button>
      </header>

      {/* Tabs principais: Vitrine | Resgates */}
      <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.05)`, flexShrink: 0 }}>
        {(['vitrine', 'resgates'] as MainTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            style={{
              flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-jakarta)', cursor: 'pointer', border: 'none',
              background: 'transparent', textTransform: 'capitalize',
              color: mainTab === tab ? G : 'rgba(255,255,255,0.30)',
              borderBottom: `2px solid ${mainTab === tab ? G : 'transparent'}`,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {tab === 'vitrine' ? 'Explorar' : 'Resgates'}
          </button>
        ))}
      </div>

      {mainTab === 'vitrine' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} style={{ color: G, animation: 'ui-spin 1s linear infinite' }} />
            </div>
          ) : !currentProfile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color={G} strokeWidth={1.5} />
              </div>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', margin: '0 0 4px' }}>Ninguém mais por aqui</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {hasActiveFilters ? 'Tente ajustar os filtros.' : 'Você já viu todos os perfis disponíveis.'}
              </p>
              <button onClick={load} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${G_BORDER}`, background: G_SOFT, color: G, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
                Recarregar
              </button>
            </div>
          ) : (
            <>
              {/* Card area */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px 0', position: 'relative', overflow: 'hidden' }}>
                {/* Proximo card (fundo) */}
                {deck[1] && (
                  <div style={{
                    position: 'absolute', width: '100%', maxWidth: 380,
                    borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4',
                    background: BG_CARD, border: `1px solid ${G_BORDER2}`,
                    transform: 'scale(0.94)', opacity: 0.55, pointerEvents: 'none',
                  }}>
                    {(deck[1].photo_body ?? deck[1].photo_best) && (
                      <Image src={(deck[1].photo_body ?? deck[1].photo_best)!} alt="" fill style={{ objectFit: 'cover' }} sizes="380px" />
                    )}
                  </div>
                )}

                {/* Card atual */}
                <div
                  style={{
                    position: 'relative', width: '100%', maxWidth: 380,
                    borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4',
                    background: BG_CARD, border: `1px solid ${G_BORDER2}`,
                    transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotation}deg)`,
                    transition: isDragging ? 'none' : isSnapping ? 'transform 0.35s ease' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none', touchAction: 'none',
                  }}
                  onMouseDown={e => onDragStart(e.clientX, e.clientY)}
                  onMouseMove={e => onDragMove(e.clientX, e.clientY)}
                  onMouseUp={e => onDragEnd(e.clientX)}
                  onMouseLeave={() => onDragEnd()}
                  onTouchStart={e => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY) }}
                  onTouchMove={e => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY) }}
                  onTouchEnd={e => { e.preventDefault(); onDragEnd(e.changedTouches[0]?.clientX) }}
                >
                  {photo ? (
                    <Image src={photo} alt={currentProfile.name} fill style={{ objectFit: 'cover', pointerEvents: 'none' }} sizes="380px" />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a0d08 0%, #2a1505 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={48} color={G_BORDER} strokeWidth={1} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.20) 55%, transparent 100%)', pointerEvents: 'none' }} />

                  {/* CURTIR indicator */}
                  <div style={{ position: 'absolute', top: 20, left: 16, padding: '5px 12px', borderRadius: 8, border: '3px solid #10b981', transform: 'rotate(-15deg)', opacity: likeOpacity, pointerEvents: 'none' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#10b981', letterSpacing: 1 }}>CURTIR</span>
                  </div>

                  {/* PASSAR indicator */}
                  <div style={{ position: 'absolute', top: 20, right: 16, padding: '5px 12px', borderRadius: 8, border: `3px solid ${G}`, transform: 'rotate(15deg)', opacity: passOpacity, pointerEvents: 'none' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: G, letterSpacing: 1 }}>PASSAR</span>
                  </div>

                  {/* Info do perfil */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 16px 12px', pointerEvents: 'none' }}>
                    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#fff', fontWeight: 700, margin: '0 0 4px' }}>
                      {currentProfile.name}{currentProfile.age ? `, ${currentProfile.age}` : ''}
                    </p>
                    {(currentProfile.city || currentProfile.state) && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} strokeWidth={1.5} />
                        {[currentProfile.city, currentProfile.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {Array.isArray(currentProfile.camarote_interests) && currentProfile.camarote_interests.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(currentProfile.camarote_interests as string[]).slice(0, 3).map((cat: string) => {
                          const found = CATEGORIAS.find(c => c.key === cat)
                          return found ? (
                            <span key={cat} style={{ padding: '3px 10px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}`, fontSize: 11, color: G, fontWeight: 600 }}>
                              {found.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botoes de acao */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '16px 0 20px', flexShrink: 0 }}>
                <button
                  onClick={() => triggerSwipe('left')}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${G_BORDER}`, background: G_SOFT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={24} color={G} strokeWidth={2} />
                </button>
                <button
                  onClick={() => triggerSwipe('right')}
                  style={{
                    width: 66, height: 66, borderRadius: '50%',
                    border: 'none', background: `linear-gradient(135deg, #c9a84c, ${G})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: `0 6px 24px rgba(245,158,11,0.30)`,
                  }}
                >
                  <Heart size={28} color="#fff" strokeWidth={2} fill="#fff" />
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', marginBottom: 8, flexShrink: 0 }}>
                {deck.length} {deck.length !== 1 ? 'perfis' : 'perfil'} disponível
              </p>
            </>
          )}
        </div>
      ) : (
        <ResgatesSection />
      )}

      {/* Bottom sheet de filtros */}
      {showFilters && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowFilters(false) }}
        >
          <div style={{ width: '100%', maxWidth: 480, background: BG_CARD, borderRadius: '24px 24px 0 0', borderTop: `1px solid ${G_BORDER2}`, padding: '20px 24px 40px', animation: 'ui-slide-up 0.25s ease' }}>
            <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff', margin: 0 }}>Filtros</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="rgba(255,255,255,0.40)" />
              </button>
            </div>

            {/* Cidade */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={localFilters.city}
                onChange={e => setLocalFilters(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Estado */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Estado</label>
              <select
                value={localFilters.state}
                onChange={e => setLocalFilters(f => ({ ...f, state: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: BG_CARD, border: '1px solid rgba(255,255,255,0.08)', color: localFilters.state ? '#fff' : 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)', fontSize: 14, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Todos os estados</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            {/* Faixa etaria */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Idade: {localFilters.ageMin} a {localFilters.ageMax} anos
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <input type="range" min={18} max={localFilters.ageMax} value={localFilters.ageMin}
                    onChange={e => setLocalFilters(f => ({ ...f, ageMin: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: G }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
                    <span>Min: {localFilters.ageMin}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="range" min={localFilters.ageMin} max={75} value={localFilters.ageMax}
                    onChange={e => setLocalFilters(f => ({ ...f, ageMax: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: G }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
                    <span>Max: {localFilters.ageMax}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setLocalFilters(DEFAULT_FILTERS) }}
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'transparent', color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Limpar
              </button>
              <button
                onClick={applyFilters}
                style={{ flex: 2, padding: '13px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, #c9a84c, ${G})`, color: '#fff', fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

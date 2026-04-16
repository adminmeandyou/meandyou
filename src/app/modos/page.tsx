'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { PaywallCard } from '@/components/PaywallCard'
import {
  SlidersHorizontal, X, Heart, Star, Search, AlertCircle,
  Loader2, Lock, Check, MapPin, RotateCcw, Zap, Undo2,
  ChevronDown, ChevronUp, Users, Info, Crown, Compass,
} from 'lucide-react'
import { SkeletonCard, skeletonCss } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { useSounds } from '@/hooks/useSounds'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Pill } from '@/components/ui/Pill'
import { SliderRange } from '@/components/ui/SliderRange'
import { SwipeButton } from '@/components/ui/SwipeButton'
import { useAppHeader } from '@/contexts/AppHeaderContext'

import {
  Profile, FiltersState, ViewMode,
  DEFAULT_FILTERS, GENDER_OPTIONS, STATE_NAMES, FILTER_CATEGORIES,
  getModeLimit, getSuperlikeLimit, useCountdown, requestLocation, applyCompatFilters,
} from './_components/helpers'
import { LocationAutocomplete } from './_components/LocationAutocomplete'
import { BoostActiveBanner } from './_components/BoostActiveBanner'
import { ModeSelectorTabs } from './_components/ModeSelectorTabs'
import { DailyMatchView } from './_components/DailyMatchView'
import { ModesHubView } from './_components/ModesHubView'
import { CamaroteModal } from './_components/CamaroteModal'
import { RoomsView } from './_components/RoomsView'
import { SearchGrid } from './_components/SearchGrid'

// ─── Página principal ─────────────────────────────────────────────────────────

function BuscaInner() {
  const router = useRouter()
  // ── State (preservado da versão anterior) ─────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState('essencial')
  const [filtersConfigured, setFiltersConfigured] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [requiredError, setRequiredError] = useState<string | null>(null)
  const [deck, setDeck] = useState<Profile[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loadingDeck, setLoadingDeck] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modeLikesUsed, setModeLikesUsed] = useState<Record<string, number>>({})
  const [superlikesUsed, setSuperlikesUsed] = useState(0)
  const [superlikesAvulso, setSuperlikesAvulso] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'superlike' | 'fetiche'>('superlike')
  const [matchResult, setMatchResult] = useState<{ name: string; photo?: string; otherUserId?: string; matchId?: string } | null>(null)
  const [matchFriendSent, setMatchFriendSent] = useState(false)
  const [lastSwipe, setLastSwipe] = useState<{ dir: 'left' | 'right' | 'up'; profileId: string } | null>(null)

  // ── Profile detail sheet (swipe down) ───────────────────────────────────
  const [showProfileSheet, setShowProfileSheet] = useState(false)

  // ── Boost ────────────────────────────────────────────────────────────────
  const [boostUntil, setBoostUntil] = useState<Date | null>(null)
  const [boostAmount, setBoostAmount] = useState(0)

  // ── Novos states (Fase 4) ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('discovery')
  const [showHub, setShowHub] = useState(true)
  const [camaroteModal, setCamaroteModal] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [userGender, setUserGender] = useState<string>('')
  const [locationDisplay, setLocationDisplay] = useState<string>('')

  // ── Refs ──────────────────────────────────────────────────────────────────
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const hasDragged = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const countdown = useCountdown()
  const likeLimit = getModeLimit(userPlan, viewMode)
  const superlikeLimit = getSuperlikeLimit(userPlan) + superlikesAvulso
  const currentProfile = deck[currentIdx] ?? null
  const toast = useToast()
  const haptics = useHaptics()
  const { play } = useSounds()
  const searchParams = useSearchParams()

  // Abre filtros automaticamente se vier de /configuracoes com ?filtros=1
  useEffect(() => {
    if (searchParams.get('filtros') === '1') {
      setShowFilters(true)
      setShowHub(false)
    }
  }, [searchParams])

  // ── Injeção do modeSelector, leftAction e rightActions no AppHeader ──────────────────
  const { setModeSelector, setRightActions, setLeftAction } = useAppHeader()

  const openFiltersStable = useCallback(() => openFilters(), [localFilters, filtersConfigured])

  useEffect(() => {
    if (showHub) {
      setModeSelector(null)
      setRightActions(null)
      setLeftAction(null)
      return
    }
    setLeftAction(
      <button
        onClick={() => { setShowHub(true) }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Voltar para Modos"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(248,249,250,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
    )
    setModeSelector(
      <ModeSelectorTabs
        viewMode={viewMode}
        onChange={(m) => { setViewMode(m); setShowHub(false) }}
      />
    )
    setRightActions(
      <>
        <Link
          href="/conversas"
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', textDecoration: 'none',
          }}
          aria-label="Conversas"
        >
          <Search size={19} strokeWidth={1.5} style={{ display: 'none' }} />
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>
        <button
          onClick={openFiltersStable}
          title="Filtros"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: 'none', backgroundColor: 'transparent', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={18} strokeWidth={1.5} />
        </button>
      </>
    )
  }, [viewMode, showHub, setModeSelector, setRightActions, openFiltersStable])

  useEffect(() => {
    return () => { setModeSelector(null); setRightActions(null); setLeftAction(null) }
  }, [setModeSelector, setRightActions, setLeftAction])

  // Reset photoIdx quando o card muda
  useEffect(() => { setPhotoIdx(0) }, [currentIdx])

  // Recarrega deck ao trocar entre discovery e search
  useEffect(() => {
    if (!filtersConfigured || !userId) return
    if (viewMode === 'discovery') {
      loadDeck(DEFAULT_FILTERS, userId, false)
    } else if (viewMode === 'search') {
      loadDeck(localFilters, userId, true)
    }
  }, [viewMode])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const [profileRes, filtersRes] = await Promise.all([
        supabase.from('profiles').select('plan, gender').eq('id', user.id).single(),
        supabase.from('filters').select('*').eq('user_id', user.id).single(),
      ])
      const plan = profileRes.data?.plan ?? 'essencial'
      setUserPlan(plan)
      setUserGender(profileRes.data?.gender ?? '')

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const [todayLikesRes, avulsoRes, boostRes, modeLikesRes] = await Promise.all([
        supabase.from('likes').select('is_superlike').eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
        supabase.from('user_superlikes').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user.id).maybeSingle(),
        supabase.from('mode_likes').select('mode').eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
      ])
      if (boostRes.data?.active_until && new Date(boostRes.data.active_until) > new Date()) {
        setBoostUntil(new Date(boostRes.data.active_until))
      }
      setBoostAmount(boostRes.data?.amount ?? 0)
      if (todayLikesRes.data) {
        setSuperlikesUsed(todayLikesRes.data.filter(l => l.is_superlike).length)
      }
      setSuperlikesAvulso(avulsoRes.data?.amount ?? 0)
      const modeUsage: Record<string, number> = {}
      for (const r of modeLikesRes.data ?? []) {
        modeUsage[r.mode] = (modeUsage[r.mode] || 0) + 1
      }
      setModeLikesUsed(modeUsage)

      if (filtersRes.data?.search_saved) {
        let localBackup: Partial<FiltersState> = {}
        try {
          const saved = localStorage.getItem(`filters_${user.id}`)
          if (saved) localBackup = JSON.parse(saved)
        } catch {}
        const merged = { ...DEFAULT_FILTERS, ...filtersRes.data, ...localBackup }
        setLocalFilters(merged)
        setFiltersConfigured(true)
        const stateCode = (merged.search_state as string) || ''
        if (stateCode && STATE_NAMES[stateCode]) setLocationDisplay(`${STATE_NAMES[stateCode]} - ${stateCode}`)
        await loadDeck(merged, user.id)
      } else {
        let localBackup: Partial<FiltersState> = {}
        try {
          const saved = localStorage.getItem(`filters_${user.id}`)
          if (saved) localBackup = JSON.parse(saved)
        } catch {}
        if (filtersRes.data || Object.keys(localBackup).length > 0) {
          const merged = { ...DEFAULT_FILTERS, ...filtersRes.data, ...localBackup }
          setLocalFilters(merged)
          if (Object.keys(localBackup).length > 0) {
            setFiltersConfigured(true)
            await loadDeck(merged, user.id)
            return
          }
        }
        setOpenCategories({ objetivos: true })
        setShowFilters(true)
        setLoadingDeck(false)
      }
    } catch { setError('Erro ao carregar.'); setLoadingDeck(false) }
  }

  async function loadDeck(filters: FiltersState, uid?: string, searchMode = false) {
    setLoadingDeck(true)
    try {
      const id = uid ?? userId
      const loc = await requestLocation()
      if (loc && id) {
        await supabase.from('profiles').update({ lat: loc.lat, lng: loc.lng }).eq('id', id)
      }
      const genderParam = filters.search_gender && filters.search_gender !== 'all' ? filters.search_gender : null
      const { data } = await supabase.rpc('search_profiles', {
        p_user_id:         id,
        p_lat:             loc?.lat ?? null,
        p_lng:             loc?.lng ?? null,
        p_max_distance_km: (filters.search_max_distance_km as number) >= 500 ? 9999 : filters.search_max_distance_km,
        p_min_age:         filters.search_min_age,
        p_max_age:         filters.search_max_age >= 60 ? 120 : filters.search_max_age,
        p_gender:          genderParam,
      })
      let profiles = (data ?? []) as Profile[]

      // Filtra perfis em modo fantasma
      if (profiles.length > 0) {
        const ids = profiles.map(p => p.id)
        const now = new Date().toISOString()
        const { data: ghostData } = await supabase
          .from('profiles')
          .select('id')
          .in('id', ids)
          .gt('ghost_mode_until', now)
        const ghostIds = new Set((ghostData ?? []).map((g: { id: string }) => g.id))
        profiles = profiles.filter(p => !ghostIds.has(p.id))
      }

      // A4 — Perfis com boost ativo sobem para o topo
      if (profiles.length > 0) {
        const ids = profiles.map(p => p.id)
        const { data: boostData } = await supabase
          .from('user_boosts')
          .select('user_id, active_until')
          .in('user_id', ids)
          .gt('active_until', new Date().toISOString())
        if (boostData && boostData.length > 0) {
          const boostMap = new Map(boostData.map((b: { user_id: string; active_until: string }) => [b.user_id, b.active_until]))
          const boosted = profiles.filter(p => boostMap.has(p.id)).sort((a, b) =>
            new Date(boostMap.get(b.id)!).getTime() - new Date(boostMap.get(a.id)!).getTime()
          )
          const notBoosted = profiles.filter(p => !boostMap.has(p.id))
          profiles = [...boosted, ...notBoosted]
        }
      }

      // Filtro de gênero client-side (fallback)
      if (genderParam) {
        profiles = profiles.filter(p => p.gender === genderParam)
      }

      // Modo Busca: aplica filtros de compatibilidade client-side
      if (searchMode && profiles.length) {
        const profileIds = profiles.map(p => p.id)
        const { data: filtersData } = await supabase
          .from('filters')
          .select('*')
          .in('user_id', profileIds)
        if (filtersData?.length) {
          const profileFiltersMap = Object.fromEntries(
            filtersData.map(f => [f.user_id, f as Record<string, unknown>])
          )
          profiles = applyCompatFilters(profiles, filters, profileFiltersMap)
        }
      }

      setDeck(profiles)
      setCurrentIdx(0)
    } catch { setError('Não foi possível carregar perfis.') }
    finally { setLoadingDeck(false) }
  }

  // ── Drag / Swipe handlers ─────────────────────────────────────────────────

  function onDragStart(clientX: number, clientY: number) {
    dragStartX.current = clientX
    dragStartY.current = clientY
    hasDragged.current = false
    setIsDragging(true)
  }

  function onDragMove(clientX: number, clientY: number) {
    if (!isDragging) return
    const dx = clientX - dragStartX.current
    const dy = clientY - dragStartY.current
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) hasDragged.current = true
    setDragX(dx)
    setDragY(dy)
  }

  function handlePhotoTap(clientX: number) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const photos = currentProfile?.photos?.length
      ? currentProfile.photos
      : currentProfile?.photo_best ? [currentProfile.photo_best] : []
    if (photos.length <= 1) return
    const midX = rect.left + rect.width / 2
    if (clientX < midX) setPhotoIdx(i => Math.max(0, i - 1))
    else setPhotoIdx(i => Math.min(photos.length - 1, i + 1))
  }

  function onDragEnd(endClientX?: number) {
    if (!isDragging) return
    setIsDragging(false)
    if (!hasDragged.current && endClientX !== undefined) {
      handlePhotoTap(endClientX)
      setDragX(0); setDragY(0)
      return
    }
    const threshold = 100
    if (dragX > threshold) triggerSwipe('right')
    else if (dragX < -threshold) triggerSwipe('left')
    else if (dragY < -threshold) triggerSwipe('up')
    else if (dragY > threshold) {
      setShowProfileSheet(true)
      setDragX(0); setDragY(0)
    } else {
      setIsSnapping(true)
      setDragX(0); setDragY(0)
      setTimeout(() => setIsSnapping(false), 600)
    }
  }

  async function triggerSwipe(dir: 'left' | 'right' | 'up') {
    if (!currentProfile || !userId) return
    if (dir === 'right' && (modeLikesUsed[viewMode] ?? 0) >= likeLimit) {
      setDragX(0); setDragY(0); setLimitReached(true); return
    }
    if (dir === 'up' && superlikesUsed >= superlikeLimit) {
      setDragX(0); setDragY(0); setUpgradeReason('superlike'); setShowUpgradeModal(true); return
    }
    play(dir === 'right' ? 'like' : dir === 'up' ? 'superlike' : 'dislike')
    setSwipeDir(dir)
    const profileId = currentProfile.id
    const savedProfile = { name: currentProfile.name, photo: currentProfile.photo_best }
    setLastSwipe({ dir, profileId })
    setTimeout(async () => {
      setSwipeDir(null); setDragX(0); setDragY(0)
      setCurrentIdx(i => i + 1)
      if (dir === 'right') {
        setModeLikesUsed(prev => ({ ...prev, [viewMode]: (prev[viewMode] || 0) + 1 }))
        void supabase.from('mode_likes').insert({ user_id: userId, mode: viewMode })
      }
      if (dir === 'up') setSuperlikesUsed(v => v + 1)
      try {
        if (dir === 'left') {
          supabase
            .from('dislikes')
            .upsert(
              { from_user: userId, to_user: profileId },
              { onConflict: 'from_user,to_user' }
            )
            .then(({ error }) => { if (error) console.error('Erro ao gravar dislike:', error) })
          return
        }
        const { data } = await supabase.rpc('process_like', {
          p_user_id:      userId,
          p_target_id:    profileId,
          p_is_superlike: dir === 'up',
        })
        if (data?.is_match) {
          setMatchFriendSent(false)
          setMatchResult({ ...savedProfile, otherUserId: profileId, matchId: data.match_id })
          supabase.auth.getSession().then(({ data: s }) => {
            const token = s.session?.access_token
            if (token) {
              fetch('/api/matches/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ fromUserId: userId, toUserId: profileId }),
              }).catch(() => {})
            }
          })
        }
        if (dir === 'up') {
          supabase.auth.getSession().then(({ data: s }) => {
            const token = s.session?.access_token
            if (token) {
              fetch('/api/likes/superlike-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ toUserId: profileId }),
              }).catch(() => {})
            }
          })
        }
      } catch (err) {
        console.error('Erro ao processar swipe:', err)
        toast.error('Erro ao registrar ação. Verifique sua conexão.')
        haptics.error()
      }
    }, 350)
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  function validateRequired(): boolean {
    if (viewMode === 'discovery') { setRequiredError(null); return true }
    for (const cat of FILTER_CATEGORIES.filter(c => c.required)) {
      const opts = cat.groups.flatMap(g => g.options)
      if (!opts.some(o => localFilters[o.key])) {
        setRequiredError(`Selecione ao menos uma opção em "${cat.label}"`)
        setOpenCategories(prev => ({ ...prev, [cat.id]: true }))
        return false
      }
    }
    setRequiredError(null); return true
  }

  async function handleSaveAndSearch() {
    if (!validateRequired() || !userId) return
    setSaving(true)
    try {
      const { search_max_distance_km, search_min_age, search_max_age, search_gender } = localFilters
      await supabase.from('filters').upsert({
        user_id: userId, search_saved: true,
        search_max_distance_km, search_min_age, search_max_age, search_gender,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      try { localStorage.setItem(`filters_${userId}`, JSON.stringify(localFilters)) } catch {}
      setFiltersConfigured(true); setShowFilters(false)
      await loadDeck(localFilters, undefined, viewMode === 'search')
    } catch { setError('Erro ao salvar filtros.') }
    finally { setSaving(false) }
  }

  function toggleBool(key: string) {
    setLocalFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleBoost() {
    if (boostUntil && boostUntil > new Date()) {
      toast.info('Você já tem um Boost ativo!')
      return
    }
    if (boostAmount <= 0) {
      window.location.href = '/loja'
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/boosts/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      })
      const data = await res.json()
      if (data?.success) {
        haptics.success()
        play('success')
        toast.success('Boost ativado! Você está em destaque por 1 hora.')
        setBoostUntil(new Date(data.active_until))
        setBoostAmount(b => b - 1)
      } else if (data?.reason === 'already_active') {
        toast.info('Você já tem um Boost ativo!')
      } else if (data?.reason === 'no_boosts') {
        window.location.href = '/loja'
      } else {
        toast.error('Erro ao ativar boost. Tente novamente.')
      }
    } catch {
      toast.error('Erro ao ativar boost. Tente novamente.')
    }
  }

  function openFilters() {
    const expanded: Record<string, boolean> = {}
    FILTER_CATEGORIES.forEach(cat => {
      const hasAny = cat.groups.flatMap(g => g.options).some(o => localFilters[o.key])
      if (hasAny) expanded[cat.id] = true
    })
    if (Object.keys(expanded).length > 0) setOpenCategories(expanded)
    setShowFilters(true)
  }

  // ── Computed swipe values ─────────────────────────────────────────────────

  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : swipeDir === 'right' ? 700 : 0) : 0
  const cardY = isDragging ? dragY : swipeDir === 'up' ? -700 : 0
  const showLikeIndicator = isDragging && dragX > 20
  const showPassIndicator = isDragging && dragX < -20
  const showSuperIndicator = isDragging && dragY < -20
  const showInfoIndicator = isDragging && dragY > 20
  const likeOpacity = isDragging ? Math.min(1, (dragX - 20) / 80) : 0
  const passOpacity = isDragging ? Math.min(1, (-dragX - 20) / 80) : 0
  const superOpacity = isDragging ? Math.min(1, (-dragY - 20) / 80) : 0
  const infoOpacity = isDragging ? Math.min(1, (dragY - 20) / 80) : 0

  // ── Foto atual do card ────────────────────────────────────────────────────

  const photos = currentProfile?.photos?.length
    ? currentProfile.photos
    : currentProfile?.photo_best ? [currentProfile.photo_best] : []
  const currentPhoto = photos[photoIdx] ?? photos[0]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-jakarta)',
        color: 'var(--text)',
      }}
    >
      {/* Banner de erro */}
      {error && (
        <div
          style={{
            margin: '8px 12px 0',
            padding: '10px 14px',
            borderRadius: 12,
            backgroundColor: 'rgba(225,29,72,0.10)',
            border: '1px solid rgba(225,29,72,0.25)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            fontSize: 13,
            color: '#f87171',
            flexShrink: 0,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Conteúdo principal */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {showHub ? (
          <ModesHubView userPlan={userPlan} onSelect={(m) => { setViewMode(m); setShowHub(false) }} onCamarote={() => { if (userPlan === 'black') router.push('/backstage'); else setCamaroteModal(true) }} />
        ) : viewMode === 'rooms' ? (
          <RoomsView userPlan={userPlan} />
        ) : viewMode === 'daily' ? (
          <DailyMatchView userId={userId} localFilters={localFilters} userPlan={userPlan} />
        ) : viewMode === 'search' && !loadingDeck ? (
          <SearchGrid deck={deck} />
        ) : loadingDeck ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 20px', gap: 12 }}>
            <style>{skeletonCss}</style>
            <div style={{ width: '100%', maxWidth: 360 }}>
              <SkeletonCard />
            </div>
            <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>Buscando pessoas perto de você...</span>
          </div>
        ) : limitReached ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', gap: 16 }}>
            <PaywallCard
              title="Curtidas esgotadas"
              description={`Você usou todas as ${likeLimit} curtidas de hoje. Volte amanhã ou faça upgrade para curtir mais.`}
              resetAt={(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d })()}
              ctaLabel="Ver planos"
            />
            <button
              onClick={() => setLimitReached(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 12, cursor: 'pointer' }}
            >
              Continuar sem curtir
            </button>
          </div>
        ) : !currentProfile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Compass size={28} strokeWidth={1.5} color="var(--muted)" />
            </div>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>Ninguém novo por aqui</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>Tente aumentar o raio de busca ou mudar os filtros</p>
            <button
              onClick={() => userId && loadDeck(DEFAULT_FILTERS, userId, false)}
              style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-jakarta)', cursor: 'pointer' }}
            >
              Recarregar
            </button>
          </div>
        ) : (
          /* Swipe view */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 12px 8px',
              gap: 10,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Contador */}
            {likeLimit !== Infinity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                  <Star size={10} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{superlikesUsed}/{superlikeLimit}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.10)' }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                  <Heart size={10} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{modeLikesUsed[viewMode] ?? 0}/{likeLimit === Infinity ? '∞' : likeLimit}
                </span>
              </div>
            )}

            {/* Banner de Boost */}
            {boostUntil && boostUntil > new Date() ? (
              <BoostActiveBanner until={boostUntil} />
            ) : (
              <button
                onClick={() => window.location.href = '/loja'}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}
              >
                <Zap size={13} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Dar um boost e aparecer para mais pessoas</span>
              </button>
            )}

            {/* Stack de cards */}
            <div style={{ flex: 1, width: '100%', position: 'relative', minHeight: 0, overflow: 'hidden' }}>

              {/* Card de trás */}
              {deck[currentIdx + 1] && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 24,
                    overflow: 'hidden',
                    transform: 'scale(0.94) translateY(14px)',
                    opacity: 0.55,
                    pointerEvents: 'none',
                  }}
                >
                  {deck[currentIdx + 1].photo_best ? (
                    <Image
                      src={deck[currentIdx + 1].photo_best!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--bg-card2)' }} />
                  )}
                </div>
              )}

              {/* Card principal — arrastável */}
              <div
                ref={cardRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 24,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotation}deg)`,
                  transition: isDragging ? 'none' : isSnapping ? 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                  willChange: 'transform',
                }}
                onMouseDown={(e) => onDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
                onMouseUp={(e) => onDragEnd(e.clientX)}
                onMouseLeave={() => onDragEnd()}
                onTouchStart={(e) => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY) }}
                onTouchMove={(e) => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY) }}
                onTouchEnd={(e) => { e.preventDefault(); onDragEnd(e.changedTouches[0]?.clientX) }}
              >
                {/* Foto */}
                {currentPhoto ? (
                  <Image
                    src={currentPhoto}
                    alt={currentProfile.name}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 640px) 100vw, 400px"
                    draggable={false}
                    priority
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 64, color: 'rgba(255,255,255,0.12)',
                    }}
                  >?</div>
                )}

                {/* Barra de progresso de fotos */}
                {photos.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      gap: 4,
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 100,
                          backgroundColor: i <= photoIdx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
                          transition: 'background-color 0.2s',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Gradiente overlay */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.35) 40%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Carimbo LIKE */}
                {showLikeIndicator && (
                  <div
                    style={{
                      position: 'absolute', top: 52, left: 18,
                      border: '3px solid rgba(16,185,129,0.90)',
                      borderRadius: 10, padding: '6px 14px',
                      transform: 'rotate(-14deg)',
                      pointerEvents: 'none',
                      opacity: likeOpacity,
                    }}
                  >
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>CURTIR</span>
                  </div>
                )}

                {/* Carimbo NOPE */}
                {showPassIndicator && (
                  <div
                    style={{
                      position: 'absolute', top: 52, right: 18,
                      border: '3px solid rgba(225,29,72,0.90)',
                      borderRadius: 10, padding: '6px 14px',
                      transform: 'rotate(14deg)',
                      pointerEvents: 'none',
                      opacity: passOpacity,
                    }}
                  >
                    <span style={{ color: '#E11D48', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>PASSA</span>
                  </div>
                )}

                {/* Carimbo SUPER */}
                {showSuperIndicator && (
                  <div
                    style={{
                      position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
                      border: '3px solid rgba(96,165,250,0.90)',
                      borderRadius: 10, padding: '6px 14px',
                      pointerEvents: 'none',
                      opacity: superOpacity,
                    }}
                  >
                    <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>SUPER</span>
                  </div>
                )}

                {/* Carimbo INFO (swipe down) */}
                {showInfoIndicator && (
                  <div
                    style={{
                      position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                      border: '3px solid rgba(248,249,250,0.70)',
                      borderRadius: 10, padding: '6px 14px',
                      pointerEvents: 'none',
                      opacity: infoOpacity,
                    }}
                  >
                    <span style={{ color: 'rgba(248,249,250,0.90)', fontWeight: 800, fontSize: 18, letterSpacing: 2 }}>VER MAIS</span>
                  </div>
                )}

                {/* Info do perfil */}
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0 18px 18px',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2
                        style={{
                          fontFamily: 'var(--font-fraunces)',
                          fontSize: 26,
                          fontWeight: 700,
                          color: '#fff',
                          margin: 0,
                          lineHeight: 1.1,
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        }}
                      >
                        {currentProfile.name}
                        {currentProfile.age && (
                          <span style={{ fontWeight: 400, opacity: 0.85 }}>, {currentProfile.age}</span>
                        )}
                      </h2>
                      {(currentProfile.city || currentProfile.distance_km !== undefined) && (
                        <p
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 13, color: 'rgba(255,255,255,0.70)',
                            margin: '4px 0 0',
                          }}
                        >
                          <MapPin size={11} strokeWidth={1.5} />
                          {currentProfile.city && `${currentProfile.city}`}
                          {currentProfile.city && currentProfile.distance_km !== undefined && ' · '}
                          {currentProfile.distance_km !== undefined
                            ? currentProfile.distance_km < 1 ? 'menos de 1 km' : `${currentProfile.distance_km} km`
                            : ''}
                        </p>
                      )}
                      {currentProfile.bio && (
                        <p
                          style={{
                            fontSize: 12, color: 'rgba(255,255,255,0.55)',
                            margin: '6px 0 0', lineHeight: 1.45,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {currentProfile.bio}
                        </p>
                      )}
                    </div>

                    {/* Botão ver perfil */}
                    <Link
                      href={`/perfil/${currentProfile.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        pointerEvents: 'all',
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        color: '#fff',
                      }}
                    >
                      <Info size={15} strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexShrink: 0,
                padding: '4px 0 6px',
              }}
            >
              <SwipeButton
                variant="default"
                size="sm"
                icon={<Undo2 size={18} strokeWidth={1.5} />}
                label="Voltar"
                onClick={async () => {
                  if (currentIdx === 0) return
                  play('tap')
                  setCurrentIdx(i => Math.max(0, i - 1))
                  if (lastSwipe && (lastSwipe.dir === 'right' || lastSwipe.dir === 'up') && userId) {
                    try {
                      await supabase
                        .from('likes')
                        .delete()
                        .eq('user_id', userId)
                        .eq('target_id', lastSwipe.profileId)
                      if (lastSwipe.dir === 'right') setModeLikesUsed(prev => ({ ...prev, [viewMode]: Math.max(0, (prev[viewMode] || 0) - 1) }))
                      if (lastSwipe.dir === 'up') setSuperlikesUsed(v => Math.max(0, v - 1))
                    } catch {}
                  }
                  setLastSwipe(null)
                }}
                disabled={currentIdx === 0 || !lastSwipe}
              />
              <SwipeButton
                variant="danger"
                size="lg"
                icon={<X size={26} strokeWidth={1.5} />}
                label="Não curtir"
                onClick={() => triggerSwipe('left')}
              />
              <SwipeButton
                variant="info"
                size="md"
                icon={<Star size={20} strokeWidth={1.5} />}
                label={`SuperCurtida (${superlikesUsed}/${superlikeLimit})`}
                onClick={() => triggerSwipe('up')}
              />
              <SwipeButton
                variant="primary"
                size="lg"
                icon={<Heart size={26} strokeWidth={1.5} />}
                label="Curtir"
                onClick={() => triggerSwipe('right')}
              />
              <SwipeButton
                variant="gold"
                size="sm"
                icon={<Zap size={18} strokeWidth={1.5} />}
                label={boostAmount > 0 ? `Boost (${boostAmount})` : 'Boost'}
                onClick={handleBoost}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── BottomSheet de detalhes do perfil (swipe down) ────────────────── */}
      <BottomSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        title={currentProfile?.name ?? ''}
      >
        {currentProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentProfile.bio && (
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                {currentProfile.bio}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {currentProfile.age && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  {currentProfile.age} anos
                </span>
              )}
              {currentProfile.city && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} strokeWidth={1.5} /> {currentProfile.city}
                </span>
              )}
              {currentProfile.distance_km !== undefined && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  {Math.round(currentProfile.distance_km)} km
                </span>
              )}
            </div>
            <a
              href={`/perfil/${currentProfile.id}`}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
            >
              Ver perfil completo
            </a>
          </div>
        )}
      </BottomSheet>

      {/* ─── BottomSheet de filtros ─────────────────────────────────────────── */}
      <BottomSheet
        isOpen={showFilters}
        onClose={filtersConfigured ? () => setShowFilters(false) : () => {}}
        title={filtersConfigured ? 'Editar filtros' : undefined}
      >
        {!filtersConfigured && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 4px' }}>
              O que você busca?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Configure uma vez, edite quando quiser</p>
          </div>
        )}

        {filtersConfigured && (
          <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.40)', margin: '0 0 16px' }}>
            Configure o perfil da pessoa que você está buscando
          </p>
        )}

        {requiredError && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: 'rgba(225,29,72,0.08)',
              border: '1px solid rgba(225,29,72,0.25)',
              fontSize: 12,
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            {requiredError}
          </div>
        )}

        {/* Localização e Idade */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            backgroundColor: 'var(--bg-card2)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 10,
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 14 }}>
            Localização e idade
          </p>

          {/* Distância */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Distância máxima</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                {(localFilters.search_max_distance_km as number) >= 500 ? 'Todo o Brasil' : `${localFilters.search_max_distance_km} km`}
              </span>
            </div>
            <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{
                position: 'absolute', left: 0, height: 4, borderRadius: 100,
                backgroundColor: 'var(--accent)',
                width: `${Math.min(((localFilters.search_max_distance_km as number - 5) / (500 - 5)) * 100, 100)}%`,
              }} />
              <input
                type="range" min={5} max={500} step={25}
                value={localFilters.search_max_distance_km as number}
                onChange={(e) => setLocalFilters(p => ({ ...p, search_max_distance_km: Number(e.target.value) }))}
                className="ui-range-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>
              <span>5 km</span><span>Todo o Brasil</span>
            </div>
          </div>

          {/* Faixa de idade */}
          <SliderRange
            min={18}
            max={60}
            step={1}
            label="Faixa de idade"
            unit=" anos"
            value={[
              Math.min(localFilters.search_min_age as number, 60),
              Math.min(localFilters.search_max_age as number, 60),
            ]}
            onChange={([minA, maxA]) => setLocalFilters(p => ({
              ...p,
              search_min_age: minA,
              search_max_age: maxA,
            }))}
            formatMax={(v) => v >= 60 ? '60+' : String(v)}
          />

          {/* Gênero */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Gênero</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENDER_OPTIONS.filter(opt => opt.value === 'all' || opt.value !== userGender).map((opt) => (
                <Pill
                  key={opt.value}
                  size="sm"
                  selected={localFilters.search_gender === opt.value}
                  onClick={() => setLocalFilters(p => ({ ...p, search_gender: opt.value }))}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Localização */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Cidade ou estado</span>
            <LocationAutocomplete
              displayValue={locationDisplay}
              onSelect={(city, state, display) => {
                setLocationDisplay(display)
                setLocalFilters(p => ({ ...p, search_state: state }))
              }}
            />
            {localFilters.search_state && (
              <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 6 }}>
                Filtrando por: {STATE_NAMES[localFilters.search_state as string] ?? localFilters.search_state}
              </p>
            )}
          </div>
        </div>

        {/* Categorias de filtros avancados */}
        {viewMode === 'discovery' && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', borderRadius: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.65)', margin: 0 }}>
              Modo <strong style={{ color: '#F8F9FA' }}>Descobrir</strong> usa apenas idade e distância. Mude para <strong style={{ color: '#F8F9FA' }}>Busca</strong> para usar filtros avançados.
            </p>
          </div>
        )}
        {viewMode !== 'discovery' && FILTER_CATEGORIES.map((cat) => {
          const isLocked = cat.locked && userPlan !== 'black'
          const isOpen = openCategories[cat.id]
          const activeCount = cat.groups.flatMap(g => g.options).filter(o => localFilters[o.key]).length
          const hasSelection = cat.groups.flatMap(g => g.options).some(o => localFilters[o.key])

          return (
            <div
              key={cat.id}
              style={{
                marginBottom: 6,
                borderRadius: 14,
                border: `1px solid ${cat.required && !hasSelection && !filtersConfigured ? 'rgba(234,179,8,0.35)' : 'var(--border)'}`,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => isLocked
                  ? (setUpgradeReason('fetiche'), setShowUpgradeModal(true))
                  : setOpenCategories(p => ({ ...p, [cat.id]: !p[cat.id] }))
                }
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: 'none',
                  cursor: 'pointer',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <cat.icon size={14} strokeWidth={1.5} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
                      {cat.label}
                    </span>
                  </div>
                  {cat.required && !hasSelection && (
                    <span style={{ fontSize: 11, color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.10)', padding: '2px 8px', borderRadius: 100 }}>
                      obrigatório
                    </span>
                  )}
                  {activeCount > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--accent)', backgroundColor: 'rgba(225,29,72,0.12)', padding: '2px 8px', borderRadius: 100 }}>
                      {activeCount}
                    </span>
                  )}
                  {isLocked && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.10)', padding: '2px 8px', borderRadius: 100 }}>
                      <Lock size={9} /> Black
                    </span>
                  )}
                </div>
                {!isLocked && (
                  isOpen
                    ? <ChevronUp size={14} style={{ color: 'var(--muted-2)', flexShrink: 0 }} />
                    : <ChevronDown size={14} style={{ color: 'var(--muted-2)', flexShrink: 0 }} />
                )}
              </button>

              {!isLocked && (
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
                <div style={{ overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 14px', backgroundColor: 'rgba(8,9,14,0.50)' }}>
                  {cat.groups.map((group) => (
                    <div key={group.label} style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        {group.label}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {group.options.map((opt) => (
                          <Pill
                            key={opt.key}
                            size="sm"
                            selected={!!localFilters[opt.key]}
                            onClick={() => toggleBool(opt.key)}
                            icon={localFilters[opt.key] ? <Check size={11} strokeWidth={2} /> : undefined}
                          >
                            {opt.label}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
                </div>
              )}
            </div>
          )
        })}

        <p style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center', margin: '8px 0 20px' }}>
          Categorias sem seleção = aceita qualquer pessoa
        </p>

        {/* Botão salvar */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            margin: '0 -20px -32px',
            padding: '14px 20px 24px',
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={handleSaveAndSearch}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {saving && <Loader2 size={17} style={{ animation: 'ui-spin 1s linear infinite' }} />}
            {filtersConfigured ? 'Salvar e buscar' : 'Pronto, vamos lá!'}
          </button>
        </div>
      </BottomSheet>

      {/* ─── Modal de Match ──────────────────────────────────────────────────── */}
      {matchResult && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div
            onClick={() => setMatchResult(null)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
          />
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              borderRadius: 28,
              padding: '32px 24px',
              border: '1px solid rgba(225,29,72,0.30)',
              maxWidth: 360,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>💘</div>
            {matchResult.photo && (
              <div
                style={{
                  width: 88, height: 88,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 16px',
                  border: '3px solid var(--accent)',
                  boxShadow: '0 0 0 4px rgba(225,29,72,0.20)',
                }}
              >
                <Image src={matchResult.photo} alt={matchResult.name} width={88} height={88} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
            )}
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, color: 'var(--text)', margin: '0 0 8px' }}>
              É um Match!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Você e <strong style={{ color: 'var(--text)' }}>{matchResult.name}</strong> se curtiram mutuamente.
            </p>
            <Link
              href={matchResult.matchId ? `/conversas/${matchResult.matchId}` : '/matches'}
              onClick={() => setMatchResult(null)}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              Enviar mensagem
            </Link>
            <button
              onClick={() => setMatchResult(null)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 0',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--muted)',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Continuar explorando
            </button>
            {matchResult.otherUserId && !matchFriendSent && (
              <button
                onClick={async () => {
                  if (!userId) return
                  try {
                    await fetch('/api/amigos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ friendId: matchResult!.otherUserId }),
                    })
                    setMatchFriendSent(true)
                  } catch {}
                }}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 14, marginBottom: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(248,249,250,0.70)', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Check size={15} /> Adicionar como amigo
              </button>
            )}
            {matchFriendSent && (
              <p style={{ fontSize: 13, color: '#10b981', textAlign: 'center', marginBottom: 10 }}>Pedido de amizade enviado!</p>
            )}
            <button
              onClick={() => setMatchResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer' }}
            >
              Continuar buscando
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal de Upgrade ────────────────────────────────────────────────── */}
      {camaroteModal && (
        <CamaroteModal onClose={() => setCamaroteModal(false)} />
      )}

      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div
            onClick={() => setShowUpgradeModal(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              borderRadius: 16,
              padding: '28px 22px',
              border: '1px solid rgba(255,255,255,0.06)',
              maxWidth: 340,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            }}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: 'rgba(225,29,72,0.12)',
                border: '1px solid rgba(225,29,72,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {upgradeReason === 'superlike'
                ? <Star size={22} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                : <Lock size={22} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              }
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>
              {upgradeReason === 'superlike' ? 'SuperCurtidas esgotadas' : 'Exclusivo Black'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
              {upgradeReason === 'superlike'
                ? userPlan === 'essencial'
                  ? 'Você esgotou suas SuperCurtidas. Faça upgrade ou compre mais na loja.'
                  : 'Você esgotou suas SuperCurtidas de hoje e seu saldo avulso. Compre mais na loja ou aguarde amanhã.'
                : 'Filtros de Fetiche, BDSM e Sugar são exclusivos do plano Black.'}
            </p>
            <Link
              href={upgradeReason === 'superlike' && userPlan !== 'essencial' ? '/loja' : '/planos'}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              {upgradeReason === 'superlike' && userPlan !== 'essencial' ? 'Ir para a loja' : 'Ver planos'}
            </Link>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer' }}
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }} />}>
      <BuscaInner />
    </Suspense>
  )
}

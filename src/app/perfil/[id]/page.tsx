'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

import type { EmblemaDef, DbBadge } from './types'
import { STATUS_TEMP_LABELS } from './types'
import { calcTrustScore, getConquistas, getStatusPills } from './utils'
import { HeroSection } from './HeroSection'
import { DesktopHeader } from './DesktopHeader'
import { DesktopActions, MobileActionBar } from './ActionButtons'
import { StatusChips, BioSection, ProfileQuestion, InterestsGrid, InfoGrid, TrustScore, RatingsCard, FilterTags } from './ContentSections'
import { BadgesSection, HiddenBadgesToggle } from './BadgesSection'
import { BadgeModal, EmergencyModal, DenunciaModal } from './Modals'

export default function VerPerfilPage() {
  const params = useParams()
  const profileId = params.id as string
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [filters, setFilters] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [swipeAction, setSwipeAction] = useState<'like' | 'dislike' | 'superlike' | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [viewedPlan, setViewedPlan] = useState<string | null>(null)
  const [viewerIsBlack, setViewerIsBlack] = useState(false)
  const [emergencyModal, setEmergencyModal] = useState(false)
  const [denunciaModal, setDenunciaModal] = useState(false)
  const [userRow, setUserRow] = useState<any>(null)
  const [selectedBadge, setSelectedBadge] = useState<EmblemaDef | null>(null)
  const [dbBadges, setDbBadges] = useState<DbBadge[]>([])
  const [ratings, setRatings] = useState<{ total: number; positive: number } | null>(null)
  const [badgeShowcase, setBadgeShowcase] = useState<string[]>([])
  const [allBadgesOpen, setAllBadgesOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!profileId || !userId) return
    loadProfile()
  }, [profileId, userId])

  async function loadProfile() {
    setLoading(true)

    let { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, birthdate, bio, gender, pronouns, city, state, photo_face, photo_body, photo_side, photo_best, photo_extra1, photo_extra2, photo_extra3, highlight_tags, status_temp, status_temp_expires_at, profile_question, profile_question_answer, badge_showcase, verified, last_seen, created_at, verified_plus')
      .eq('id', profileId)
      .single()

    if (!profileData) {
      const { data: fallback } = await supabase
        .from('profiles')
        .select('id, name, birthdate, bio, gender, city, state, photo_best, verified, last_seen, created_at, verified_plus')
        .eq('id', profileId)
        .single()
      profileData = fallback as typeof profileData
    }

    const { data: filtersData } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', profileId)
      .single()

    if (profileData && userId) {
      const { data: targetGeo } = await supabase
        .rpc('get_user_distance', { p_from: userId, p_to: profileId })
      if (targetGeo !== null) setDistance(targetGeo)
    }

    setProfile(profileData)
    setFilters(filtersData)
    setBadgeShowcase((profileData as any)?.badge_showcase ?? [])
    setUserRow(profileData ? {
      verified: (profileData as any).verified,
      last_seen: (profileData as any).last_seen,
      created_at: (profileData as any).created_at,
      verified_plus: (profileData as any).verified_plus,
    } : null)

    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(name, description, icon, icon_url, rarity)')
      .eq('user_id', profileId)
    setDbBadges((badgesData as any) ?? [])

    const { data: ratingsData } = await supabase
      .from('match_ratings')
      .select('rating')
      .eq('rated_id', profileId)
    if (ratingsData && ratingsData.length >= 3) {
      const total = ratingsData.length
      const positive = ratingsData.filter(r =>
        r.rating === 'Pessoa incrivel!' || r.rating === 'Conversa agradavel'
      ).length
      setRatings({ total, positive })
    }

    if (userId) {
      const { data: viewerSub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      const isBlack = viewerSub?.plan === 'black'
      setViewerIsBlack(isBlack)

      if (isBlack) {
        const { data: targetSub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', profileId)
          .eq('status', 'active')
          .single()
        setViewedPlan(targetSub?.plan ?? null)
      }
    }

    setLoading(false)
  }

  async function toggleBadge(badgeId: string) {
    if (!userId) return
    haptics.tap()
    let next: string[]
    if (badgeShowcase.includes(badgeId)) {
      next = badgeShowcase.filter(id => id !== badgeId)
    } else {
      if (badgeShowcase.length >= 3) {
        toast.show('Máximo de 3 emblemas em exibição. Remova um antes de adicionar outro.', 'error')
        return
      }
      next = [...badgeShowcase, badgeId]
    }
    setBadgeShowcase(next)
    try {
      await supabase.from('profiles').update({ badge_showcase: next }).eq('id', userId)
    } catch { /* silencia */ }
  }

  async function handleSwipe(action: 'like' | 'dislike' | 'superlike') {
    if (!userId) return
    setSwipeAction(action)
    if (action === 'superlike') haptics.success()
    else if (action === 'like') haptics.medium()
    else haptics.tap()

    if (action === 'dislike') {
      await supabase.from('dislikes').upsert(
        { from_user: userId, to_user: profileId },
        { onConflict: 'from_user,to_user' }
      )
    } else {
      const { error: swipeErr } = await supabase.rpc('process_like', {
        p_user_id: userId, p_target_id: profileId, p_is_superlike: action === 'superlike',
      })
      if (swipeErr) {
        toast.show('Não foi possível registrar a ação. Tente novamente.', 'error')
        setSwipeAction(null)
        return
      }
    }
    setTimeout(() => router.back(), 800)
  }

  // ─── Loading / Not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.08)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!profile) {
    if (profileId === userId) { router.replace('/configuracoes/editar-perfil'); return null }
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ color: 'rgba(248,249,250,0.30)', fontFamily: 'var(--font-jakarta)' }}>Perfil não encontrado.</p>
        <button onClick={() => router.back()} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', fontFamily: 'var(--font-jakarta)' }}>Voltar</button>
      </div>
    )
  }

  // ─── Dados derivados ───────────────────────────────────────────────────────

  const age = profile.birthdate
    ? Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / 31557600000)
    : null

  const photos = [...new Set([
    profile.photo_best, profile.photo_face, profile.photo_body,
    profile.photo_side, profile.photo_extra1, profile.photo_extra2, profile.photo_extra3,
  ].filter(Boolean))] as string[]

  const isOwnProfile = profileId === userId
  const trustScore = calcTrustScore(profile, photos, filters)
  const conquistas = getConquistas(profile, photos)
  const statusPills = getStatusPills(userRow)
  const emblemas: EmblemaDef[] = []

  const statusTempVivo = !!(profile?.status_temp && profile?.status_temp_expires_at && new Date(profile.status_temp_expires_at) > new Date())

  const statusChips: { label: string; bg: string; color: string; border: string }[] = []
  if (userRow?.verified) statusChips.push({ label: 'Verificado', bg: 'rgba(225,29,72,0.18)', color: '#F43F5E', border: 'rgba(225,29,72,0.35)' })
  if (userRow?.verified_plus) statusChips.push({ label: 'Verificado Plus', bg: 'rgba(245,158,11,0.14)', color: '#F59E0B', border: 'rgba(245,158,11,0.30)' })
  if (viewerIsBlack && viewedPlan === 'black') statusChips.push({ label: 'Black', bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' })
  if (statusTempVivo) statusChips.push({ label: STATUS_TEMP_LABELS[profile.status_temp as string] ?? profile.status_temp, bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' })

  const unlockedStatic = emblemas.filter(e => e.desbloqueado)
  const badgeShowcaseList = isOwnProfile ? badgeShowcase : ((profile?.badge_showcase as string[]) ?? [])
  const publicStatic = isOwnProfile ? unlockedStatic : unlockedStatic.filter(e => badgeShowcaseList.includes(e.id))
  const publicDb = isOwnProfile ? dbBadges : dbBadges.filter(ub => badgeShowcaseList.includes(ub.badge_id))
  const showConquistas = publicStatic.length + publicDb.length > 0 || conquistas.length > 0
  const totalBadgesCount = unlockedStatic.length + dbBadges.length
  const hasHiddenBadges = !isOwnProfile && totalBadgesCount > publicStatic.length + publicDb.length
  const hiddenStatic = unlockedStatic.filter(e => !publicStatic.find(p => p.id === e.id))
  const hiddenDb = dbBadges.filter(ub => !publicDb.find(p => p.badge_id === ub.badge_id))

  const goEdit = () => router.push('/configuracoes/editar-perfil')

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#08090E', fontFamily: 'var(--font-jakarta)', paddingBottom: '100px' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}10%{transform:translate(-1%,-1%)}20%{transform:translate(1%,0)}30%{transform:translate(0,1%)}40%{transform:translate(-1%,0)}50%{transform:translate(1%,1%)}60%{transform:translate(0,-1%)}70%{transform:translate(-1%,1%)}80%{transform:translate(1%,-1%)}90%{transform:translate(0,0)}}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', opacity: 0.022, animation: 'grain 8s steps(1) infinite' }} />

      <div className="perfil-layout">
        {/* ══ Coluna foto ══ */}
        <div className="perfil-col-foto">
          <HeroSection
            photos={photos} activePhoto={activePhoto} setActivePhoto={setActivePhoto}
            profileName={profile.name} age={age} city={profile.city} state={profile.state}
            distance={distance} verified={!!userRow?.verified} verifiedPlus={!!userRow?.verified_plus}
            viewerIsBlack={viewerIsBlack} viewedPlan={viewedPlan}
            isOwnProfile={isOwnProfile} statusPills={statusPills}
            statusTempVivo={statusTempVivo} statusTemp={profile.status_temp}
            swipeAction={swipeAction} onBack={() => router.back()} onEditPhotos={goEdit}
            onEmergency={() => setEmergencyModal(true)}
          />
          {photos.length > 1 && (
            <div className="perfil-thumbs" style={{ gridTemplateColumns: `repeat(${Math.min(photos.length, 5)}, 1fr)`, gap: '6px', marginTop: '8px' }}>
              {photos.slice(0, 5).map((src, i) => (
                <button key={i} onClick={() => setActivePhoto(i)} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: i === activePhoto ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', padding: 0, background: 'none' }}>
                  <Image src={src} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══ Coluna info ══ */}
        <div className="perfil-col-info">
          <DesktopHeader profileName={profile.name} age={age} city={profile.city} state={profile.state} distance={distance} verified={!!userRow?.verified} viewerIsBlack={viewerIsBlack} viewedPlan={viewedPlan} />
          <DesktopActions isOwnProfile={isOwnProfile} onEditProfile={goEdit} onSwipe={handleSwipe} />

          <div className="perfil-content-inner" style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', zIndex: 2 }}>
            <StatusChips chips={statusChips} />
            <BioSection bio={profile.bio} isOwnProfile={isOwnProfile} onEdit={goEdit} />
            {profile.profile_question && profile.profile_question_answer && (
              <ProfileQuestion question={profile.profile_question} answer={profile.profile_question_answer} />
            )}
            <BadgesSection
              showConquistas={showConquistas} publicStatic={publicStatic} publicDb={publicDb}
              conquistas={conquistas} isOwnProfile={isOwnProfile} badgeShowcase={badgeShowcase}
              onToggleBadge={toggleBadge} onSelectBadge={setSelectedBadge} onViewAll={() => router.push('/emblemas')}
            />
            <InterestsGrid tags={profile.highlight_tags} isOwnProfile={isOwnProfile} onEdit={goEdit} />
            <InfoGrid age={age} city={profile.city} state={profile.state} gender={profile.gender} heightCm={filters?.height_cm} weightKg={filters?.weight_kg} isOwnProfile={isOwnProfile} onEdit={goEdit} />
            <TrustScore score={trustScore} />
            {ratings && <RatingsCard ratings={ratings} />}
            {!profile.highlight_tags?.length && filters && (
              <FilterTags filters={filters} isOwnProfile={isOwnProfile} onEdit={goEdit} />
            )}
            <HiddenBadgesToggle
              hasHiddenBadges={hasHiddenBadges} totalCount={totalBadgesCount}
              hiddenStatic={hiddenStatic} hiddenDb={hiddenDb}
              allBadgesOpen={allBadgesOpen} onToggle={() => setAllBadgesOpen(v => !v)}
              onSelectBadge={setSelectedBadge}
            />
            {profileId !== userId && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                <button onClick={() => setDenunciaModal(true)} style={{ color: 'rgba(248,249,250,0.30)', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
                  Denunciar perfil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Action bar mobile ── */}
        <MobileActionBar isOwnProfile={isOwnProfile} onEditProfile={goEdit} onSwipe={handleSwipe} />

        {/* ── Modais ── */}
        {selectedBadge && <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />}
        {emergencyModal && <EmergencyModal onClose={() => setEmergencyModal(false)} />}
        {denunciaModal && <DenunciaModal profileId={profileId} userId={userId!} supabase={supabase} toast={toast} onClose={() => setDenunciaModal(false)} />}
      </div>
    </div>
  )
}

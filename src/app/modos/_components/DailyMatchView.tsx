'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Loader2, X, Sparkles } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import {
  Profile, FiltersState, COMPAT_KEYS, FILTER_CATEGORIES,
  calcCompatibility, requestLocation, getDailyMatchLimit,
} from './helpers'

export function DailyMatchView({ userId, localFilters, userPlan }: { userId: string | null; localFilters: FiltersState; userPlan: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [scores, setScores] = useState<Record<string, number>>({})
  const toast = useToast()
  const haptics = useHaptics()

  useEffect(() => {
    if (!userId) return
    loadDaily()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, localFilters])

  async function loadDaily() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `daily_match_${userId}_${today}`
    const cached = localStorage.getItem(cacheKey)
    let daily: Profile[] = []

    if (cached) {
      try {
        daily = JSON.parse(cached)
        setProfiles(daily)
      } catch {}
    }

    if (!daily.length) {
      try {
        const matchGender = localFilters.search_gender && localFilters.search_gender !== 'all' ? localFilters.search_gender : null
        const dailyLoc = await requestLocation()
        if (dailyLoc && userId) {
          await supabase.from('profiles').update({ lat: dailyLoc.lat, lng: dailyLoc.lng }).eq('id', userId)
        }
        const { data } = await supabase.rpc('search_profiles', {
          p_user_id:         userId,
          p_lat:             dailyLoc?.lat ?? null,
          p_lng:             dailyLoc?.lng ?? null,
          p_max_distance_km: (localFilters.search_max_distance_km as number) >= 500 ? 9999 : localFilters.search_max_distance_km,
          p_min_age:         localFilters.search_min_age,
          p_max_age:         localFilters.search_max_age >= 60 ? 120 : localFilters.search_max_age,
          p_gender:          matchGender,
        })
        const candidates = (data ?? []).slice(0, 20) as Profile[]

        try {
          const candidateIds = candidates.map((p: Profile) => p.id)
          const [myRes, theirRes] = await Promise.all([
            supabase.from('filters').select('*').eq('user_id', userId).single(),
            supabase.from('filters').select('*').in('user_id', candidateIds),
          ])
          if (myRes.data && theirRes.data) {
            const myFilters = myRes.data as Record<string, boolean>
            const scoreMap: Record<string, number> = {}
            for (const row of theirRes.data) {
              const scoreAtoB = calcCompatibility(myFilters, row as Record<string, boolean>)
              const scoreBtoA = calcCompatibility(row as Record<string, boolean>, myFilters)
              scoreMap[row.user_id] = Math.round((scoreAtoB + scoreBtoA) / 2)
            }
            daily = candidates
              .filter(p => (scoreMap[p.id] ?? 0) >= 59)
              .sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0))
              .slice(0, getDailyMatchLimit(userPlan))
            setScores(scoreMap)
          } else {
            daily = candidates.slice(0, getDailyMatchLimit(userPlan))
          }
        } catch {
          daily = candidates.slice(0, getDailyMatchLimit(userPlan))
        }

        setProfiles(daily)
        localStorage.setItem(cacheKey, JSON.stringify(daily))
      } catch {}
    }

    if (daily.length && userId && Object.keys(scores).length === 0) {
      try {
        const profileIds = daily.map(p => p.id)
        const [myRes, theirRes] = await Promise.all([
          supabase.from('filters').select('*').eq('user_id', userId).single(),
          supabase.from('filters').select('*').in('user_id', profileIds),
        ])
        if (myRes.data && theirRes.data) {
          const myFilters = myRes.data as Record<string, boolean>
          const scoreMap: Record<string, number> = {}
          for (const row of theirRes.data) {
            const scoreAtoB = calcCompatibility(myFilters, row as Record<string, boolean>)
            const scoreBtoA = calcCompatibility(row as Record<string, boolean>, myFilters)
            scoreMap[row.user_id] = Math.round((scoreAtoB + scoreBtoA) / 2)
          }
          setScores(scoreMap)
        }
      } catch {}
    }

    setLoading(false)
  }

  async function handleLike(profile: Profile) {
    if (!userId) return
    setLiked(prev => new Set(prev).add(profile.id))
    haptics.medium()
    try {
      await supabase.rpc('process_like', {
        p_user_id: userId, p_target_id: profile.id, p_is_superlike: false,
      })
      toast.success('Curtida enviada!')
    } catch {
      toast.error('Erro ao curtir. Tente novamente.')
    }
  }

  function handlePass(profileId: string) {
    setPassed(prev => new Set(prev).add(profileId))
    haptics.tap()
    if (userId) {
      supabase
        .from('dislikes')
        .upsert(
          { from_user: userId, to_user: profileId },
          { onConflict: 'from_user,to_user' }
        )
        .then(({ error }) => { if (error) console.error('Erro ao gravar dislike:', error) })
    }
  }

  function handleFlip(profileId: string) {
    haptics.tap()
    setFlipped(prev => new Set(prev).add(profileId))
  }

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const allActed = profiles.length > 0 && profiles.every(p => liked.has(p.id) || passed.has(p.id))

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!profiles.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24, textAlign: 'center' }}>
        <Heart size={40} color="rgba(255,255,255,0.20)" strokeWidth={1} />
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)' }}>Sem sugestões hoje</p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Volte amanhã ou ajuste seus filtros para ver mais pessoas.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 16px 20px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={15} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)' }}>Match do dia</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 4 }}>{todayLabel}</p>
        <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>
          {allActed
            ? 'Você já agiu em todas as sugestões de hoje!'
            : 'Escolha uma carta na sorte e descubra quem pode ser seu match'}
        </p>
      </div>

      {allActed ? (
        <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Volte amanhã!</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Novas sugestões aparecem todo dia às 00:00.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {profiles.map((profile, idx) => {
            const isFlipped = flipped.has(profile.id)
            const isLiked = liked.has(profile.id)
            const isPassed = passed.has(profile.id)
            const isActed = isLiked || isPassed
            const photo = profile.photos?.[0] ?? profile.photo_best
            const score = scores[profile.id]

            if (!isFlipped) {
              return (
                <div
                  key={profile.id}
                  onClick={() => handleFlip(profile.id)}
                  style={{
                    aspectRatio: '3/4', borderRadius: 16, cursor: 'pointer',
                    background: 'linear-gradient(160deg, var(--bg-card2) 0%, var(--bg-card) 100%)',
                    border: '1px solid rgba(225,29,72,0.20)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    userSelect: 'none', position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.12s, border-color 0.12s',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(225,29,72,0.07) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(225,29,72,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={20} color="rgba(225,29,72,0.45)" strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Carta {idx + 1}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted-2)' }}>Toque para revelar</p>
                </div>
              )
            }

            return (
              <div
                key={profile.id}
                style={{
                  aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', position: 'relative',
                  border: isLiked ? '1px solid rgba(16,185,129,0.35)' : isPassed ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(225,29,72,0.25)',
                  opacity: isActed ? 0.65 : 1, transition: 'opacity 0.2s',
                  background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
                }}
              >
                {photo ? (
                  <Image src={photo} alt={profile.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={28} color="rgba(255,255,255,0.10)" strokeWidth={1} />
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.15) 55%, transparent 100%)' }} />

                {score !== undefined && (
                  <div style={{ position: 'absolute', top: 7, left: 7, padding: '2px 7px', borderRadius: 100, background: 'rgba(8,9,14,0.85)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Heart size={8} strokeWidth={2} color="var(--accent)" fill="var(--accent)" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>{score}%</span>
                  </div>
                )}

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 8px 6px' }}>
                  <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 12, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </p>
                  {!isActed ? (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        onClick={() => handleLike(profile)}
                        style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.20)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Heart size={13} color="#10b981" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handlePass(profile.id)}
                        style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={13} color="rgba(255,255,255,0.45)" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 10, color: isLiked ? '#10b981' : 'rgba(255,255,255,0.30)', fontWeight: 600, margin: 0 }}>
                      {isLiked ? 'Curtido' : 'Passado'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

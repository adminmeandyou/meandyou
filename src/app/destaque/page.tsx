'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Flame, MapPin, Zap, Lock, ArrowLeft, Loader2, Search } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

type Period = 'day' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoje',
  week: 'Semana',
  month: 'Mês',
}

export default function DestaquesPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [period, setPeriod] = useState<Period>('week')
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lupas, setLupas] = useState(0)
  const [revealing, setRevealing] = useState<string | null>(null)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const canAccess = limits.isPlus || limits.isBlack

  useEffect(() => {
    if (!canAccess) return
    loadHighlights()
    loadLupas()
  }, [period, canAccess])

  async function loadHighlights() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.rpc('get_highlights', {
      p_user_id: user.id,
      p_period: period,
    })
    setProfiles(data ?? [])
    setLoading(false)
  }

  async function loadLupas() {
    if (!user) return
    const { data } = await supabase
      .from('user_lupas')
      .select('amount')
      .eq('user_id', user.id)
      .single()
    setLupas(data?.amount ?? 0)
  }

  async function handleReveal(profileId: string) {
    if (lupas <= 0) { toast.error('Sem lupas disponíveis. Compre na Loja.'); return }
    haptics.medium()
    setRevealing(profileId)
    const { error } = await supabase.rpc('use_lupa', { p_user_id: user?.id, p_target_id: profileId })
    if (!error) {
      setRevealedIds((prev) => new Set(Array.from(prev).concat(profileId)))
      setLupas((l) => l - 1)
      haptics.success()
      toast.success('Perfil revelado!')
    } else {
      haptics.error()
      toast.error('Erro ao revelar perfil')
    }
    setRevealing(null)
  }

  async function handleLike(profileId: string) {
    haptics.medium()
    await supabase.rpc('process_swipe', {
      p_from: user?.id,
      p_to: profileId,
      p_type: 'like',
    })
    setProfiles((prev) => prev.filter((p) => p.profile_id !== profileId))
    toast.success('Curtida enviada!')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: canAccess ? '14px' : '0' }}>
          <button
            onClick={() => router.back()}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <Flame size={18} color="#f97316" strokeWidth={1.5} />
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0 }}>Destaques</h1>
          </div>
          {canAccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)', flexShrink: 0 }}>
              <Search size={12} color="#60a5fa" strokeWidth={1.5} />
              <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}>{lupas} lupas</span>
            </div>
          )}
        </div>

        {/* Seletor de periodo */}
        {canAccess && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 16px', borderRadius: '100px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-jakarta)', fontWeight: period === p ? 700 : 400,
                  backgroundColor: period === p ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                  border: period === p ? '1px solid rgba(249,115,22,0.40)' : '1px solid rgba(255,255,255,0.10)',
                  color: period === p ? '#f97316' : 'var(--muted)',
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Bloqueado para Essencial */}
      {!canAccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '0 32px', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={28} color="#f97316" strokeWidth={1.5} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', margin: '0 0 8px' }}>Exclusivo Plus e Black</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, margin: 0, maxWidth: '280px' }}>
              Veja os perfis mais curtidos da plataforma. Disponível a partir do plano Plus.
            </p>
          </div>
          <a
            href="/planos"
            style={{ padding: '14px 28px', borderRadius: '16px', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', transition: 'opacity 0.2s' }}
          >
            Ver planos
          </a>
        </div>
      ) : (
        <main style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 size={24} color="rgba(255,255,255,0.30)" strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : profiles.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: 'var(--muted)' }}>
              <Flame size={32} strokeWidth={1.5} />
              <p style={{ fontSize: '14px', textAlign: 'center', margin: 0 }}>Nenhum destaque nesse periodo ainda.</p>
            </div>
          ) : (
            <>
              {lupas === 0 && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', color: '#93c5fd', fontSize: '12px', textAlign: 'center' }}>
                  Sem lupas para revelar perfis. Compre na{' '}
                  <a href="/loja" style={{ color: '#93c5fd', fontWeight: 700 }}>Loja</a>
                  {' '}ou ganhe jogando na roleta.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {profiles.map((profile) => (
                  <HighlightCard
                    key={profile.profile_id}
                    profile={profile}
                    revealed={revealedIds.has(profile.profile_id)}
                    hasLupas={lupas > 0}
                    revealing={revealing === profile.profile_id}
                    onReveal={() => handleReveal(profile.profile_id)}
                    onLike={() => handleLike(profile.profile_id)}
                    onView={() => router.push(`/perfil/${profile.profile_id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function HighlightCard({ profile, revealed, hasLupas, revealing, onReveal, onLike, onView }: {
  profile: any
  revealed: boolean
  hasLupas: boolean
  revealing: boolean
  onReveal: () => void
  onLike: () => void
  onView: () => void
}) {
  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/4', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {profile.photo_best ? (
        <Image
          src={profile.photo_best}
          alt={revealed ? profile.name : 'Perfil borrado'}
          fill
          style={{ objectFit: 'cover', transition: 'filter 0.5s, transform 0.5s', filter: !revealed ? 'blur(20px)' : 'none', transform: !revealed ? 'scale(1.1)' : 'scale(1)' }}
          sizes="200px"
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />

      {/* Badge boost */}
      {profile.is_boosted && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '100px', backgroundColor: 'rgba(184,245,66,0.20)', border: '1px solid rgba(184,245,66,0.40)' }}>
          <Zap size={10} color="#b8f542" strokeWidth={1.5} />
          <span style={{ color: '#b8f542', fontSize: '10px', fontWeight: 700 }}>Boost</span>
        </div>
      )}

      {/* Overlay de revelar */}
      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={onReveal}
            disabled={!hasLupas || revealing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.80)', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: !hasLupas || revealing ? 'not-allowed' : 'pointer', opacity: !hasLupas || revealing ? 0.4 : 1, fontFamily: 'var(--font-jakarta)', transition: 'opacity 0.15s' }}
          >
            {revealing ? <Loader2 size={12} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={12} strokeWidth={1.5} />}
            Revelar com lupa
          </button>
        </div>
      )}

      {/* Info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '13px', color: '#fff', fontWeight: 700, margin: 0 }}>
          {revealed ? `${profile.name}, ${profile.age}` : '• • •'}
        </p>
        {revealed && (
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', margin: '2px 0 0' }}>
            <MapPin size={9} strokeWidth={1.5} /> {profile.city}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
          <Flame size={9} color="#f97316" strokeWidth={1.5} />
          <span style={{ color: '#f97316', fontSize: '11px' }}>{profile.like_count} curtidas</span>
        </div>

        {/* Botoes */}
        {revealed && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button
              onClick={onView}
              style={{ flex: 1, padding: '6px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'background-color 0.15s' }}
            >
              Ver perfil
            </button>
            <button
              onClick={onLike}
              style={{ flex: 1, padding: '6px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px', fontWeight: 700, border: '1px solid var(--accent-border)', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'background-color 0.15s' }}
            >
              Curtir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

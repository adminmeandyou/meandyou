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
    setLoading(true)
    const { data } = await supabase.rpc('get_highlights', {
      p_user_id: user!.id,
      p_period: period,
    })
    setProfiles(data ?? [])
    setLoading(false)
  }

  async function loadLupas() {
    const { data } = await supabase
      .from('user_lupas')
      .select('amount')
      .eq('user_id', user!.id)
      .single()
    setLupas(data?.amount ?? 0)
  }

  async function handleReveal(profileId: string) {
    if (lupas <= 0) { toast.error('Sem lupas disponíveis. Compre na Loja.'); return }
    haptics.tap()
    setRevealing(profileId)
    const { error } = await supabase.rpc('use_lupa', { p_user_id: user!.id, p_target_id: profileId })
    if (!error) {
      setRevealedIds((prev) => new Set(Array.from(prev).concat(profileId)))
      setLupas((l) => l - 1)
    } else {
      toast.error('Erro ao revelar perfil')
    }
    setRevealing(null)
  }

  async function handleLike(profileId: string) {
    haptics.medium()
    await supabase.rpc('process_swipe', {
      p_from: user!.id,
      p_to: profileId,
      p_type: 'like',
    })
    setProfiles((prev) => prev.filter((p) => p.profile_id !== profileId))
    toast.success('Curtida enviada!')
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white/60" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Flame size={18} className="text-orange-400" />
            <h1 className="font-fraunces text-xl text-white">Destaques</h1>
          </div>
          {canAccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Search size={12} className="text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold">{lupas} lupas</span>
            </div>
          )}
        </div>

        {/* Seletor de período */}
        {canAccess && (
          <div className="flex gap-2">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${
                  period === p
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 font-semibold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Bloqueado para Essencial */}
      {!canAccess ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Lock size={28} className="text-orange-400" />
          </div>
          <div className="text-center">
            <h2 className="font-fraunces text-2xl text-white mb-2">Exclusivo Plus e Black</h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Veja os perfis mais curtidos da plataforma. Disponível a partir do plano Plus.
            </p>
          </div>
          <a
            href="/planos"
            className="px-6 py-3.5 rounded-2xl bg-[#b8f542] text-black font-bold text-sm hover:bg-[#a8e030] transition"
          >
            Ver planos
          </a>
        </div>
      ) : (
        <main className="px-5 pt-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin text-white/30" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30">
              <Flame size={32} />
              <p className="text-sm text-center">Nenhum destaque nesse período ainda.</p>
            </div>
          ) : (
            <>
              {lupas === 0 && (
                <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs text-center">
                  Sem lupas para revelar perfis. Compre na <a href="/loja" className="underline font-semibold">Loja</a> ou ganhe jogando na roleta.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
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
    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-white/5 border border-white/5">
      {profile.photo_best ? (
        <Image
          src={profile.photo_best}
          alt={revealed ? profile.name : 'Perfil borrado'}
          fill
          className={`object-cover transition-all duration-500 ${!revealed ? 'blur-xl scale-110' : ''}`}
          sizes="200px"
        />
      ) : (
        <div className="absolute inset-0 bg-white/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      {/* Badge boost */}
      {profile.is_boosted && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#b8f542]/20 border border-[#b8f542]/40">
          <Zap size={10} className="text-[#b8f542]" />
          <span className="text-[#b8f542] text-xs font-bold">Boost</span>
        </div>
      )}

      {/* Overlay de revelar (quando borrado) */}
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <button
            onClick={onReveal}
            disabled={!hasLupas || revealing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/80 text-white text-xs font-bold hover:bg-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {revealing ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Revelar com lupa
          </button>
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-fraunces text-sm text-white font-semibold">
          {revealed ? `${profile.name}, ${profile.age}` : '• • •'}
        </p>
        {revealed && (
          <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
            <MapPin size={9} /> {profile.city}
          </p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <Flame size={9} className="text-orange-400" />
          <span className="text-orange-400 text-xs">{profile.like_count} curtidas</span>
        </div>

        {/* Botões — só aparecem após revelar */}
        {revealed && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={onView}
              className="flex-1 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
            >
              Ver perfil
            </button>
            <button
              onClick={onLike}
              className="flex-1 py-1.5 rounded-xl bg-[#b8f542]/20 text-[#b8f542] text-xs font-semibold hover:bg-[#b8f542]/30 transition"
            >
              Curtir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { PaywallCard } from '@/components/PaywallCard'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { ArrowLeft, Heart, Star, Lock } from 'lucide-react'

type LikerProfile = {
  from_user: string
  name: string
  photo_best: string | null
  city: string | null
  type: 'like' | 'superlike'
}

// Cores de placeholder para Essencial (determinísticas por índice)
const PLACEHOLDER_GRADIENTS = [
  'from-rose-900/60 to-pink-900/40',
  'from-purple-900/60 to-indigo-900/40',
  'from-red-900/60 to-rose-800/40',
  'from-fuchsia-900/60 to-purple-900/40',
  'from-pink-900/60 to-red-900/40',
  'from-violet-900/60 to-fuchsia-900/40',
]

export default function CurtidasPage() {
  const { user } = useAuth()
  const { limits, loading: planLoading } = usePlan()
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [likers, setLikers] = useState<LikerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [likedBack, setLikedBack] = useState<Set<string>>(new Set())

  const canSee = limits.canSeeWhoLiked

  useEffect(() => {
    if (!user || planLoading) return
    if (!canSee) { setLoading(false); return }
    loadLikers()
  }, [user, canSee, planLoading])

  async function loadLikers() {
    setLoading(true)

    // Busca IDs + tipo de curtida
    const { data: rawLikes } = await supabase
      .from('likes')
      .select('user_id, is_superlike, created_at')
      .eq('target_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!rawLikes || rawLikes.length === 0) {
      setLikers([])
      setLoading(false)
      return
    }

    // Busca perfis via view pública
    const ids = rawLikes.map((l: any) => l.user_id)
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, name, photo_best, city')
      .in('id', ids)

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

    const result: LikerProfile[] = rawLikes.map((l: any) => {
      const p = profileMap.get(l.user_id)
      return {
        from_user: l.user_id,
        name: p?.name ?? '...',
        photo_best: p?.photo_best ?? null,
        city: p?.city ?? null,
        type: l.is_superlike ? 'superlike' : 'like',
      }
    })

    setLikers(result)
    setLoading(false)
  }

  async function handleLikeBack(profileId: string) {
    haptics.medium()
    try {
      await supabase.rpc('process_like', {
        p_user_id: user!.id,
        p_target_id: profileId,
        p_is_superlike: false,
      })
      toast.success('Curtida enviada!')
    } catch {
      toast.error('Erro ao enviar curtida.')
    }
    setLikedBack((prev) => new Set(Array.from(prev).concat(profileId)))
  }

  const FAKE_COUNT = 6

  return (
    <div className="min-h-screen font-jakarta pb-24" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), #08090E' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#08090E]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Heart size={18} className="text-[#E11D48]" />
          <h1 className="font-fraunces text-xl text-white">Quem curtiu você</h1>
        </div>
        {canSee && !loading && likers.length > 0 && (
          <span className="text-white/35 text-sm shrink-0">
            {likers.length} {likers.length === 1 ? 'curtida' : 'curtidas'}
          </span>
        )}
      </header>

      <div className="px-5 pt-5 space-y-5">

        {/* ── Essencial: grid borrado + paywall ── */}
        {!canSee && (
          <>
            {/* Contagem teaser */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E11D48]/8 border border-[#E11D48]/20">
              <div className="w-10 h-10 rounded-full bg-[#E11D48]/15 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-[#E11D48]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Pessoas curtiram seu perfil</p>
                <p className="text-white/40 text-xs mt-0.5">Faça upgrade para ver quem são</p>
              </div>
            </div>

            {/* Grid com blur pesado */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: FAKE_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]} relative overflow-hidden`}
                  >
                    {/* Silhueta */}
                    <div className="absolute bottom-0 inset-x-0 h-2/3 flex flex-col items-center justify-end pb-3 gap-1">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="w-14 h-2 rounded-full bg-white/10" />
                      <div className="w-10 h-1.5 rounded-full bg-white/6" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay de blur */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  background: 'rgba(14,11,20,0.45)',
                }}
              />
            </div>

            {/* PaywallCard */}
            <PaywallCard
              title="Veja quem curtiu você"
              description="Disponível a partir do plano Plus. Responda curtidas diretamente e aumente muito suas chances de match."
              ctaLabel="Assinar Plus"
            />
          </>
        )}

        {/* ── Plus / Black: grid real ── */}
        {canSee && (
          <>
            {loading || planLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : likers.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Heart size={44} className="text-white/10 mb-4" />
                <p className="text-white/40 font-medium">Nenhuma curtida ainda</p>
                <p className="text-white/25 text-sm mt-1">Continue navegando e os matches virão!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {likers.map((liker) => (
                  <LikerCard
                    key={liker.from_user}
                    liker={liker}
                    likedBack={likedBack.has(liker.from_user)}
                    onLikeBack={handleLikeBack}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

function LikerCard({
  liker,
  likedBack,
  onLikeBack,
}: {
  liker: LikerProfile
  likedBack: boolean
  onLikeBack: (id: string) => void
}) {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5">

      {/* Foto */}
      {liker.photo_best ? (
        <Image
          src={liker.photo_best}
          alt={liker.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-purple-900/40 flex items-center justify-center">
          <span className="text-white/20 text-4xl font-fraunces">{liker.name[0] ?? '?'}</span>
        </div>
      )}

      {/* Badge SuperLike */}
      {liker.type === 'superlike' && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow">
          <Star size={11} className="text-black" />
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-6 pb-2">
        <p className="text-white text-xs font-semibold truncate leading-tight">{liker.name}</p>
        {liker.city && (
          <p className="text-white/50 text-[10px] truncate">{liker.city}</p>
        )}
        <button
          onClick={() => onLikeBack(liker.from_user)}
          disabled={likedBack}
          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95 ${
            likedBack
              ? 'bg-white/10 text-white/30 cursor-default'
              : 'bg-[#E11D48] text-white hover:bg-[#be123c]'
          }`}
        >
          <Heart size={10} />
          {likedBack ? 'Curtido!' : 'Curtir'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ReportButton } from '@/components/ReportModal'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Heart, Star, X,
  Eye, Calendar, Ruler, Weight, Crown
} from 'lucide-react'

export default function VerPerfilPage() {
  const params = useParams()
  const profileId = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [filters, setFilters] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [swipeAction, setSwipeAction] = useState<'like' | 'dislike' | 'superlike' | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [viewedPlan, setViewedPlan] = useState<string | null>(null)
  const [viewerIsBlack, setViewerIsBlack] = useState(false)

  useEffect(() => {
    if (!profileId) return
    loadProfile()
  }, [profileId])

  async function loadProfile() {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    const { data: filtersData } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', profileId)
      .single()

    if (profileData && user) {
      // Calcular distância
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('lat, lng')
        .eq('id', user.id)
        .single()

      if (myProfile?.lat && profileData.lat) {
        const dist = calcDistance(myProfile.lat, myProfile.lng, profileData.lat, profileData.lng)
        setDistance(dist)
      }
    }

    setProfile(profileData)
    setFilters(filtersData)

    if (user) {
      // Verificar se quem está vendo é Black
      const { data: viewerSub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      const isBlack = viewerSub?.plan === 'black'
      setViewerIsBlack(isBlack)

      // Só busca o plano do perfil visitado se quem vê é Black
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

  async function handleSwipe(action: 'like' | 'dislike' | 'superlike') {
    if (!user) return
    setSwipeAction(action)

    if (action !== 'dislike') {
      await supabase.rpc('process_like', {
        p_user_id: user.id,
        p_target_id: profileId,
        p_is_superlike: action === 'superlike',
      })
    }

    setTimeout(() => router.back(), 800)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#b8f542] rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0e0b14] flex flex-col items-center justify-center gap-3 text-white/30">
        <p>Perfil não encontrado.</p>
        <button onClick={() => router.back()} className="text-[#b8f542] text-sm underline">Voltar</button>
      </div>
    )
  }

  const age = profile.birthdate
    ? Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / 31557600000)
    : null

  const photos = [
    profile.photo_best,
    profile.photo_face,
    profile.photo_body,
    profile.photo_side,
    profile.photo_back,
    profile.photo_extra1,
    profile.photo_extra2,
    profile.photo_extra3,
    profile.photo_extra4,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-32">

      {/* ── Fotos ── */}
      <div className="relative h-[65vh] bg-black">
        {photos.length > 0 ? (
          <Image
            src={photos[activePhoto]}
            alt={profile.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-white/20 text-6xl">?</div>
        )}

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b14] via-transparent to-black/30" />

        {/* Botão voltar */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Indicadores de foto */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`h-1 rounded-full transition-all ${
                  i === activePhoto ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Toque nas bordas para navegar */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-5"
              onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))}
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-5"
              onClick={() => setActivePhoto(Math.min(photos.length - 1, activePhoto + 1))}
            />
          </>
        )}

        {/* Nome e info básica */}
        <div className="absolute bottom-6 left-5 right-5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-fraunces text-3xl text-white font-bold">
              {profile.name}{age ? `, ${age}` : ''}
            </h1>
            {/* Badge de plano — só Black vê, só aparece se o visitado também for Black */}
            {viewerIsBlack && viewedPlan === 'black' && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-[#f5c842]/40 bg-[#f5c842]/10 text-[#f5c842]">
                <Crown size={11} />
                Camarote
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {distance !== null && (
              <span className="flex items-center gap-1 text-white/60 text-sm">
                <MapPin size={13} />
                {distance < 1 ? 'menos de 1 km' : `${distance.toFixed(1)} km`}
              </span>
            )}
            {profile.city && (
              <span className="text-white/40 text-sm">{profile.city}, {profile.state}</span>
            )}
          </div>
        </div>

        {/* Overlay de swipe */}
        {swipeAction && (
          <div className={`absolute inset-0 z-20 flex items-center justify-center ${
            swipeAction === 'like' ? 'bg-[#b8f542]/20' :
            swipeAction === 'superlike' ? 'bg-blue-500/20' :
            'bg-red-500/20'
          }`}>
            <div className={`border-4 rounded-2xl px-6 py-3 rotate-[-15deg] ${
              swipeAction === 'like' ? 'border-[#b8f542]' :
              swipeAction === 'superlike' ? 'border-blue-400' :
              'border-red-500'
            }`}>
              <span className={`font-black text-3xl tracking-widest ${
                swipeAction === 'like' ? 'text-[#b8f542]' :
                swipeAction === 'superlike' ? 'text-blue-400' :
                'text-red-500'
              }`}>
                {swipeAction === 'like' ? 'CURTIR' : swipeAction === 'superlike' ? 'SUPER' : 'NOPE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="px-5 pt-5 space-y-6">

        {/* Bio */}
        {profile.bio && (
          <div>
            <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-3">
          {filters?.height_cm && (
            <StatCard icon={<Ruler size={14} />} label="Altura" value={`${filters.height_cm} cm`} />
          )}
          {filters?.weight_kg && (
            <StatCard icon={<Weight size={14} />} label="Peso" value={`${filters.weight_kg} kg`} />
          )}
          {profile.gender && (
            <StatCard icon={<Eye size={14} />} label="Gênero" value={profile.gender} />
          )}
          {profile.birthdate && (
            <StatCard icon={<Calendar size={14} />} label="Idade" value={`${age} anos`} />
          )}
        </div>

        {/* Tags do perfil */}
        {filters && (
          <>
            <TagSection title="Aparência" tags={getAparenciaTags(filters)} />
            <TagSection title="Estilo de vida" tags={getEstiloTags(filters)} />
            <TagSection title="Personalidade" tags={getPersonalidadeTags(filters)} />
            <TagSection title="O que busca" tags={getObjetivosTags(filters)} />
          </>
        )}

        {/* Denunciar */}
        <div className="flex justify-center pt-2 pb-4">
          <ReportButton reportedId={profileId} reportedName={profile.name} />
        </div>
      </div>

      {/* ── Botões de ação fixos ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0e0b14]/95 backdrop-blur border-t border-white/5 px-6 py-4 flex items-center justify-center gap-5">
        <button
          onClick={() => handleSwipe('dislike')}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition active:scale-90"
        >
          <X size={26} className="text-red-400" />
        </button>

        <button
          onClick={() => handleSwipe('superlike')}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/40 transition active:scale-90"
        >
          <Star size={20} className="text-blue-400" />
        </button>

        <button
          onClick={() => handleSwipe('like')}
          className="w-16 h-16 rounded-full bg-[#b8f542]/10 border border-[#b8f542]/30 flex items-center justify-center hover:bg-[#b8f542]/20 transition active:scale-90"
        >
          <Heart size={26} className="text-[#b8f542]" fill="#b8f542" />
        </button>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/5">
      <span className="text-white/30">{icon}</span>
      <div>
        <p className="text-white/30 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function TagSection({ title, tags }: { title: string; tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getAparenciaTags(f: any): string[] {
  const tags: string[] = []
  if (f.eye_black) tags.push('Olhos pretos')
  if (f.eye_brown) tags.push('Olhos castanhos')
  if (f.eye_green) tags.push('Olhos verdes')
  if (f.eye_blue) tags.push('Olhos azuis')
  if (f.eye_honey) tags.push('Olhos mel')
  if (f.hair_black) tags.push('Cabelo preto')
  if (f.hair_brown) tags.push('Cabelo castanho')
  if (f.hair_blonde) tags.push('Cabelo loiro')
  if (f.hair_curly) tags.push('Cabelo cacheado')
  if (f.hair_coily) tags.push('Cabelo crespo')
  if (f.skin_white) tags.push('Pele branca')
  if (f.skin_black) tags.push('Pele negra')
  if (f.skin_mixed) tags.push('Parda')
  if (f.feat_tattoo) tags.push('Tatuagem')
  if (f.feat_piercing) tags.push('Piercing')
  if (f.feat_beard) tags.push('Barba')
  if (f.feat_glasses) tags.push('Óculos')
  return tags
}

function getEstiloTags(f: any): string[] {
  const tags: string[] = []
  if (f.smoke_no) tags.push('Não fuma')
  if (f.smoke_yes) tags.push('Fumante')
  if (f.drink_no) tags.push('Não bebe')
  if (f.drink_socially) tags.push('Bebe socialmente')
  if (f.routine_gym) tags.push('Academia')
  if (f.routine_homebody) tags.push('Caseiro(a)')
  if (f.routine_party) tags.push('Balada')
  if (f.routine_morning) tags.push('Matutino(a)')
  if (f.routine_night_owl) tags.push('Noturno(a)')
  if (f.hob_gamer) tags.push('Gamer')
  if (f.hob_travel) tags.push('Viajante')
  if (f.hob_reader) tags.push('Leitor(a)')
  if (f.diet_vegan) tags.push('Vegano(a)')
  if (f.diet_vegetarian) tags.push('Vegetariano(a)')
  return tags
}

function getPersonalidadeTags(f: any): string[] {
  const tags: string[] = []
  if (f.pers_extrovert) tags.push('Extrovertido(a)')
  if (f.pers_introvert) tags.push('Introvertido(a)')
  if (f.pers_calm) tags.push('Calmo(a)')
  if (f.pers_intense) tags.push('Intenso(a)')
  if (f.pers_communicative) tags.push('Comunicativo(a)')
  if (f.pers_shy) tags.push('Tímido(a)')
  if (f.rel_evangelical) tags.push('Evangélico(a)')
  if (f.rel_catholic) tags.push('Católico(a)')
  if (f.rel_atheist) tags.push('Ateu/Ateia')
  if (f.kids_has) tags.push('Tem filhos')
  if (f.kids_no) tags.push('Sem filhos')
  if (f.pet_dog) tags.push('Tem cachorro')
  if (f.pet_cat) tags.push('Tem gato')
  return tags
}

function getObjetivosTags(f: any): string[] {
  const tags: string[] = []
  if (f.obj_serious) tags.push('Relacionamento sério')
  if (f.obj_casual) tags.push('Relacionamento casual')
  if (f.obj_friendship) tags.push('Amizade')
  if (f.obj_open) tags.push('Aberto a experiências')
  if (f.obj_sugar_baby) tags.push('Sugar Baby')
  if (f.obj_sugar_daddy) tags.push('Sugar Daddy/Mommy')
  return tags
}
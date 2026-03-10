'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
// ✅ CORREÇÃO: import correto — não usar @/lib/supabase/client
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Heart, Star, X,
  Eye, Calendar, Ruler, Weight, Crown, ShieldAlert
} from 'lucide-react'

export default function VerPerfilPage() {
  const params = useParams()
  const profileId = params.id as string
  const router = useRouter()

  // ✅ CORREÇÃO: buscar user via supabase.auth em vez de hook useAuth que pode não existir
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!profileId || !userId) return
    loadProfile()
  }, [profileId, userId])

  async function loadProfile() {
    setLoading(true)

    // ✅ CORREÇÃO: NUNCA selecionar lat/lng/cep/rua/bairro em selects públicos
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, birthdate, bio, gender, pronouns, city, state, photo_face, photo_body, photo_side, photo_back, photo_best, photo_extra1, photo_extra2, photo_extra3, photo_extra4, photo_extra5')
      .eq('id', profileId)
      .single()

    const { data: filtersData } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', profileId)
      .single()

    // Calcular distância usando apenas lat/lng do próprio user (não expor do outro)
    if (profileData && userId) {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('lat, lng')
        .eq('id', userId)
        .single()

      // ✅ CORREÇÃO: buscar lat/lng do perfil visitado via RPC separada (não expõe no select público)
      const { data: targetGeo } = await supabase
        .rpc('get_user_distance', { p_from: userId, p_to: profileId })

      if (targetGeo !== null) {
        setDistance(targetGeo)
      } else if (myProfile?.lat && filtersData) {
        // fallback: se não tiver RPC, não mostra distância
        setDistance(null)
      }
    }

    setProfile(profileData)
    setFilters(filtersData)

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

  async function handleSwipe(action: 'like' | 'dislike' | 'superlike') {
    if (!userId) return
    setSwipeAction(action)

    if (action === 'dislike') {
      // ✅ CORREÇÃO: salva dislike no banco via RPC (mesma que useSwipe usa)
      await supabase.rpc('process_swipe', {
        p_from: userId,
        p_to: profileId,
        p_type: 'dislike',
      })
    } else {
      await supabase.rpc('process_swipe', {
        p_from: userId,
        p_to: profileId,
        p_type: action === 'superlike' ? 'superlike' : 'like',
      })
    }

    setTimeout(() => router.back(), 800)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8f542', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Perfil não encontrado.</p>
        <button onClick={() => router.back()} style={{ color: '#b8f542', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>Voltar</button>
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
    profile.photo_extra5,
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', fontFamily: 'var(--font-jakarta)', paddingBottom: '120px' }}>

      {/* ── Fotos ── */}
      <div style={{ position: 'relative', height: '65vh', backgroundColor: '#000' }}>
        {photos.length > 0 ? (
          <Image
            src={photos[activePhoto]}
            alt={profile.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '64px' }}>?</div>
        )}

        {/* Gradiente */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e0b14 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }} />

        {/* Botão voltar */}
        <button onClick={() => router.back()} style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Botão de emergência oculto */}
        <button
          onClick={() => setEmergencyModal(true)}
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          title="Emergência"
        >
          <ShieldAlert size={18} color="rgba(255,255,255,0.25)" />
        </button>

        {/* Modal de Emergência */}
        {emergencyModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}
            onClick={() => setEmergencyModal(false)}
          >
            <div
              style={{ backgroundColor: '#1a0a0a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '28px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={28} color="#f87171" />
              </div>
              <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Você está em perigo?</h3>
              <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Esta ação ligará imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.7)' }}>Polícia Militar (190)</strong>. Use apenas em situações de risco real.
              </p>
              <a
                href="tel:190"
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '16px', textDecoration: 'none', marginBottom: '12px' }}
              >
                Ligar 190 agora
              </a>
              <button
                onClick={() => setEmergencyModal(false)}
                style={{ display: 'block', width: '100%', padding: '12px', background: 'none', border: 'none', color: 'rgba(248,249,250,0.3)', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Indicadores de foto */}
        {photos.length > 1 && (
          <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
            {photos.map((_: any, i: number) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                style={{ height: '4px', borderRadius: '100px', border: 'none', cursor: 'pointer', backgroundColor: i === activePhoto ? '#fff' : 'rgba(255,255,255,0.4)', width: i === activePhoto ? '24px' : '6px', transition: 'all 0.2s' }} />
            ))}
          </div>
        )}

        {/* Toque nas bordas para navegar */}
        {photos.length > 1 && (
          <>
            <button style={{ position: 'absolute', left: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))} />
            <button style={{ position: 'absolute', right: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActivePhoto(Math.min(photos.length - 1, activePhoto + 1))} />
          </>
        )}

        {/* Nome e info básica */}
        <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '30px', color: '#fff', fontWeight: 700, margin: 0 }}>
              {profile.name}{age ? `, ${age}` : ''}
            </h1>
            {/* Badge de plano — só Black vê, só aparece se o visitado também for Black */}
            {viewerIsBlack && viewedPlan === 'black' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(245,200,66,0.4)', backgroundColor: 'rgba(245,200,66,0.1)', color: '#f5c842' }}>
                <Crown size={11} /> Camarote
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            {distance !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                <MapPin size={13} />
                {distance < 1 ? 'menos de 1 km' : `${distance.toFixed(1)} km`}
              </span>
            )}
            {profile.city && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{profile.city}, {profile.state}</span>
            )}
          </div>
        </div>

        {/* Overlay de swipe */}
        {swipeAction && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: swipeAction === 'like' ? 'rgba(184,245,66,0.2)' : swipeAction === 'superlike' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)' }}>
            <div style={{ border: `4px solid ${swipeAction === 'like' ? '#b8f542' : swipeAction === 'superlike' ? '#60a5fa' : '#ef4444'}`, borderRadius: '16px', padding: '12px 24px', transform: 'rotate(-15deg)' }}>
              <span style={{ fontWeight: 900, fontSize: '30px', letterSpacing: '4px', color: swipeAction === 'like' ? '#b8f542' : swipeAction === 'superlike' ? '#60a5fa' : '#ef4444' }}>
                {swipeAction === 'like' ? 'CURTIR' : swipeAction === 'superlike' ? 'SUPER' : 'NOPE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Bio */}
        {profile.bio && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
        )}

        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {filters?.height_cm && <StatCard icon={<Ruler size={14} />} label="Altura" value={`${filters.height_cm} cm`} />}
          {filters?.weight_kg && <StatCard icon={<Weight size={14} />} label="Peso" value={`${filters.weight_kg} kg`} />}
          {profile.gender && <StatCard icon={<Eye size={14} />} label="Gênero" value={profile.gender} />}
          {age && <StatCard icon={<Calendar size={14} />} label="Idade" value={`${age} anos`} />}
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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
          <button
            onClick={() => {/* TODO: abrir modal de denúncia */}}
            style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer' }}>
            🚩 Denunciar perfil
          </button>
        </div>
      </div>

      {/* ── Botões de ação fixos ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(14,11,20,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <button onClick={() => handleSwipe('dislike')} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
          <X size={26} color="#f87171" />
        </button>
        <button onClick={() => handleSwipe('superlike')} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
          <Star size={20} color="#60a5fa" />
        </button>
        <button onClick={() => handleSwipe('like')} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(184,245,66,0.1)', border: '1px solid rgba(184,245,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
          <Heart size={26} color="#b8f542" fill="#b8f542" />
        </button>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{label}</p>
        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function TagSection({ title, tags }: { title: string; tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div>
      <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tags.map((tag) => (
          <span key={tag} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

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

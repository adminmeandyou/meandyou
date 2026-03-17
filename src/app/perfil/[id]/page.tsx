'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
// CORRECAO: import correto — nao usar @/lib/supabase/client
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Heart, Star, X,
  Eye, Calendar, Ruler, Weight, Crown, ShieldAlert, Award
} from 'lucide-react'
import { SwipeButton } from '@/components/ui/SwipeButton'
import { BadgePill } from '@/components/ui/BadgePill'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

// ─── Trust Score ──────────────────────────────────────────────────────────────

function calcTrustScore(profile: any, photos: string[], filters: any): number {
  let s = 0
  s += Math.min(photos.length * 8, 48)
  if (profile.bio && profile.bio.length > 30) s += 20
  if (profile.highlight_tags?.length > 0) s += 12
  if (filters) s += 10
  if (photos.length >= 5) s += 10
  return Math.min(s, 100)
}

// ─── Conquistas ───────────────────────────────────────────────────────────────

function getConquistas(profile: any, photos: string[]): { emoji: string; label: string }[] {
  const list: { emoji: string; label: string }[] = []
  if (photos.length >= 9) list.push({ emoji: '⭐', label: 'Perfil completo' })
  else if (photos.length >= 5) list.push({ emoji: '📸', label: 'Galeria rica' })
  if (profile.bio?.length > 100) list.push({ emoji: '✍️', label: 'Bio detalhada' })
  if (profile.highlight_tags?.length > 0) list.push({ emoji: '🏷️', label: 'Tags escolhidas' })
  return list
}

// ─── Status Pills ─────────────────────────────────────────────────────────────

interface StatusPill { label: string; bg: string; color: string }

function getStatusPills(userRow: any): StatusPill[] {
  if (!userRow) return []
  const pills: StatusPill[] = []
  const now = Date.now()
  const lastActive = userRow.last_active_at ? new Date(userRow.last_active_at).getTime() : 0
  const createdAt = userRow.created_at ? new Date(userRow.created_at).getTime() : 0
  if (lastActive && (now - lastActive) < 5 * 60 * 1000) {
    pills.push({ label: 'Online agora', bg: 'rgba(16,185,129,0.18)', color: '#10b981' })
  } else if (lastActive && (now - lastActive) < 24 * 60 * 60 * 1000) {
    pills.push({ label: 'Ativo hoje', bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' })
  }
  if (userRow.verified) {
    pills.push({ label: 'Verificado', bg: 'rgba(225,29,72,0.18)', color: '#F43F5E' })
  }
  if (createdAt && (now - createdAt) < 7 * 24 * 60 * 60 * 1000) {
    pills.push({ label: 'Novo no app', bg: 'rgba(96,165,250,0.18)', color: '#60a5fa' })
  }
  return pills.slice(0, 4)
}

// ─── Pixel Art SVGs ───────────────────────────────────────────────────────────

function PixelShield({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="1" y="0" width="6" height="1" fill={color}/>
      <rect x="0" y="1" width="8" height="1" fill={color}/>
      <rect x="0" y="2" width="2" height="3" fill={color}/>
      <rect x="6" y="2" width="2" height="3" fill={color}/>
      <rect x="0" y="5" width="8" height="1" fill={color}/>
      <rect x="1" y="6" width="6" height="1" fill={color}/>
      <rect x="2" y="7" width="4" height="1" fill={color}/>
      <rect x="3" y="3" width="1" height="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="4" y="2" width="1" height="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="2" y="4" width="1" height="1" fill="rgba(255,255,255,0.6)"/>
    </svg>
  )
}

function PixelCrown({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="0" y="0" width="1" height="1" fill={color}/>
      <rect x="4" y="0" width="1" height="1" fill={color}/>
      <rect x="7" y="0" width="1" height="1" fill={color}/>
      <rect x="0" y="1" width="1" height="2" fill={color}/>
      <rect x="3" y="1" width="2" height="1" fill={color}/>
      <rect x="7" y="1" width="1" height="2" fill={color}/>
      <rect x="1" y="2" width="1" height="1" fill={color}/>
      <rect x="6" y="2" width="1" height="1" fill={color}/>
      <rect x="0" y="3" width="8" height="1" fill={color}/>
      <rect x="0" y="4" width="8" height="3" fill={color}/>
      <rect x="1" y="7" width="6" height="1" fill={color}/>
    </svg>
  )
}

function PixelCamera({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="2" y="0" width="1" height="1" fill={color}/>
      <rect x="3" y="0" width="3" height="1" fill={color}/>
      <rect x="0" y="1" width="8" height="6" fill={color}/>
      <rect x="0" y="7" width="8" height="1" fill={color}/>
      <rect x="2" y="2" width="4" height="4" fill="rgba(0,0,0,0.4)"/>
      <rect x="3" y="3" width="2" height="2" fill="rgba(255,255,255,0.5)"/>
    </svg>
  )
}

function PixelScroll({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="1" y="0" width="6" height="8" fill={color}/>
      <rect x="0" y="1" width="1" height="6" fill={color}/>
      <rect x="2" y="2" width="4" height="1" fill="rgba(0,0,0,0.35)"/>
      <rect x="2" y="4" width="3" height="1" fill="rgba(0,0,0,0.35)"/>
      <rect x="2" y="6" width="2" height="1" fill="rgba(0,0,0,0.35)"/>
    </svg>
  )
}

function PixelTag({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="0" y="0" width="5" height="1" fill={color}/>
      <rect x="0" y="1" width="7" height="1" fill={color}/>
      <rect x="0" y="2" width="8" height="1" fill={color}/>
      <rect x="0" y="3" width="8" height="1" fill={color}/>
      <rect x="0" y="4" width="8" height="1" fill={color}/>
      <rect x="0" y="5" width="7" height="1" fill={color}/>
      <rect x="0" y="6" width="5" height="1" fill={color}/>
      <rect x="5" y="2" width="1" height="1" fill="rgba(0,0,0,0.45)"/>
    </svg>
  )
}

function PixelHeart({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="1" y="0" width="2" height="1" fill={color}/>
      <rect x="5" y="0" width="2" height="1" fill={color}/>
      <rect x="0" y="1" width="4" height="2" fill={color}/>
      <rect x="4" y="1" width="4" height="2" fill={color}/>
      <rect x="0" y="3" width="8" height="2" fill={color}/>
      <rect x="1" y="5" width="6" height="1" fill={color}/>
      <rect x="2" y="6" width="4" height="1" fill={color}/>
      <rect x="3" y="7" width="2" height="1" fill={color}/>
    </svg>
  )
}

function PixelZap({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="3" y="0" width="4" height="1" fill={color}/>
      <rect x="2" y="1" width="4" height="1" fill={color}/>
      <rect x="1" y="2" width="4" height="1" fill={color}/>
      <rect x="2" y="3" width="5" height="1" fill={color}/>
      <rect x="1" y="4" width="5" height="1" fill={color}/>
      <rect x="2" y="5" width="4" height="1" fill={color}/>
      <rect x="1" y="6" width="3" height="1" fill={color}/>
      <rect x="1" y="7" width="2" height="1" fill={color}/>
    </svg>
  )
}

function PixelStar({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="3" y="0" width="2" height="2" fill={color}/>
      <rect x="0" y="2" width="8" height="2" fill={color}/>
      <rect x="1" y="4" width="6" height="1" fill={color}/>
      <rect x="0" y="5" width="3" height="2" fill={color}/>
      <rect x="5" y="5" width="3" height="2" fill={color}/>
      <rect x="2" y="7" width="1" height="1" fill={color}/>
      <rect x="5" y="7" width="1" height="1" fill={color}/>
    </svg>
  )
}

// ─── Emblemas ─────────────────────────────────────────────────────────────────

interface EmblemaDef {
  id: string
  name: string
  raridade: 'comum' | 'incomum' | 'raro' | 'lendario'
  desc: string
  desbloqueado: boolean
  progresso: number
  total: number
  pixel: React.ReactNode
}

function getEmblemas(profile: any, photos: string[], filters: any, userRow: any): EmblemaDef[] {
  return [
    {
      id: 'verificado',
      name: 'Identidade Verificada',
      raridade: 'raro',
      desc: 'Confirmou identidade com selfie biometrica. Perfil 100% autentico.',
      desbloqueado: !!userRow?.verified,
      progresso: userRow?.verified ? 1 : 0,
      total: 1,
      pixel: <PixelShield color="#a78bfa" />,
    },
    {
      id: 'perfil_completo',
      name: 'Perfil Completo',
      raridade: 'raro',
      desc: 'Preencheu todas as 9 fotos do perfil. Comprometimento real!',
      desbloqueado: photos.length >= 9,
      progresso: photos.length,
      total: 9,
      pixel: <PixelCrown color="#a78bfa" />,
    },
    {
      id: 'galeria_rica',
      name: 'Galeria Rica',
      raridade: 'incomum',
      desc: 'Tem 5 ou mais fotos no perfil. Mais chances de conexao!',
      desbloqueado: photos.length >= 5,
      progresso: photos.length,
      total: 5,
      pixel: <PixelCamera color="#60a5fa" />,
    },
    {
      id: 'bio_detalhada',
      name: 'Bio Detalhada',
      raridade: 'incomum',
      desc: 'Escreveu uma bio com mais de 100 caracteres. Se importa em contar a historia.',
      desbloqueado: (profile?.bio?.length ?? 0) >= 100,
      progresso: Math.min(profile?.bio?.length ?? 0, 100),
      total: 100,
      pixel: <PixelScroll color="#60a5fa" />,
    },
    {
      id: 'tags_escolhidas',
      name: 'Tags Escolhidas',
      raridade: 'comum',
      desc: 'Preencheu as tags de destaque do perfil.',
      desbloqueado: (profile?.highlight_tags?.length ?? 0) > 0,
      progresso: profile?.highlight_tags?.length ?? 0,
      total: 3,
      pixel: <PixelTag color="rgba(248,249,250,0.70)" />,
    },
    {
      id: 'match_maker',
      name: 'Match Maker',
      raridade: 'lendario',
      desc: 'Conquistou mais de 50 matches. Um verdadeiro iman de conexoes!',
      desbloqueado: false,
      progresso: 0,
      total: 50,
      pixel: <PixelHeart color="#F59E0B" />,
    },
    {
      id: 'conversador',
      name: 'Conversador',
      raridade: 'incomum',
      desc: 'Manteve conversas ativas por mais de 7 dias.',
      desbloqueado: false,
      progresso: 0,
      total: 7,
      pixel: <PixelZap color="#60a5fa" />,
    },
    {
      id: 'popular',
      name: 'Muito Popular',
      raridade: 'lendario',
      desc: 'Recebeu mais de 100 curtidas. O perfil fala por si!',
      desbloqueado: false,
      progresso: 0,
      total: 100,
      pixel: <PixelStar color="#F59E0B" />,
    },
  ]
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function VerPerfilPage() {
  const params = useParams()
  const profileId = params.id as string
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  // CORRECAO: buscar user via supabase.auth em vez de hook useAuth que pode nao existir
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
  const [denunciaCategoria, setDenunciaCategoria] = useState('')
  const [denunciaTexto, setDenunciaTexto] = useState('')
  const [denunciaEnviando, setDenunciaEnviando] = useState(false)
  const [denunciaEnviado, setDenunciaEnviado] = useState(false)
  const [userRow, setUserRow] = useState<any>(null)
  const [selectedBadge, setSelectedBadge] = useState<EmblemaDef | null>(null)

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

    // CORRECAO: NUNCA selecionar lat/lng/cep/rua/bairro em selects publicos
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, birthdate, bio, gender, pronouns, city, state, photo_face, photo_body, photo_side, photo_back, photo_best, photo_extra1, photo_extra2, photo_extra3, photo_extra4, photo_extra5, highlight_tags')
      .eq('id', profileId)
      .single()

    const { data: filtersData } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', profileId)
      .single()

    // Calcular distancia usando apenas lat/lng do proprio user (nao expor do outro)
    if (profileData && userId) {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('lat, lng')
        .eq('id', userId)
        .single()

      // CORRECAO: buscar lat/lng do perfil visitado via RPC separada (nao expoe no select publico)
      const { data: targetGeo } = await supabase
        .rpc('get_user_distance', { p_from: userId, p_to: profileId })

      if (targetGeo !== null) {
        setDistance(targetGeo)
      } else if (myProfile?.lat && filtersData) {
        // fallback: se nao tiver RPC, nao mostra distancia
        setDistance(null)
      }
    }

    setProfile(profileData)
    setFilters(filtersData)

    // Busca dados de status para StatusPills
    const { data: userData } = await supabase
      .from('users')
      .select('verified, last_active_at, created_at')
      .eq('id', profileId)
      .single()
    setUserRow(userData)

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

    if (action === 'superlike') {
      haptics.success()
    } else if (action === 'like') {
      haptics.medium()
    } else {
      haptics.tap()
    }

    if (action === 'dislike') {
      // CORRECAO: salva dislike no banco via RPC (mesma que useSwipe usa)
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

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.08)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ color: 'rgba(248,249,250,0.30)', fontFamily: 'var(--font-jakarta)' }}>Perfil nao encontrado.</p>
        <button onClick={() => router.back()} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', fontFamily: 'var(--font-jakarta)' }}>Voltar</button>
      </div>
    )
  }

  // ─── Dados derivados ────────────────────────────────────────────────────────

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
  ].filter(Boolean) as string[]

  const trustScore = calcTrustScore(profile, photos, filters)
  const conquistas = getConquistas(profile, photos)
  const statusPills = getStatusPills(userRow)
  const emblemas = getEmblemas(profile, photos, filters, userRow)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#08090E', fontFamily: 'var(--font-jakarta)', paddingBottom: '100px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Hero foto ── */}
      <div style={{ position: 'relative', height: '65vh', backgroundColor: '#000' }}>

        {/* Imagem */}
        {photos.length > 0 ? (
          <Image
            src={photos[activePhoto]}
            alt={profile.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,249,250,0.15)', fontSize: '64px' }}>?</div>
        )}

        {/* Gradiente escuro na base */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #08090E 0%, rgba(8,9,14,0.4) 40%, transparent 70%)' }} />

        {/* Barra de progresso de fotos */}
        {photos.length > 1 && (
          <div style={{ position: 'absolute', top: '12px', left: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '4px' }}>
            {photos.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: i === activePhoto ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
                  padding: 0,
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        )}

        {/* Botao voltar */}
        <button
          onClick={() => router.back()}
          style={{ position: 'absolute', top: '28px', left: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} color="#fff" strokeWidth={1.5} />
        </button>

        {/* Botao emergencia */}
        <button
          onClick={() => setEmergencyModal(true)}
          style={{ position: 'absolute', top: '28px', right: '16px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
          title="Emergencia"
        >
          <ShieldAlert size={17} color="rgba(255,255,255,0.22)" strokeWidth={1.5} />
        </button>

        {/* Toque nas bordas para navegar */}
        {photos.length > 1 && (
          <>
            <button style={{ position: 'absolute', left: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))} />
            <button style={{ position: 'absolute', right: 0, top: 0, width: '33%', height: '100%', zIndex: 5, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActivePhoto(Math.min(photos.length - 1, activePhoto + 1))} />
          </>
        )}

        {/* StatusPills flutuantes */}
        {statusPills.length > 0 && (
          <div style={{ position: 'absolute', bottom: '106px', left: '16px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {statusPills.map((pill, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: pill.bg, color: pill.color, backdropFilter: 'blur(8px)', border: `1px solid ${pill.color}33`, letterSpacing: '0.01em', fontFamily: 'var(--font-jakarta)' }}>
                {pill.label === 'Online agora' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: pill.color, marginRight: '5px', display: 'inline-block' }} />}
                {pill.label}
              </span>
            ))}
          </div>
        )}

        {/* Overlay nome na foto */}
        <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: '#fff', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {profile.name}{age ? `, ${age}` : ''}
            </h1>
            {/* Badge Camarote — so Black ve, so aparece se o visitado tambem for Black */}
            {viewerIsBlack && viewedPlan === 'black' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(245,158,11,0.40)', backgroundColor: 'rgba(245,158,11,0.10)', color: '#F59E0B' }}>
                <Crown size={10} strokeWidth={2} /> Camarote
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {distance !== null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
                <MapPin size={12} strokeWidth={1.5} />
                {distance < 1 ? 'menos de 1 km' : `${distance.toFixed(1)} km`}
              </span>
            )}
            {profile.city && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px' }}>{profile.city}, {profile.state}</span>
            )}
          </div>
        </div>

        {/* Overlay de swipe */}
        {swipeAction && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: swipeAction === 'like' ? 'rgba(16,185,129,0.18)' : swipeAction === 'superlike' ? 'rgba(96,165,250,0.18)' : 'rgba(225,29,72,0.18)' }}>
            <div style={{ border: `4px solid ${swipeAction === 'like' ? '#10b981' : swipeAction === 'superlike' ? '#60a5fa' : '#E11D48'}`, borderRadius: '16px', padding: '12px 24px', transform: 'rotate(-15deg)' }}>
              <span style={{ fontWeight: 900, fontSize: '28px', letterSpacing: '4px', color: swipeAction === 'like' ? '#10b981' : swipeAction === 'superlike' ? '#60a5fa' : '#E11D48', fontFamily: 'var(--font-fraunces)' }}>
                {swipeAction === 'like' ? 'CURTIR' : swipeAction === 'superlike' ? 'SUPER' : 'NOPE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Conteudo ── */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Bio */}
        {profile.bio && (
          <p style={{ color: 'rgba(248,249,250,0.80)', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>{profile.bio}</p>
        )}

        {/* Trust Score */}
        <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(248,249,250,0.50)', fontWeight: 500, letterSpacing: '0.02em' }}>Confianca do perfil</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8F9FA' }}>{trustScore}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trustScore}%`, borderRadius: '100px', backgroundColor: 'var(--accent)', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Vitrine de Emblemas */}
        <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={14} color="rgba(248,249,250,0.50)" strokeWidth={1.5} />
              <span style={{ fontSize: '12px', color: 'rgba(248,249,250,0.50)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Emblemas</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)' }}>{emblemas.filter(e => e.desbloqueado).length}/{emblemas.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {emblemas.map((emblema) => (
              <button
                key={emblema.id}
                onClick={() => setSelectedBadge(emblema)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: emblema.desbloqueado ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${emblema.desbloqueado ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.15s' }}>
                  <div style={{ opacity: emblema.desbloqueado ? 1 : 0.20, imageRendering: 'pixelated' }}>
                    {emblema.pixel}
                  </div>
                  {!emblema.desbloqueado && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,14,0.55)' }}>
                      <span style={{ fontSize: '16px', opacity: 0.4 }}>🔒</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '9px', color: emblema.desbloqueado ? 'rgba(248,249,250,0.60)' : 'rgba(248,249,250,0.25)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3, maxWidth: '52px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {emblema.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats rapidos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {filters?.height_cm && <StatCard icon={<Ruler size={14} strokeWidth={1.5} />} label="Altura" value={`${filters.height_cm} cm`} />}
          {filters?.weight_kg && <StatCard icon={<Weight size={14} strokeWidth={1.5} />} label="Peso" value={`${filters.weight_kg} kg`} />}
          {profile.gender && <StatCard icon={<Eye size={14} strokeWidth={1.5} />} label="Genero" value={profile.gender} />}
          {age && <StatCard icon={<Calendar size={14} strokeWidth={1.5} />} label="Idade" value={`${age} anos`} />}
        </div>

        {/* Tags do perfil */}
        {profile.highlight_tags?.length > 0 ? (
          <TagSection title="Destaques" tags={profile.highlight_tags} />
        ) : filters && (
          <>
            <TagSection title="Aparencia" tags={getAparenciaTags(filters)} />
            <TagSection title="Estilo de vida" tags={getEstiloTags(filters)} />
            <TagSection title="Personalidade" tags={getPersonalidadeTags(filters)} />
            <TagSection title="O que busca" tags={getObjetivosTags(filters)} />
          </>
        )}

        {/* Denunciar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
          <button
            onClick={() => { setDenunciaModal(true); setDenunciaEnviado(false); setDenunciaCategoria(''); setDenunciaTexto('') }}
            style={{ color: 'rgba(248,249,250,0.30)', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
          >
            Denunciar perfil
          </button>
        </div>
      </div>

      {/* ── Action bar fixa (sticky FABs) ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 30 }}>
        <SwipeButton variant="danger" size="lg" onClick={() => handleSwipe('dislike')} icon={<X size={26} strokeWidth={1.5} />} />
        <SwipeButton variant="info" size="md" onClick={() => handleSwipe('superlike')} icon={<Star size={20} strokeWidth={1.5} />} />
        <SwipeButton variant="primary" size="lg" onClick={() => handleSwipe('like')} icon={<Heart size={26} strokeWidth={1.5} />} />
      </div>

      {/* ── Modal Pokédex ── */}
      {selectedBadge && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '24px' }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '28px 24px', maxWidth: '340px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Pixel art grande + fundo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: selectedBadge.desbloqueado ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ opacity: selectedBadge.desbloqueado ? 1 : 0.25, transform: 'scale(1.8)', imageRendering: 'pixelated' }}>
                  {selectedBadge.pixel}
                </div>
                {!selectedBadge.desbloqueado && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,14,0.65)' }}>
                    <span style={{ fontSize: '28px', opacity: 0.5 }}>🔒</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nome + raridade */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
                {selectedBadge.name}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                <BadgePill rarity={selectedBadge.raridade} />
                {selectedBadge.desbloqueado && (
                  <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '2px 8px', fontWeight: 600 }}>Desbloqueado</span>
                )}
              </div>
            </div>

            {/* Descricao */}
            <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: '14px', lineHeight: 1.65, textAlign: 'center', margin: '0 0 20px' }}>
              {selectedBadge.desc}
            </p>

            {/* Progresso */}
            {!selectedBadge.desbloqueado && selectedBadge.total > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.35)', fontWeight: 500 }}>Progresso</span>
                  <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.50)', fontWeight: 600 }}>{selectedBadge.progresso}/{selectedBadge.total}</span>
                </div>
                <div style={{ height: '4px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((selectedBadge.progresso / selectedBadge.total) * 100, 100)}%`, borderRadius: '100px', backgroundColor: 'var(--accent)', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', color: '#F8F9FA', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de Emergencia ── */}
      {emergencyModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}
          onClick={() => setEmergencyModal(false)}
        >
          <div
            style={{ backgroundColor: '#0F1117', border: '1px solid rgba(225,29,72,0.25)', borderRadius: '20px', padding: '28px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldAlert size={26} color="#E11D48" strokeWidth={1.5} />
            </div>
            <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>Voce esta em perigo?</h3>
            <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>
              Esta acao ligara imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.70)' }}>Policia Militar (190)</strong>. Use apenas em situacoes de risco real.
            </p>
            <a
              href="tel:190"
              style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '16px', textDecoration: 'none', marginBottom: '12px', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)' }}
            >
              Ligar 190 agora
            </a>
            <button
              onClick={() => setEmergencyModal(false)}
              style={{ display: 'block', width: '100%', padding: '12px', background: 'none', border: 'none', color: 'rgba(248,249,250,0.30)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de Denuncia ── */}
      {denunciaModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDenunciaModal(false)}
        >
          <div
            style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: '480px' }}
            onClick={e => e.stopPropagation()}
          >
            {denunciaEnviado ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <span style={{ fontSize: '22px' }}>✓</span>
                </div>
                <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>Denuncia enviada</h3>
                <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>Nossa equipe vai analisar e tomar as medidas necessarias. Obrigado por ajudar a manter a comunidade segura.</p>
                <button onClick={() => setDenunciaModal(false)} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Fechar</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Denunciar perfil</h3>
                  <button onClick={() => setDenunciaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={20} color="rgba(248,249,250,0.35)" strokeWidth={1.5} />
                  </button>
                </div>
                <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '13px', marginBottom: '14px', marginTop: 0 }}>Por que voce esta denunciando este perfil?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { id: 'fake', label: 'Perfil falso ou fotos enganosas' },
                    { id: 'inappropriate', label: 'Conteudo inapropriado' },
                    { id: 'harassment', label: 'Assedio ou comportamento abusivo' },
                    { id: 'spam', label: 'Spam ou golpe' },
                    { id: 'minor', label: 'Possivel menor de idade' },
                    { id: 'other', label: 'Outro motivo' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setDenunciaCategoria(cat.id)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${denunciaCategoria === cat.id ? 'rgba(225,29,72,0.40)' : 'rgba(255,255,255,0.07)'}`, backgroundColor: denunciaCategoria === cat.id ? 'rgba(225,29,72,0.08)' : 'rgba(255,255,255,0.04)', color: denunciaCategoria === cat.id ? 'var(--accent)' : 'rgba(248,249,250,0.65)', fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-jakarta)' }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={denunciaTexto}
                  onChange={e => setDenunciaTexto(e.target.value)}
                  placeholder="Detalhes adicionais (opcional)"
                  maxLength={500}
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#F8F9FA', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'var(--font-jakarta)', lineHeight: 1.6 }}
                />
                <button
                  disabled={!denunciaCategoria || denunciaEnviando}
                  onClick={async () => {
                    if (!denunciaCategoria || !userId) return
                    setDenunciaEnviando(true)
                    try {
                      const { data: { session } } = await supabase.auth.getSession()
                      await fetch('/api/denuncias', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
                        body: JSON.stringify({ reported_user_id: profileId, category: denunciaCategoria, description: denunciaTexto }),
                      })
                      setDenunciaEnviado(true)
                    } catch {
                      // silently ignore — denuncia pode ter falhado, mas nao exibimos erro ao user
                    } finally {
                      setDenunciaEnviando(false)
                    }
                  }}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: !denunciaCategoria ? 'rgba(255,255,255,0.05)' : 'var(--accent)', border: 'none', color: !denunciaCategoria ? 'rgba(248,249,250,0.25)' : '#fff', fontWeight: 700, fontSize: '15px', cursor: !denunciaCategoria ? 'not-allowed' : 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-jakarta)' }}
                >
                  {denunciaEnviando ? 'Enviando...' : 'Enviar denuncia'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ backgroundColor: '#0F1117', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span style={{ color: 'rgba(248,249,250,0.50)', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '11px', margin: '0 0 2px', fontWeight: 500 }}>{label}</p>
        <p style={{ color: '#F8F9FA', fontSize: '14px', fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function TagSection({ title, tags }: { title: string; tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div>
      <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(248,249,250,0.30)', marginBottom: '12px', marginTop: 0 }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tags.map((tag) => (
          <span key={tag} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.50)' }}>
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
  if (f.feat_glasses) tags.push('Oculos')
  return tags
}

function getEstiloTags(f: any): string[] {
  const tags: string[] = []
  if (f.smoke_no) tags.push('Nao fuma')
  if (f.smoke_yes) tags.push('Fumante')
  if (f.drink_no) tags.push('Nao bebe')
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
  if (f.pers_shy) tags.push('Timido(a)')
  if (f.rel_evangelical) tags.push('Evangelico(a)')
  if (f.rel_catholic) tags.push('Catolico(a)')
  if (f.rel_atheist) tags.push('Ateu/Ateia')
  if (f.kids_has) tags.push('Tem filhos')
  if (f.kids_no) tags.push('Sem filhos')
  if (f.pet_dog) tags.push('Tem cachorro')
  if (f.pet_cat) tags.push('Tem gato')
  return tags
}

function getObjetivosTags(f: any): string[] {
  const tags: string[] = []
  if (f.obj_serious) tags.push('Relacionamento serio')
  if (f.obj_casual) tags.push('Relacionamento casual')
  if (f.obj_friendship) tags.push('Amizade')
  if (f.obj_open) tags.push('Aberto a experiencias')
  if (f.obj_sugar_baby) tags.push('Sugar Baby')
  if (f.obj_sugar_daddy) tags.push('Sugar Daddy/Mommy')
  return tags
}

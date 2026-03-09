'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/app/lib/supabase'
import {
  SlidersHorizontal, X, Heart, Star, AlertCircle,
  Loader2, Lock, ChevronDown, ChevronUp, Check,
  MapPin, RotateCcw
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  age?: number
  photo_best?: string
  city?: string
  bio?: string
  distance_km?: number
}

interface FiltersState {
  search_max_distance_km: number
  search_min_age: number
  search_max_age: number
  search_gender: string
  [key: string]: boolean | number | string
}

const DEFAULT_FILTERS: FiltersState = {
  search_max_distance_km: 40,
  search_min_age: 18,
  search_max_age: 99,
  search_gender: 'all',
}

const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'cis_woman', label: 'Mulher' },
  { value: 'cis_man', label: 'Homem' },
  { value: 'trans_woman', label: 'Mulher Trans' },
  { value: 'trans_man', label: 'Homem Trans' },
  { value: 'nonbinary', label: 'Não-binário(a)' },
  { value: 'fluid', label: 'Gênero Fluido' },
]

const FILTER_CATEGORIES = [
  {
    id: 'objetivos', label: '🎯 O que busca', locked: false, required: true,
    groups: [{ label: 'Objetivos', options: [
      { key: 'obj_serious', label: 'Relacionamento sério' },
      { key: 'obj_casual', label: 'Relacionamento casual' },
      { key: 'obj_friendship', label: 'Amizade' },
      { key: 'obj_events', label: 'Companhia para eventos' },
      { key: 'obj_conjugal', label: 'Relação conjugal' },
      { key: 'obj_open', label: 'Aberto(a) a experiências' },
      { key: 'obj_undefined', label: 'Qualquer / Ainda definindo' },
    ]}]
  },
  {
    id: 'orientacao', label: '🪪 Identidade', locked: false, required: true,
    groups: [
      { label: 'Orientação sexual aceita', options: [
        { key: 'sex_hetero', label: 'Heterossexual' }, { key: 'sex_homo', label: 'Homossexual' },
        { key: 'sex_bi', label: 'Bissexual' }, { key: 'sex_pan', label: 'Pansexual' },
        { key: 'sex_asex', label: 'Assexual' }, { key: 'sex_demi', label: 'Demissexual' },
        { key: 'sex_queer', label: 'Queer' },
      ]},
      { label: 'Status civil aceito', options: [
        { key: 'civil_single', label: 'Solteiro(a)' }, { key: 'civil_complicated', label: 'Complicado' },
        { key: 'civil_married', label: 'Casado(a)' }, { key: 'civil_divorcing', label: 'Divorciando' },
        { key: 'civil_divorced', label: 'Divorciado(a)' }, { key: 'civil_widowed', label: 'Viúvo(a)' },
        { key: 'civil_open', label: 'Relacionamento aberto' },
      ]},
    ]
  },
  {
    id: 'religiao', label: '🙏 Religião', locked: false, required: true,
    groups: [{ label: 'Religião aceita', options: [
      { key: 'rel_evangelical', label: 'Evangélico(a)' }, { key: 'rel_catholic', label: 'Católico(a)' },
      { key: 'rel_spiritist', label: 'Espírita' }, { key: 'rel_umbanda', label: 'Umbanda' },
      { key: 'rel_candomble', label: 'Candomblé' }, { key: 'rel_buddhist', label: 'Budista' },
      { key: 'rel_jewish', label: 'Judaico(a)' }, { key: 'rel_islamic', label: 'Islâmico(a)' },
      { key: 'rel_hindu', label: 'Hindu' }, { key: 'rel_agnostic', label: 'Agnóstico(a)' },
      { key: 'rel_atheist', label: 'Ateu/Ateísta' }, { key: 'rel_spiritual', label: 'Espiritualizado(a) sem religião' },
    ]}]
  },
  {
    id: 'vicios', label: '🚬 Vícios', locked: false, required: true,
    groups: [
      { label: 'Fumo', options: [
        { key: 'smoke_yes', label: 'Fuma' }, { key: 'smoke_occasionally', label: 'Ocasionalmente' },
        { key: 'smoke_no', label: 'Não fuma' },
      ]},
      { label: 'Bebida', options: [
        { key: 'drink_yes', label: 'Bebe' }, { key: 'drink_socially', label: 'Socialmente' },
        { key: 'drink_no', label: 'Não bebe' },
      ]},
    ]
  },
  {
    id: 'aparencia', label: '👁️ Aparência', locked: false, required: false,
    groups: [
      { label: 'Cor dos olhos', options: [
        { key: 'eye_black', label: 'Pretos' }, { key: 'eye_brown', label: 'Castanhos' },
        { key: 'eye_green', label: 'Verdes' }, { key: 'eye_blue', label: 'Azuis' },
        { key: 'eye_honey', label: 'Mel' }, { key: 'eye_gray', label: 'Cinzas' },
        { key: 'eye_heterochromia', label: 'Heterocromia' },
      ]},
      { label: 'Cor do cabelo', options: [
        { key: 'hair_black', label: 'Preto' }, { key: 'hair_brown', label: 'Castanho' },
        { key: 'hair_blonde', label: 'Loiro' }, { key: 'hair_red', label: 'Ruivo' },
        { key: 'hair_colored', label: 'Colorido' }, { key: 'hair_gray', label: 'Grisalho' },
        { key: 'hair_bald', label: 'Careca' },
      ]},
      { label: 'Tipo de cabelo', options: [
        { key: 'hair_short', label: 'Curto' }, { key: 'hair_medium', label: 'Médio' },
        { key: 'hair_long', label: 'Longo' }, { key: 'hair_straight', label: 'Liso' },
        { key: 'hair_wavy', label: 'Ondulado' }, { key: 'hair_curly', label: 'Cacheado' },
        { key: 'hair_coily', label: 'Crespo' },
      ]},
      { label: 'Cor de pele / etnia', options: [
        { key: 'skin_white', label: 'Branca' }, { key: 'skin_mixed', label: 'Parda' },
        { key: 'skin_black', label: 'Negra' }, { key: 'skin_asian', label: 'Asiática' },
        { key: 'skin_indigenous', label: 'Indígena' }, { key: 'skin_latin', label: 'Latina' },
        { key: 'skin_mediterranean', label: 'Mediterrânea' }, { key: 'skin_vitiligo', label: 'Vitiligo' },
      ]},
      { label: 'Corpo', options: [
        { key: 'body_underweight', label: 'Abaixo do peso' }, { key: 'body_healthy', label: 'Peso saudável' },
        { key: 'body_overweight', label: 'Acima do peso' }, { key: 'body_obese_mild', label: 'Obeso(a) leve' },
        { key: 'body_obese_severe', label: 'Obeso(a) grave' },
      ]},
      { label: 'Características', options: [
        { key: 'feat_freckles', label: 'Sardas' }, { key: 'feat_tattoo', label: 'Tatuagem' },
        { key: 'feat_piercing', label: 'Piercing' }, { key: 'feat_scar', label: 'Cicatriz' },
        { key: 'feat_glasses', label: 'Óculos' }, { key: 'feat_braces', label: 'Aparelho' },
        { key: 'feat_beard', label: 'Barba' },
      ]},
    ]
  },
  {
    id: 'estilo', label: '🎭 Estilo de vida', locked: false, required: false,
    groups: [
      { label: 'Rotina', options: [
        { key: 'routine_gym', label: 'Academia' }, { key: 'routine_sports', label: 'Esportes' },
        { key: 'routine_sedentary', label: 'Sedentário(a)' }, { key: 'routine_homebody', label: 'Caseiro(a)' },
        { key: 'routine_goes_out', label: 'Gosta de sair' }, { key: 'routine_party', label: 'Festeiro(a)' },
        { key: 'routine_night_owl', label: 'Noturno(a)' }, { key: 'routine_morning', label: 'Matutino(a)' },
        { key: 'routine_workaholic', label: 'Workaholic' }, { key: 'routine_balanced', label: 'Equilibrado(a)' },
      ]},
      { label: 'Personalidade', options: [
        { key: 'pers_extrovert', label: 'Extrovertido(a)' }, { key: 'pers_introvert', label: 'Introvertido(a)' },
        { key: 'pers_ambivert', label: 'Ambivertido(a)' }, { key: 'pers_shy', label: 'Tímido(a)' },
        { key: 'pers_communicative', label: 'Comunicativo(a)' }, { key: 'pers_antisocial', label: 'Antissocial' },
        { key: 'pers_calm', label: 'Calmo(a)' }, { key: 'pers_intense', label: 'Intenso(a)' },
      ]},
      { label: 'Alimentação', options: [
        { key: 'diet_vegan', label: 'Vegano(a)' }, { key: 'diet_vegetarian', label: 'Vegetariano(a)' },
        { key: 'diet_carnivore', label: 'Carnívoro(a)' }, { key: 'diet_everything', label: 'Come de tudo' },
        { key: 'food_cooks', label: 'Cozinha' }, { key: 'food_no_cook', label: 'Não cozinha' },
      ]},
    ]
  },
  {
    id: 'hobbies', label: '🎮 Hobbies e música', locked: false, required: false,
    groups: [
      { label: 'Hobbies', options: [
        { key: 'hob_gamer', label: 'Gamer' }, { key: 'hob_reader', label: 'Leitor(a)' },
        { key: 'hob_movies', label: 'Cinéfilo(a)' }, { key: 'hob_series', label: 'Séries' },
        { key: 'hob_anime', label: 'Anime' }, { key: 'hob_photography', label: 'Fotografia' },
        { key: 'hob_art', label: 'Arte' }, { key: 'hob_dance', label: 'Dança' },
        { key: 'hob_travel', label: 'Viagens' }, { key: 'hob_hiking', label: 'Trilhas' },
        { key: 'hob_meditation', label: 'Meditação' }, { key: 'hob_kpop', label: 'K-pop' },
      ]},
      { label: 'Música', options: [
        { key: 'music_funk', label: 'Funk' }, { key: 'music_sertanejo', label: 'Sertanejo' },
        { key: 'music_pagode', label: 'Pagode' }, { key: 'music_rock', label: 'Rock' },
        { key: 'music_pop', label: 'Pop' }, { key: 'music_electronic', label: 'Eletrônica' },
        { key: 'music_hiphop', label: 'Hip-hop' }, { key: 'music_mpb', label: 'MPB' },
        { key: 'music_gospel', label: 'Gospel' }, { key: 'music_eclectic', label: 'Eclético' },
      ]},
    ]
  },
  {
    id: 'familia', label: '👨‍👩‍👧 Família', locked: false, required: false,
    groups: [
      { label: 'Filhos', options: [
        { key: 'kids_has', label: 'Tem filhos' }, { key: 'kids_no', label: 'Não tem filhos' },
        { key: 'kids_wants', label: 'Quer ter filhos' }, { key: 'kids_no_want', label: 'Não quer' },
        { key: 'kids_adoption', label: 'Aberto à adoção' }, { key: 'kids_undecided', label: 'Ainda decidindo' },
      ]},
      { label: 'Pets', options: [
        { key: 'pet_dog', label: 'Tem cachorro' }, { key: 'pet_cat', label: 'Tem gato' },
        { key: 'pet_loves', label: 'Ama animais' }, { key: 'pet_none', label: 'Sem pets' },
        { key: 'pet_allergy', label: 'Alergia a animais' },
      ]},
    ]
  },
  {
    id: 'profissional', label: '💼 Profissional', locked: false, required: false,
    groups: [
      { label: 'Escolaridade', options: [
        { key: 'edu_highschool', label: 'Ensino médio' }, { key: 'edu_college_incomplete', label: 'Superior incompleto' },
        { key: 'edu_college_complete', label: 'Superior completo' }, { key: 'edu_postgrad', label: 'Pós-graduação' },
        { key: 'edu_masters', label: 'Mestrado' }, { key: 'edu_phd', label: 'Doutorado' },
        { key: 'edu_civil_servant', label: 'Concursado(a)' }, { key: 'edu_student', label: 'Estudante' },
      ]},
      { label: 'Trabalho', options: [
        { key: 'work_clt', label: 'CLT' }, { key: 'work_entrepreneur', label: 'Empresário(a)' },
        { key: 'work_freelancer', label: 'Freelancer' }, { key: 'work_autonomous', label: 'Autônomo(a)' },
        { key: 'work_remote', label: 'Remoto' }, { key: 'work_unemployed', label: 'Desempregado(a)' },
      ]},
    ]
  },
  {
    id: 'fetiche', label: '🔞 Fetiche & Sugar', locked: true, required: false,
    groups: [{ label: 'Dinâmicas', options: [
      { key: 'disc_throuple', label: 'Trisal' }, { key: 'disc_swing', label: 'Swing' },
      { key: 'disc_polyamory', label: 'Poliamor' }, { key: 'disc_bdsm', label: 'BDSM' },
      { key: 'obj_sugar_baby', label: 'Sugar Baby' }, { key: 'obj_sugar_daddy', label: 'Sugar Daddy/Mommy' },
    ]}]
  },
]

function getLikeLimit(plan: string) {
  if (plan === 'black') return Infinity
  if (plan === 'plus') return 30
  return 5
}
function getSuperlikeLimit(plan: string) {
  if (plan === 'black') return 10
  if (plan === 'plus') return 5
  return 1
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return timeLeft
}

export default function BuscaPage() {
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
  const [likesUsed, setLikesUsed] = useState(0)
  const [superlikesUsed, setSuperlikesUsed] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'superlike' | 'fetiche'>('superlike')
  const countdown = useCountdown()
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)

  const likeLimit = getLikeLimit(userPlan)
  const superlikeLimit = getSuperlikeLimit(userPlan)
  const currentProfile = deck[currentIdx] ?? null

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const [profileRes, filtersRes] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('filters').select('*').eq('user_id', user.id).single(),
      ])
      const plan = profileRes.data?.plan ?? 'essencial'
      setUserPlan(plan)
      if (filtersRes.data?.search_saved) {
        const merged = { ...DEFAULT_FILTERS, ...filtersRes.data }
        setLocalFilters(merged)
        setFiltersConfigured(true)
        await loadDeck(merged, user.id)
      } else {
        if (filtersRes.data) setLocalFilters({ ...DEFAULT_FILTERS, ...filtersRes.data })
        setOpenCategories({ objetivos: true })
        setShowFilters(true)
        setLoadingDeck(false)
      }
    } catch { setError('Erro ao carregar.'); setLoadingDeck(false) }
  }

  async function requestLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null), { timeout: 5000 }
      )
    })
  }

  async function loadDeck(filters: FiltersState, uid?: string) {
    setLoadingDeck(true)
    try {
      const id = uid ?? userId
      const loc = await requestLocation()
      const { data } = await supabase.rpc('search_profiles', {
        p_user_id: id,
        p_lat: loc?.lat ?? null,
        p_lng: loc?.lng ?? null,
        p_max_distance_km: filters.search_max_distance_km,
        p_min_age: filters.search_min_age,
        p_max_age: filters.search_max_age >= 99 ? 120 : filters.search_max_age,
        p_gender: filters.search_gender,
      })
      setDeck(data ?? [])
      setCurrentIdx(0)
    } catch { setError('Não foi possível carregar perfis.') }
    finally { setLoadingDeck(false) }
  }

  function onDragStart(clientX: number, clientY: number) {
    dragStartX.current = clientX; dragStartY.current = clientY; setIsDragging(true)
  }
  function onDragMove(clientX: number, clientY: number) {
    if (!isDragging) return
    setDragX(clientX - dragStartX.current); setDragY(clientY - dragStartY.current)
  }
  function onDragEnd() {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 100
    if (dragX > threshold) triggerSwipe('right')
    else if (dragX < -threshold) triggerSwipe('left')
    else if (dragY < -threshold) triggerSwipe('up')
    else { setDragX(0); setDragY(0) }
  }

  async function triggerSwipe(dir: 'left' | 'right' | 'up') {
    if (!currentProfile || !userId) return
    if (dir === 'right' && likesUsed >= likeLimit) {
      setDragX(0); setDragY(0); setLimitReached(true); return
    }
    if (dir === 'up' && superlikesUsed >= superlikeLimit) {
      setDragX(0); setDragY(0); setUpgradeReason('superlike'); setShowUpgradeModal(true); return
    }
    setSwipeDir(dir)
    const profileId = currentProfile.id
    setTimeout(async () => {
      setSwipeDir(null); setDragX(0); setDragY(0)
      setCurrentIdx(i => i + 1)
      if (dir === 'right') setLikesUsed(v => v + 1)
      if (dir === 'up') setSuperlikesUsed(v => v + 1)
      try {
        await supabase.rpc('process_swipe', {
          p_from: userId, p_to: profileId,
          p_type: dir === 'right' ? 'like' : dir === 'up' ? 'superlike' : 'dislike',
        })
      } catch {}
    }, 350)
  }

  function validateRequired(): boolean {
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
      await supabase.from('filters').upsert({
        ...localFilters, user_id: userId, search_saved: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      setFiltersConfigured(true); setShowFilters(false)
      await loadDeck(localFilters)
    } catch { setError('Erro ao salvar filtros.') }
    finally { setSaving(false) }
  }

  function toggleBool(key: string) {
    setLocalFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const ageLabel = (v: number) => v >= 60 ? '60+' : `${v}`
  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : swipeDir === 'right' ? 700 : 0) : 0
  const cardY = isDragging ? dragY : swipeDir === 'up' ? -700 : 0
  const showLikeIndicator = isDragging && dragX > 40
  const showPassIndicator = isDragging && dragX < -40
  const showSuperIndicator = isDragging && dragY < -40

  return (
    <div className="min-h-screen bg-[#0e0b14] text-white font-jakarta flex flex-col">

      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="font-fraunces text-xl">
          <span className="italic text-[#b8f542]">Me</span>AndYou
        </h1>
        <div className="flex items-center gap-3">
          {filtersConfigured && likeLimit !== Infinity && (
            <span className="text-xs text-white/30">{likesUsed}/{likeLimit} curtidas</span>
          )}
          <button onClick={() => setShowFilters(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition">
            <SlidersHorizontal size={13} /> Filtros
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {loadingDeck ? (
          <div className="flex flex-col items-center gap-3 text-white/30">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Carregando pessoas perto de você…</span>
          </div>
        ) : limitReached ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs px-2">
            <div className="text-5xl">😴</div>
            <h2 className="font-fraunces text-2xl">Curtidas esgotadas</h2>
            <p className="text-white/50 text-sm">Você usou todas as {likeLimit} curtidas de hoje. Volte amanhã ou faça upgrade.</p>
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center w-full">
              <p className="text-xs text-white/30 mb-1">Renova em</p>
              <p className="font-fraunces text-3xl text-[#b8f542]">{countdown}</p>
            </div>
            <Link href="/planos" className="w-full py-3.5 rounded-2xl bg-[#b8f542] text-black font-semibold text-sm text-center block">
              Ver planos
            </Link>
            <button onClick={() => setLimitReached(false)} className="text-white/30 text-xs">Continuar sem curtir</button>
          </div>
        ) : !currentProfile ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs px-2">
            <div className="text-5xl">🌍</div>
            <h2 className="font-fraunces text-xl">Você viu todo mundo!</h2>
            <p className="text-white/50 text-sm">Nenhum perfil com esses filtros. Tente aumentar o raio ou ajustar os filtros.</p>
            <button onClick={() => setShowFilters(true)} className="w-full py-3.5 rounded-2xl bg-[#b8f542] text-black font-semibold text-sm">Editar filtros</button>
            <button onClick={() => loadDeck(localFilters)} className="flex items-center gap-2 text-white/40 text-sm hover:text-white/60">
              <RotateCcw size={14} /> Recarregar
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            <div className="relative w-full" style={{ height: 'min(68vh, 500px)' }}>

              {deck[currentIdx + 1] && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden scale-95 opacity-50 pointer-events-none">
                  {deck[currentIdx + 1].photo_best
                    ? <Image src={deck[currentIdx + 1].photo_best!} alt="" fill className="object-cover" sizes="400px" />
                    : <div className="absolute inset-0 bg-white/5" />
                  }
                </div>
              )}

              <div
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
                style={{
                  transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                  willChange: 'transform',
                }}
                onMouseDown={(e) => onDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={(e) => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY) }}
                onTouchMove={(e) => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY) }}
                onTouchEnd={onDragEnd}
              >
                {currentProfile.photo_best
                  ? <Image src={currentProfile.photo_best} alt={currentProfile.name} fill className="object-cover pointer-events-none" sizes="(max-width: 640px) 100vw, 400px" draggable={false} priority />
                  : <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/20 text-6xl">?</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />

                {showLikeIndicator && (
                  <div className="absolute top-8 left-6 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-12deg] opacity-90">
                    <span className="text-green-400 font-black text-xl tracking-wide">CURTIR ❤️</span>
                  </div>
                )}
                {showPassIndicator && (
                  <div className="absolute top-8 right-6 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[12deg] opacity-90">
                    <span className="text-red-400 font-black text-xl tracking-wide">PASSAR ✕</span>
                  </div>
                )}
                {showSuperIndicator && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 border-4 border-blue-400 rounded-xl px-4 py-2 opacity-90">
                    <span className="text-blue-400 font-black text-xl tracking-wide">SUPER ⭐</span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="font-fraunces text-2xl font-bold drop-shadow">
                        {currentProfile.name}{currentProfile.age ? `, ${currentProfile.age}` : ''}
                      </h2>
                      {(currentProfile.city || currentProfile.distance_km !== undefined) && (
                        <p className="flex items-center gap-1 text-white/70 text-sm mt-0.5">
                          <MapPin size={11} />
                          {currentProfile.city && `${currentProfile.city} · `}
                          {currentProfile.distance_km !== undefined
                            ? currentProfile.distance_km < 1 ? 'menos de 1 km' : `${currentProfile.distance_km} km`
                            : ''}
                        </p>
                      )}
                      {currentProfile.bio && (
                        <p className="text-white/60 text-xs mt-1.5 line-clamp-2 max-w-[260px]">{currentProfile.bio}</p>
                      )}
                    </div>
                    <Link href={`/perfil/${currentProfile.id}`}
                      onClick={e => e.stopPropagation()}
                      className="pointer-events-auto shrink-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur text-sm font-bold ml-2">
                      +
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5">
              <button onClick={() => triggerSwipe('left')}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center transition active:scale-90">
                <X size={22} className="text-red-400" />
              </button>
              <button onClick={() => triggerSwipe('up')}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 flex items-center justify-center transition active:scale-90"
                title={`SuperCurtida (${superlikesUsed}/${superlikeLimit})`}>
                <Star size={18} className="text-blue-400" />
              </button>
              <button onClick={() => triggerSwipe('right')}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-500/40 flex items-center justify-center transition active:scale-90">
                <Heart size={22} className="text-green-400" />
              </button>
            </div>

            <p className="text-xs text-white/20">
              ⭐ {superlikesUsed}/{superlikeLimit} supercurtidas hoje
              {likeLimit !== Infinity && ` · ❤️ ${likesUsed}/${likeLimit} curtidas`}
            </p>
          </div>
        )}
      </main>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => filtersConfigured ? setShowFilters(false) : undefined} />
          <div className="relative w-full bg-[#141020] rounded-t-3xl border-t border-white/10 z-10 flex flex-col max-h-[92vh]">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 mb-2 shrink-0" />
            <div className="px-6 pb-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-fraunces text-xl">{filtersConfigured ? 'Editar filtros' : 'O que você busca?'}</h2>
                {!filtersConfigured && <p className="text-xs text-white/40 mt-0.5">Configure uma vez, edite quando quiser</p>}
              </div>
              {filtersConfigured && <button onClick={() => setShowFilters(false)}><X size={20} className="text-white/40" /></button>}
            </div>

            {requiredError && (
              <div className="mx-6 mb-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2 shrink-0">
                <AlertCircle size={14} />{requiredError}
              </div>
            )}

            <div className="overflow-y-auto flex-1 px-6 pb-4">
              <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">📍 Localização e idade</h3>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Distância máxima</span>
                    <span className="text-[#b8f542] font-semibold text-sm">{localFilters.search_max_distance_km} km</span>
                  </div>
                  <input type="range" min={5} max={300} step={5}
                    value={localFilters.search_max_distance_km as number}
                    onChange={(e) => setLocalFilters(p => ({ ...p, search_max_distance_km: Number(e.target.value) }))}
                    className="w-full accent-[#b8f542]" />
                  <div className="flex justify-between text-xs text-white/20 mt-1"><span>5 km</span><span>300 km</span></div>
                </div>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Faixa de idade</span>
                    <span className="text-[#b8f542] font-semibold text-sm">
                      {ageLabel(localFilters.search_min_age as number)} – {ageLabel(localFilters.search_max_age as number)} anos
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-white/30 mb-1 block">Mínima</label>
                      <select value={localFilters.search_min_age as number}
                        onChange={(e) => setLocalFilters(p => ({ ...p, search_min_age: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                        {Array.from({ length: 43 }, (_, i) => i + 18).map(a => <option key={a} value={a}>{a} anos</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/30 mb-1 block">Máxima</label>
                      <select value={localFilters.search_max_age as number}
                        onChange={(e) => setLocalFilters(p => ({ ...p, search_max_age: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                        {Array.from({ length: 42 }, (_, i) => i + 18).map(a => (
                          <option key={a} value={a >= 60 ? 99 : a}>{a >= 60 ? '60+ anos' : `${a} anos`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-white/70 block mb-2">Gênero</span>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => setLocalFilters(p => ({ ...p, search_gender: opt.value }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${localFilters.search_gender === opt.value ? 'bg-[#b8f542] text-black border-[#b8f542] font-medium' : 'bg-white/5 border-white/10 text-white/70'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {FILTER_CATEGORIES.map((cat) => {
                const isLocked = cat.locked && userPlan !== 'black'
                const isOpen = openCategories[cat.id]
                const activeCount = cat.groups.flatMap(g => g.options).filter(o => localFilters[o.key]).length
                const hasSelection = cat.groups.flatMap(g => g.options).some(o => localFilters[o.key])

                return (
                  <div key={cat.id} className={`mb-2 rounded-2xl border overflow-hidden ${cat.required && !hasSelection && !filtersConfigured ? 'border-yellow-500/40' : 'border-white/10'}`}>
                    <button
                      onClick={() => isLocked ? (setUpgradeReason('fetiche'), setShowUpgradeModal(true)) : setOpenCategories(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                      className="w-full px-4 py-3.5 flex items-center justify-between bg-white/5 hover:bg-white/8 transition">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{cat.label}</span>
                        {cat.required && !hasSelection && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">obrigatório</span>}
                        {activeCount > 0 && <span className="px-2 py-0.5 rounded-full bg-[#b8f542]/20 text-[#b8f542] text-xs">{activeCount}</span>}
                        {isLocked && <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded-full"><Lock size={9} /> Black</span>}
                      </div>
                      {!isLocked && (isOpen ? <ChevronUp size={15} className="text-white/30 shrink-0" /> : <ChevronDown size={15} className="text-white/30 shrink-0" />)}
                    </button>
                    {isOpen && !isLocked && (
                      <div className="px-4 pb-4 pt-3 bg-[#0e0b14]/60">
                        {cat.groups.map((group) => (
                          <div key={group.label} className="mb-4">
                            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">{group.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {group.options.map((opt) => {
                                const active = !!localFilters[opt.key]
                                return (
                                  <button key={opt.key} onClick={() => toggleBool(opt.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${active ? 'bg-[#b8f542] text-black border-[#b8f542] font-medium' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}>
                                    {active && <Check size={11} />}{opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              <p className="text-xs text-white/20 text-center mt-3 mb-4">
                Categorias sem seleção = aceita qualquer pessoa nessa categoria
              </p>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-[#141020] shrink-0">
              <button onClick={handleSaveAndSearch} disabled={saving}
                className="w-full py-4 rounded-2xl bg-[#b8f542] text-black font-semibold text-base hover:bg-[#a8e030] transition disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={18} className="animate-spin" />}
                {filtersConfigured ? 'Salvar e buscar' : 'Pronto, vamos lá! 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-[#1a1428] rounded-3xl p-6 border border-yellow-500/30 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">{upgradeReason === 'superlike' ? '⭐' : '🔞'}</div>
            <h3 className="font-fraunces text-xl mb-2">
              {upgradeReason === 'superlike' ? 'SuperCurtidas esgotadas' : <>Exclusivo <span className="text-yellow-400">Black</span></>}
            </h3>
            <p className="text-white/60 text-sm mb-5">
              {upgradeReason === 'superlike'
                ? `Você usou todas as ${superlikeLimit} SuperCurtidas de hoje. Faça upgrade para enviar mais.`
                : 'Filtros de Fetiche, BDSM e Sugar são exclusivos do plano Black. Faça upgrade para desbloquear.'}
            </p>
            <Link href="/planos" className="block w-full py-3.5 rounded-2xl bg-yellow-400 text-black font-semibold text-sm mb-3">
              Ver plano Black
            </Link>
            <button onClick={() => setShowUpgradeModal(false)} className="text-white/30 text-sm">Agora não</button>
          </div>
        </div>
      )}
    </div>
  )
}

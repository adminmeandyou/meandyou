'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/app/lib/supabase'
import {
  SlidersHorizontal, X, Heart, Star, AlertCircle,
  Loader2, Lock, Check, MapPin, RotateCcw, Zap, Undo2,
  ChevronDown, ChevronUp, Users, Info,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Pill } from '@/components/ui/Pill'
import { SliderRange } from '@/components/ui/SliderRange'
import { SwipeButton } from '@/components/ui/SwipeButton'
import { useAppHeader } from '@/contexts/AppHeaderContext'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  name: string
  age?: number
  photo_best?: string
  photos?: string[]
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

type ViewMode = 'discovery' | 'search' | 'rooms'

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Mode Selector (injetado no AppHeader) ───────────────────────────────────

function ModeSelectorTabs({
  viewMode,
  onChange,
  onFilterClick,
}: {
  viewMode: ViewMode
  onChange: (m: ViewMode) => void
  onFilterClick: () => void
}) {
  const tabs: { id: ViewMode; label: string }[] = [
    { id: 'discovery', label: 'Descobrir' },
    { id: 'search', label: 'Busca' },
    { id: 'rooms', label: 'Salas' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 100,
          padding: 3,
          gap: 2,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '4px 13px',
              borderRadius: 100,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-jakarta)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: viewMode === tab.id ? 'var(--accent)' : 'transparent',
              color: viewMode === tab.id ? '#fff' : 'var(--muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        onClick={onFilterClick}
        title="Filtros"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.10)',
          backgroundColor: 'transparent',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}

// ─── Placeholder: Salas Sociais ───────────────────────────────────────────────

const MOCK_ROOMS = [
  { id: '1', title: 'Noite de Pagode', desc: 'Quem curte uma roda de pagode?', count: 12, emoji: '🎵' },
  { id: '2', title: 'Geeks & Gamers', desc: 'Para quem joga e ama tecnologia', count: 8, emoji: '🎮' },
  { id: '3', title: 'Trilhas e Aventuras', desc: 'Apaixonados por natureza', count: 23, emoji: '🏕️' },
  { id: '4', title: 'Cinema & Séries', desc: 'Discussões sem spoiler (ou com)', count: 17, emoji: '🎬' },
]

function RoomsPlaceholder() {
  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={16} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)' }}>
          Salas Sociais
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 100,
            backgroundColor: 'rgba(225,29,72,0.12)',
            color: 'var(--accent)',
            border: '1px solid rgba(225,29,72,0.25)',
          }}
        >
          Em breve
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', marginBottom: 20, lineHeight: 1.5 }}>
        Entre em salas temáticas e converse com pessoas que compartilham os mesmos interesses.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_ROOMS.map((room) => (
          <div
            key={room.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 16,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              opacity: 0.7,
              cursor: 'not-allowed',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(225,29,72,0.10)',
                border: '1px solid rgba(225,29,72,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {room.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                {room.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{room.desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16,185,129,0.6)',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{room.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Busca Avancada: grid de perfis ──────────────────────────────────────────

function SearchGrid({ deck }: { deck: Profile[] }) {
  if (!deck.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
        <span style={{ fontSize: 40 }}>🔍</span>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)' }}>Nenhum perfil</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Ajuste os filtros para ver mais pessoas</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '12px 12px 20px',
        overflowY: 'auto',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        alignContent: 'start',
      }}
    >
      {deck.map((profile) => (
        <Link
          key={profile.id}
          href={`/perfil/${profile.id}`}
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              aspectRatio: '3/4',
              position: 'relative',
            }}
          >
            {profile.photo_best ? (
              <Image
                src={profile.photo_best}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>?</div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.2) 50%, transparent 100%)',
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 8px' }}>
              <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </p>
              {profile.city && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={9} /> {profile.city}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BuscaPage() {
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
  const [likesUsed, setLikesUsed] = useState(0)
  const [superlikesUsed, setSuperlikesUsed] = useState(0)
  const [superlikesAvulso, setSuperlikesAvulso] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'superlike' | 'fetiche'>('superlike')
  const [matchResult, setMatchResult] = useState<{ name: string; photo?: string } | null>(null)

  // ── Novos states (Fase 4) ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('discovery')
  const [photoIdx, setPhotoIdx] = useState(0)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const hasDragged = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const countdown = useCountdown()
  const likeLimit = getLikeLimit(userPlan)
  const superlikeLimit = getSuperlikeLimit(userPlan) + superlikesAvulso
  const currentProfile = deck[currentIdx] ?? null

  // ── Injeção do modeSelector no AppHeader ──────────────────────────────────
  const { setModeSelector } = useAppHeader()

  useEffect(() => {
    setModeSelector(
      <ModeSelectorTabs
        viewMode={viewMode}
        onChange={setViewMode}
        onFilterClick={() => setShowFilters(true)}
      />
    )
  }, [viewMode, setModeSelector])

  useEffect(() => {
    return () => setModeSelector(null)
  }, [setModeSelector])

  // Reset photoIdx quando o card muda
  useEffect(() => { setPhotoIdx(0) }, [currentIdx])

  // ── Init ──────────────────────────────────────────────────────────────────

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

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const [todayLikesRes, avulsoRes] = await Promise.all([
        supabase.from('likes').select('is_superlike').eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
        supabase.from('user_superlikes').select('amount').eq('user_id', user.id).single(),
      ])
      if (todayLikesRes.data) {
        setLikesUsed(todayLikesRes.data.filter(l => !l.is_superlike).length)
        setSuperlikesUsed(todayLikesRes.data.filter(l => l.is_superlike).length)
      }
      setSuperlikesAvulso(avulsoRes.data?.amount ?? 0)

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
      if (loc && id) {
        await supabase.from('profiles').update({ lat: loc.lat, lng: loc.lng }).eq('id', id)
      }
      const { data } = await supabase.rpc('search_profiles', {
        current_user_id: id,
        max_distance_km: filters.search_max_distance_km,
        min_age:         filters.search_min_age,
        max_age:         filters.search_max_age >= 99 ? 120 : filters.search_max_age,
      })
      setDeck(data ?? [])
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
    const savedProfile = { name: currentProfile.name, photo: currentProfile.photo_best }
    setTimeout(async () => {
      setSwipeDir(null); setDragX(0); setDragY(0)
      setCurrentIdx(i => i + 1)
      if (dir === 'right') setLikesUsed(v => v + 1)
      if (dir === 'up') setSuperlikesUsed(v => v + 1)
      try {
        if (dir === 'left') return
        const { data } = await supabase.rpc('process_like', {
          p_user_id:      userId,
          p_target_id:    profileId,
          p_is_superlike: dir === 'up',
        })
        if (data?.is_match) {
          setMatchResult(savedProfile)
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
      } catch (err) {
        console.error('Erro ao processar swipe:', err)
        setError('Falha ao registrar ação. Verifique sua conexão.')
        setTimeout(() => setError(''), 4000)
      }
    }, 350)
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

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

  // ── Computed swipe values ─────────────────────────────────────────────────

  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : swipeDir === 'right' ? 700 : 0) : 0
  const cardY = isDragging ? dragY : swipeDir === 'up' ? -700 : 0
  const showLikeIndicator = isDragging && dragX > 40
  const showPassIndicator = isDragging && dragX < -40
  const showSuperIndicator = isDragging && dragY < -40

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
        {viewMode === 'rooms' ? (
          <RoomsPlaceholder />
        ) : viewMode === 'search' ? (
          <SearchGrid deck={deck} />
        ) : loadingDeck ? (
          /* Loading */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
            <Loader2 size={28} style={{ animation: 'ui-spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Carregando pessoas perto de você...</span>
          </div>
        ) : limitReached ? (
          /* Limite de curtidas */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 32px', textAlign: 'center' }}>
            <span style={{ fontSize: 52 }}>💤</span>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: 'var(--text)', margin: 0 }}>Curtidas esgotadas</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
              Você usou todas as {likeLimit} curtidas de hoje. Volte amanhã ou faça upgrade.
            </p>
            <div
              style={{
                padding: '16px 24px',
                borderRadius: 20,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <p style={{ fontSize: 11, color: 'var(--muted-2)', marginBottom: 4 }}>Renova em</p>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, color: 'var(--accent)', letterSpacing: 2 }}>{countdown}</p>
            </div>
            <Link
              href="/planos"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Ver planos
            </Link>
            <button
              onClick={() => setLimitReached(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 12, cursor: 'pointer' }}
            >
              Continuar sem curtir
            </button>
          </div>
        ) : !currentProfile ? (
          /* Sem perfis */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 32px', textAlign: 'center' }}>
            <span style={{ fontSize: 52 }}>🌍</span>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: 0 }}>Você viu todo mundo!</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
              Nenhum perfil com esses filtros. Tente aumentar o raio ou ajustar os filtros.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Editar filtros
            </button>
            <button
              onClick={() => loadDeck(localFilters)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={13} /> Recarregar
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
                  ⭐ {superlikesUsed}/{superlikeLimit}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.10)' }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                  ❤️ {likesUsed}/{likeLimit}
                </span>
              </div>
            )}

            {/* Stack de cards */}
            <div style={{ flex: 1, width: '100%', position: 'relative', minHeight: 0 }}>

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
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
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
                    }}
                  >
                    <span style={{ color: '#E11D48', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>NOPE</span>
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
                    }}
                  >
                    <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>SUPER</span>
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
              {/* Voltar */}
              <SwipeButton
                variant="default"
                size="sm"
                icon={<Undo2 size={18} strokeWidth={1.5} />}
                label="Voltar"
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              />

              {/* Dislike */}
              <SwipeButton
                variant="danger"
                size="lg"
                icon={<X size={26} strokeWidth={1.5} />}
                label="Não curtir"
                onClick={() => triggerSwipe('left')}
              />

              {/* Super Like */}
              <SwipeButton
                variant="info"
                size="md"
                icon={<Star size={20} strokeWidth={1.5} />}
                label={`Super Curtida (${superlikesUsed}/${superlikeLimit})`}
                onClick={() => triggerSwipe('up')}
              />

              {/* Like */}
              <SwipeButton
                variant="primary"
                size="lg"
                icon={<Heart size={26} strokeWidth={1.5} />}
                label="Curtir"
                onClick={() => triggerSwipe('right')}
              />

              {/* Boost */}
              <SwipeButton
                variant="gold"
                size="sm"
                icon={<Zap size={18} strokeWidth={1.5} />}
                label="Boost"
                onClick={() => { setUpgradeReason('superlike'); setShowUpgradeModal(true) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── BottomSheet de filtros ─────────────────────────────────────────── */}
      <BottomSheet
        isOpen={showFilters}
        onClose={filtersConfigured ? () => setShowFilters(false) : () => {}}
        title={filtersConfigured ? 'Editar filtros' : undefined}
      >
        {/* Header manual para o primeiro acesso (não configurado) */}
        {!filtersConfigured && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 4px' }}>
              O que você busca?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Configure uma vez, edite quando quiser</p>
          </div>
        )}

        {/* Erro de validação */}
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
            border: '1px solid var(--border)',
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
                {localFilters.search_max_distance_km} km
              </span>
            </div>
            <input
              type="range" min={5} max={300} step={5}
              value={localFilters.search_max_distance_km as number}
              onChange={(e) => setLocalFilters(p => ({ ...p, search_max_distance_km: Number(e.target.value) }))}
              className="ui-range-input"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>
              <span>5 km</span><span>300 km</span>
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
              search_max_age: maxA >= 60 ? 99 : maxA,
            }))}
          />
          <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 6, textAlign: 'right' }}>
            {(localFilters.search_max_age as number) >= 59 ? 'até 60+ anos' : ''}
          </p>

          {/* Gênero */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Gênero</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENDER_OPTIONS.map((opt) => (
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
        </div>

        {/* Categorias de filtros */}
        {FILTER_CATEGORIES.map((cat) => {
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
              {/* Header da categoria */}
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
                    {cat.label}
                  </span>
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

              {/* Opções expandidas */}
              {isOpen && !isLocked && (
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
              )}
            </div>
          )
        })}

        <p style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center', margin: '8px 0 20px' }}>
          Categorias sem seleção = aceita qualquer pessoa
        </p>

        {/* Botão salvar — sticky no bottom do BottomSheet */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            margin: '0 -20px -32px',
            padding: '14px 20px 24px',
            backgroundColor: 'var(--bg-card)',
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
            {filtersConfigured ? 'Salvar e buscar' : 'Pronto, vamos la!'}
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
              backgroundColor: 'var(--bg-card)',
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
              E um Match!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Voce e <strong style={{ color: 'var(--text)' }}>{matchResult.name}</strong> se curtiram mutuamente.
            </p>
            <Link
              href="/matches"
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
              Ver matches
            </Link>
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
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div
            onClick={() => setShowUpgradeModal(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
          />
          <div
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 24,
              padding: '28px 22px',
              border: '1px solid rgba(245,158,11,0.30)',
              maxWidth: 340,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>
              {upgradeReason === 'superlike' ? '⭐' : '🔞'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>
              {upgradeReason === 'superlike' ? 'SuperCurtidas esgotadas' : <>Exclusivo <span style={{ color: '#F59E0B' }}>Black</span></>}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
              {upgradeReason === 'superlike'
                ? userPlan === 'essencial'
                  ? 'Voce esgotou suas SuperCurtidas. Faca upgrade ou compre mais na loja.'
                  : 'Voce esgotou suas SuperCurtidas de hoje e seu saldo avulso. Compre mais na loja ou aguarde amanha.'
                : 'Filtros de Fetiche, BDSM e Sugar sao exclusivos do plano Black.'}
            </p>
            <Link
              href={upgradeReason === 'superlike' && userPlan !== 'essencial' ? '/loja' : '/planos'}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                backgroundColor: '#F59E0B',
                color: '#000',
                fontWeight: 700,
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
              Agora nao
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

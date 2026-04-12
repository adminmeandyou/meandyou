'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { PaywallCard } from '@/components/PaywallCard'
import {
  SlidersHorizontal, X, Heart, Star, Search, AlertCircle,
  Loader2, Lock, Check, MapPin, RotateCcw, Zap, Undo2,
  ChevronDown, ChevronUp, Users, Info, Crown, Compass,
  Target, IdCard, Sparkles, Wind, Eye, Palette, Music, Home, Briefcase,
} from 'lucide-react'
import { SkeletonCard, skeletonCss } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
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
  gender?: string
}

interface Room {
  id: string
  name: string
  type: 'public' | 'private' | 'black'
  description: string | null
  emoji: string
  max_members: number
  created_by: string | null
  is_active: boolean
  member_count?: number
}

interface FiltersState {
  search_max_distance_km: number
  search_min_age: number
  search_max_age: number
  search_gender: string
  search_state: string
  [key: string]: boolean | number | string
}

type ViewMode = 'discovery' | 'search' | 'rooms' | 'daily'

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FiltersState = {
  search_max_distance_km: 40,
  search_min_age: 18,
  search_max_age: 60,
  search_gender: 'all',
  search_state: '',
}

const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'cis_woman', label: 'Mulher' },
  { value: 'cis_man', label: 'Homem' },
  { value: 'trans_woman', label: 'Mulher Trans' },
  { value: 'trans_man', label: 'Homem Trans' },
  { value: 'nonbinary', label: 'Não-binário' },
  { value: 'fluid', label: 'Gênero Fluido' },
]

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
}

const FILTER_CATEGORIES = [
  {
    id: 'objetivos', label: 'O que busca', icon: Target, locked: false, required: true,
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
    id: 'orientacao', label: 'Identidade', icon: IdCard, locked: false, required: true,
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
    id: 'religiao', label: 'Religião', icon: Sparkles, locked: false, required: true,
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
    id: 'vicios', label: 'Vícios', icon: Wind, locked: false, required: true,
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
    id: 'aparencia', label: 'Aparência', icon: Eye, locked: false, required: false,
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
    id: 'estilo', label: 'Estilo de vida', icon: Palette, locked: false, required: false,
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
    id: 'hobbies', label: 'Hobbies e música', icon: Music, locked: false, required: false,
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
    id: 'familia', label: 'Família', icon: Home, locked: false, required: false,
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
    id: 'profissional', label: 'Profissional', icon: Briefcase, locked: false, required: false,
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
    id: 'fetiche', label: 'Fetiche & Sugar', icon: Lock, locked: true, required: false,
    groups: [{ label: 'Dinâmicas', options: [
      { key: 'disc_throuple', label: 'Trisal' }, { key: 'disc_swing', label: 'Swing' },
      { key: 'disc_polyamory', label: 'Poliamor' }, { key: 'disc_bdsm', label: 'BDSM' },
      { key: 'obj_sugar_baby', label: 'Sugar Baby' }, { key: 'obj_sugar_daddy', label: 'Sugar Daddy/Mommy' },
    ]}]
  },
]

// ─── Location Autocomplete ────────────────────────────────────────────────────

type IbgeMunicipio = { nome: string; microrregiao: { mesorregiao: { UF: { sigla: string; nome: string } } } }
let ibgeCache: IbgeMunicipio[] | null = null

async function buscarMunicipios(query: string): Promise<{ label: string; city: string; state: string }[]> {
  if (!ibgeCache) {
    try {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      ibgeCache = await r.json()
    } catch { return [] }
  }
  const q = query.toLowerCase().trim()
  if (!q) return []
  return (ibgeCache ?? [])
    .filter(m => m.nome.toLowerCase().startsWith(q) || m.nome.toLowerCase().includes(q))
    .slice(0, 7)
    .map(m => ({
      city: m.nome,
      state: m.microrregiao.mesorregiao.UF.sigla,
      label: `${m.nome}, ${m.microrregiao.mesorregiao.UF.nome}`,
    }))
}

function LocationAutocomplete({
  displayValue,
  onSelect,
}: {
  displayValue: string
  onSelect: (city: string, state: string, display: string) => void
}) {
  const [query, setQuery] = useState(displayValue)
  const [suggestions, setSuggestions] = useState<{ label: string; city: string; state: string }[]>([])
  const [loadingLoc, setLoadingLoc] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(displayValue) }, [displayValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) {
      setSuggestions([])
      onSelect('', '', '')
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoadingLoc(true)
      const results = await buscarMunicipios(q)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoadingLoc(false)
    }, 300)
  }

  function handleSelect(s: { label: string; city: string; state: string }) {
    setQuery(s.label)
    setSuggestions([])
    setOpen(false)
    onSelect(s.city, s.state, s.label)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={15} strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar cidade ou estado..."
          style={{
            width: '100%', paddingLeft: 36, paddingRight: query ? 32 : 12,
            paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', color: 'var(--text)',
            fontSize: 14, fontFamily: 'var(--font-jakarta)', outline: 'none',
          }}
        />
        {loadingLoc && (
          <div className="ui-spinner" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted)' }} />
        )}
        {!loadingLoc && query && (
          <button
            onMouseDown={() => { setQuery(''); setSuggestions([]); setOpen(false); onSelect('', '', '') }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={13} color="var(--muted)" strokeWidth={1.5} />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
          borderRadius: 12, marginTop: 4, overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={`${s.city}-${s.state}`}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <MapPin size={13} color="var(--muted)" strokeWidth={1.5} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getModeLimit(plan: string, mode: ViewMode): number {
  // Match do dia: limite e o tamanho do deck (controlado em loadDaily)
  if (mode === 'daily' || mode === 'rooms') return Infinity
  // Descobrir e Busca Avancada: limite por plano
  if (plan === 'black') return Infinity
  if (plan === 'plus') return 50
  return 20
}

function getDailyMatchLimit(plan: string): number {
  if (plan === 'black') return 8
  if (plan === 'plus') return 3
  return 1
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

// ─── Boost Active Banner ─────────────────────────────────────────────────────

function BoostActiveBanner({ until }: { until: Date }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = until.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [until])
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '8px 14px', flexShrink: 0 }}>
      <Zap size={13} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
      <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Boost ativo: você está em destaque</span>
      <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.70)', marginLeft: 4 }}>{timeLeft}</span>
    </div>
  )
}

// ─── Mode Selector (injetado no AppHeader) ───────────────────────────────────

const MODE_LABELS: Record<ViewMode, string> = {
  discovery: 'Descobrir',
  search: 'Busca',
  daily: 'Match do dia',
  rooms: 'Salas',
}

function ModeSelectorTabs({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (m: ViewMode) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Botão Modos com dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 100,
            border: '1px solid rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'var(--text)', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-jakarta)', cursor: 'pointer',
          }}
        >
          <span>Modos</span>
          <ChevronDown size={13} strokeWidth={1.5} color="var(--muted)" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>

        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)', zIndex: 100,
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
              borderRadius: 14, padding: 6, minWidth: 160,
            }}>
              {(Object.keys(MODE_LABELS) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { onChange(mode); setOpen(false) }}
                  style={{
                    width: '100%', padding: '9px 14px', borderRadius: 10,
                    border: 'none',
                    backgroundColor: viewMode === mode ? 'var(--accent-light)' : 'transparent',
                    color: viewMode === mode ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 14, fontWeight: viewMode === mode ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-jakarta)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Match do dia ─────────────────────────────────────────────────────────────

// Todas as chaves de filtro de compatibilidade (exceto search_* e campos de controle)
const COMPAT_KEYS = FILTER_CATEGORIES.flatMap(cat =>
  cat.groups.flatMap(g => g.options.map(o => o.key))
)

function calcCompatibility(myFilters: Record<string, boolean>, theirFilters: Record<string, boolean>): number {
  const myKeys = COMPAT_KEYS.filter(k => myFilters[k] === true)
  if (myKeys.length === 0) return 0
  const matches = myKeys.filter(k => theirFilters[k] === true).length
  return Math.round((matches / myKeys.length) * 100)
}

function DailyMatchView({ userId, localFilters, userPlan }: { userId: string | null; localFilters: FiltersState; userPlan: string }) {
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
        const { data } = await supabase.rpc('search_profiles', {
          p_user_id:         userId,
          p_lat:             null,
          p_lng:             null,
          p_max_distance_km: localFilters.search_max_distance_km,
          p_min_age:         localFilters.search_min_age,
          p_max_age:         localFilters.search_max_age >= 60 ? 120 : localFilters.search_max_age,
          p_gender:          matchGender,
        })
        // Busca candidatos para filtrar por compatibilidade mútua
        const candidates = (data ?? []).slice(0, 20) as Profile[]

        // Calcular compatibilidade mútua para filtrar >= 59%
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
            // Filtra mínimo 59% de compatibilidade mútua, pega os melhores por plano
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

    // Calcular scores de compatibilidade (para perfis vindos do cache)
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
    // Gravar dislike no banco para não reaparecer por 30 dias
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

// ─── Hub de Modos ─────────────────────────────────────────────────────────────

const MODES_CONFIG = [
  {
    key: 'discovery' as ViewMode,
    label: 'Descobrir',
    subtitle: 'Novos olhares, sem filtros.',
    bg: '#0d0810',
    img: '/images/modos/descobrir.jpg',
    accent: 'rgba(225,29,72,0.15)',
  },
  {
    key: 'search' as ViewMode,
    label: 'Busca Avancada',
    subtitle: 'Encontre a peca que falta.',
    bg: '#080a10',
    img: '/images/modos/busca.jpg',
    accent: 'rgba(96,165,250,0.10)',
    badge: null as string | null,
  },
  {
    key: 'rooms' as ViewMode,
    label: 'Salas',
    subtitle: 'Conversas coletivas ao vivo.',
    bg: '#060e0a',
    img: '/images/modos/salas.jpg',
    accent: 'rgba(46,196,160,0.10)',
    badge: 'Plus+' as string | null,
  },
  {
    key: 'daily' as ViewMode,
    label: 'Match do dia',
    subtitle: 'A nossa recomendação fatal.',
    bg: '#100900',
    img: '/images/modos/match-dia.jpg',
    accent: 'rgba(245,158,11,0.12)',
    badge: null as string | null,
  },
]

function ModesHubView({ userPlan, onSelect, onCamarote }: {
  userPlan: string
  onSelect: (m: ViewMode) => void
  onCamarote: () => void
}) {
  return (
    <div style={{ overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 24px' }}>
      {/* Label + título editorial */}
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(248,249,250,0.35)',
          fontFamily: 'var(--font-jakarta)',
          margin: '0 0 6px',
        }}>
          Conexões curadas
        </p>
        <h2 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 32, fontWeight: 700,
          color: '#F8F9FA',
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Escolha seu{' '}
          <br />
          <span style={{ color: '#E11D48' }}>ritmo</span> hoje.
        </h2>
      </div>

      {/* Grid 2x2 de modos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {MODES_CONFIG.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            style={{
              aspectRatio: '3/4',
              borderRadius: 10, overflow: 'hidden',
              position: 'relative', cursor: 'pointer',
              background: m.bg,
              border: '1px solid rgba(255,255,255,0.04)',
              padding: 0,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Foto de fundo */}
            <img
              src={m.img}
              alt={m.label}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2)' }}
            />
            {/* Vinheta noir na base */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(8,9,14,0.15) 0%, rgba(8,9,14,0.92) 100%)',
            }} />
            {/* Conteúdo na base */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 14px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0,
            }}>
              {m.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 100,
                  background: 'rgba(46,196,160,0.15)',
                  color: '#2ec4a0',
                  border: '1px solid rgba(46,196,160,0.25)',
                  fontFamily: 'var(--font-jakarta)',
                  marginBottom: 6,
                }}>
                  {m.badge}
                </span>
              )}
              <p style={{
                margin: '0 0 3px', fontSize: 15, fontWeight: 700,
                color: '#F8F9FA',
                fontFamily: 'var(--font-fraunces)',
                letterSpacing: '-0.01em',
              }}>
                {m.label}
              </p>
              <p style={{
                margin: 0, fontSize: 11,
                color: 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)',
                fontWeight: 400,
                lineHeight: 1.4,
              }}>
                {m.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Camarote Black — banner editorial */}
      <button
        onClick={onCamarote}
        style={{
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 0 50px rgba(245,158,11,0.08)',
          padding: 0,
          background: 'linear-gradient(135deg, #0d0900 0%, #1a1000 40%, #120c00 70%, #0d0900 100%)',
        }}
      >
        {/* Gradiente dourado sobreposição lateral */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.75) 50%, rgba(8,9,14,0.3) 100%)',
        }} />
        {/* Luz dourada de fundo */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '60%',
          background: 'radial-gradient(ellipse at right center, rgba(245,158,11,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'relative',
          padding: '22px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          minHeight: 130,
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Crown size={13} strokeWidth={1.5} color="#F59E0B" />
            <span style={{
              fontSize: 9, fontWeight: 800,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: '#F59E0B',
              fontFamily: 'var(--font-jakarta)',
            }}>
              Exclusivo VIP
            </span>
          </div>
          <h3 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 26, fontWeight: 700,
            fontStyle: 'italic',
            color: '#F8F9FA',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            Camarote Black
          </h3>
          <p style={{
            fontSize: 12, color: 'rgba(248,249,250,0.60)',
            margin: '0 0 14px',
            maxWidth: '65%',
            fontFamily: 'var(--font-jakarta)',
            lineHeight: 1.5,
          }}>
            Acesso prioritario e perfis verificados de alta relevancia.
          </p>
          <div style={{
            padding: '7px 16px', borderRadius: 9999,
            background: 'linear-gradient(135deg, #F59E0B 0%, #B47B00 100%)',
            boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
            display: 'inline-flex',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#000',
              fontFamily: 'var(--font-jakarta)',
            }}>
              Entrar agora
            </span>
          </div>
        </div>
      </button>
      </div>{/* fim maxWidth wrapper */}
    </div>
  )
}

// ─── Modal Camarote ────────────────────────────────────────────────────────────

function CamaroteModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={26} strokeWidth={1.5} color="#F59E0B" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: 0 }}>Camarote</h2>
            <p style={{ fontSize: 12, color: '#F59E0B', margin: '2px 0 0', fontWeight: 600 }}>Exclusivo para assinantes Black</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Um ambiente reservado para quem busca experiências além do convencional. Dentro do Camarote você encontra perfis e filtros que não existem em nenhum outro lugar do app.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Sugar', desc: 'Encontros com beneficios mutuos', color: '#ec4899' },
            { label: 'Fetiche', desc: 'Interesses e estilos de vida alternativos', color: '#a855f7' },
            { label: 'Chat VIP', desc: 'Salas exclusivas para assinantes Black', color: '#F59E0B' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="/planos"
          style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 14, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, textAlign: 'center', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
        >
          Fazer upgrade para Black
        </a>
        <button onClick={onClose} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  )
}

// ─── Salas de Bate-papo ───────────────────────────────────────────────────────

function RoomsView({ userPlan }: { userPlan: string }) {
  const router = useRouter()
  const canJoin = userPlan === 'plus' || userPlan === 'black'
  const canJoinBlack = userPlan === 'black'
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningRoom, setJoiningRoom] = useState<Room | null>(null)
  const [nickname, setNickname] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => { loadRooms() }, [])

  async function loadRooms() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_rooms')
      .select('id, name, type, description, emoji, max_members, created_by, is_active')
      .eq('is_active', true)
      .order('name')
    if (data) {
      const roomsWithCount = await Promise.all(
        data.map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
          return { ...room, member_count: count ?? 0 } as Room
        })
      )
      setRooms(roomsWithCount)
    }
    setLoading(false)
  }

  async function handleJoin() {
    if (!joiningRoom || joining) return
    if (nickname.trim().length < 2) { setJoinError('Nome deve ter ao menos 2 caracteres.'); return }
    if (nickname.trim().length > 20) { setJoinError('Nome deve ter no máximo 20 caracteres.'); return }
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/salas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: joiningRoom.id, nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Erro ao entrar na sala.'); setJoining(false); return }
      router.push(`/salas/${joiningRoom.id}`)
    } catch {
      setJoinError('Erro de conexão. Tente novamente.')
      setJoining(false)
    }
  }

  if (!canJoin) {
    const fakeRooms = [
      { name: 'Paquera Livre', members: 12, max: 20, emoji: '💬' },
      { name: 'Musica e Conversa', members: 8, max: 15, emoji: '🎵' },
      { name: 'Noturno(a)s', members: 5, max: 10, emoji: '🌙' },
    ]
    return (
      <div style={{ padding: '0 16px 20px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Glow atmosferico */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 32, marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(225,29,72,0.05) 100%)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={28} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: 'var(--text)', margin: '0 0 8px' }}>Salas de Bate-papo</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Converse anonimamente em salas temáticas com pessoas que compartilham seus interesses.
          </p>
        </div>

        {/* Preview de salas (blur) */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fakeRooms.map((room, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{room.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{room.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Sala ativa agora</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.members}/{room.max}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Overlay de bloqueio sobre o preview */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, backgroundColor: 'rgba(8,9,14,0.85)', border: '1px solid rgba(225,29,72,0.25)', backdropFilter: 'blur(4px)' }}>
              <Lock size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Disponível no Plus e Black</span>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { icon: <Users size={16} strokeWidth={1.5} />, text: 'Salas temáticas com até 20 pessoas' },
            { icon: <Lock size={16} strokeWidth={1.5} />, text: 'Identidade protegida com apelidos' },
            { icon: <Crown size={16} strokeWidth={1.5} />, text: 'Salas exclusivas Black com categorias VIP' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)' }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.70)', lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/planos"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '15px', borderRadius: 14,
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            textDecoration: 'none', fontFamily: 'var(--font-jakarta)',
            boxShadow: '0 8px 32px rgba(225,29,72,0.25)',
          }}
        >
          Fazer upgrade
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
        <p style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', margin: '10px 0 0' }}>
          A partir de R$9,97/mes no plano Plus
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'ui-spin 1s linear infinite' }} />
      </div>
    )
  }

  // Sheet de entrada na sala
  if (joiningRoom) {
    const isBlack = joiningRoom.type === 'black'
    return (
      <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => { setJoiningRoom(null); setNickname(''); setJoinError('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
        >
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 16, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : 'var(--border)'}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, backgroundColor: isBlack ? 'rgba(245,158,11,0.10)' : 'rgba(225,29,72,0.10)', border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : 'rgba(225,29,72,0.20)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {joiningRoom.emoji}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 2px' }}>{joiningRoom.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{joiningRoom.description ?? 'Sala de bate-papo'}</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Como quer ser chamado nessa sala?</p>
          <input
            value={nickname}
            onChange={e => { setNickname(e.target.value); setJoinError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Seu apelido na sala"
            maxLength={20}
            autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${joinError ? 'rgba(225,29,72,0.50)' : 'var(--border)'}`, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box' }}
          />
          {joinError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{joinError}</p>}
        </div>
        <button
          onClick={handleJoin}
          disabled={joining}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', opacity: joining ? 0.7 : 1 }}
        >
          {joining ? 'Entrando...' : 'Entrar na sala'}
        </button>
      </div>
    )
  }

  const publicRooms = rooms.filter(r => r.type === 'public')
  const blackRooms = rooms.filter(r => r.type === 'black')

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 2px' }}>Salas</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Bate-papo em grupo por tema</p>
        </div>
        <Link href="/salas" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
      </div>

      {publicRooms.length === 0 && blackRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhuma sala disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {publicRooms.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Publicas</p>
              {publicRooms.map(room => {
                const isFull = (room.member_count ?? 0) >= room.max_members
                return (
                  <button
                    key={room.id}
                    onClick={() => { if (!isFull) { setJoiningRoom(room); setNickname('') } }}
                    disabled={isFull}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, width: '100%', textAlign: 'left', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', opacity: isFull ? 0.45 : 1, cursor: isFull ? 'default' : 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{room.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{room.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isFull ? 'Sala cheia' : (room.description ?? 'Sala de bate-papo')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isFull ? '#F59E0B' : '#10b981' }} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.member_count ?? 0}/{room.max_members}</span>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {blackRooms.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 6px' }}>Black</p>
              {blackRooms.map(room => {
                const isFull = (room.member_count ?? 0) >= room.max_members
                const isLocked = !canJoinBlack
                return (
                  <button
                    key={room.id}
                    onClick={() => { if (!isLocked && !isFull) { setJoiningRoom(room); setNickname('') } }}
                    disabled={isLocked || isFull}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, width: '100%', textAlign: 'left', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(245,158,11,0.25)', opacity: isLocked || isFull ? 0.45 : 1, cursor: isLocked || isFull ? 'default' : 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{room.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{room.name}</p>
                        <Crown size={12} color="#F59E0B" strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isFull ? 'Sala cheia' : (room.description ?? 'Sala de bate-papo')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {isLocked ? <Lock size={12} color="var(--muted)" strokeWidth={2} /> : (
                        <>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isFull ? '#F59E0B' : '#10b981' }} />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.member_count ?? 0}/{room.max_members}</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Busca Avancada: grid de perfis ──────────────────────────────────────────

function SearchGrid({ deck }: { deck: Profile[] }) {
  if (!deck.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
        <Users size={40} color="rgba(255,255,255,0.20)" strokeWidth={1} />
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)' }}>Nenhum perfil encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Tente aumentar o raio de busca ou ajustar os filtros</p>
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
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
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

// ─── Filtro client-side para modo Busca ──────────────────────────────────────

// Para cada categoria, se o usuário marcou alguma opção, o perfil precisa ter
// pelo menos uma delas (AND entre categorias, OR dentro de cada categoria).
function applyCompatFilters(
  profiles: Profile[],
  userFilters: FiltersState,
  profileFiltersMap: Record<string, Record<string, unknown>>
): Profile[] {
  return profiles.filter(profile => {
    const theirFilters = profileFiltersMap[profile.id]
    if (!theirFilters) return true // sem dados de filtro — inclui de qualquer forma

    for (const cat of FILTER_CATEGORIES) {
      const catKeys = cat.groups.flatMap(g => g.options.map(o => o.key))
      const userSelected = catKeys.filter(k => userFilters[k] === true)
      if (userSelected.length === 0) continue // usuário não filtrou essa categoria
      const hasMatch = userSelected.some(k => theirFilters[k] === true)
      if (!hasMatch) return false
    }
    return true
  })
}

// ─── Página principal ─────────────────────────────────────────────────────────

function BuscaInner() {
  const router = useRouter()
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
  const [modeLikesUsed, setModeLikesUsed] = useState<Record<string, number>>({})
  const [superlikesUsed, setSuperlikesUsed] = useState(0)
  const [superlikesAvulso, setSuperlikesAvulso] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'superlike' | 'fetiche'>('superlike')
  const [matchResult, setMatchResult] = useState<{ name: string; photo?: string; otherUserId?: string } | null>(null)
  const [matchFriendSent, setMatchFriendSent] = useState(false)
  const [lastSwipe, setLastSwipe] = useState<{ dir: 'left' | 'right' | 'up'; profileId: string } | null>(null)

  // ── Profile detail sheet (swipe down) ───────────────────────────────────
  const [showProfileSheet, setShowProfileSheet] = useState(false)

  // ── Boost ────────────────────────────────────────────────────────────────
  const [boostUntil, setBoostUntil] = useState<Date | null>(null)
  const [boostAmount, setBoostAmount] = useState(0)

  // ── Novos states (Fase 4) ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('discovery')
  const [showHub, setShowHub] = useState(true)
  const [camaroteModal, setCamaroteModal] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [userGender, setUserGender] = useState<string>('')
  const [locationDisplay, setLocationDisplay] = useState<string>('')

  // ── Refs ──────────────────────────────────────────────────────────────────
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const hasDragged = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const countdown = useCountdown()
  const likeLimit = getModeLimit(userPlan, viewMode)
  const superlikeLimit = getSuperlikeLimit(userPlan) + superlikesAvulso
  const currentProfile = deck[currentIdx] ?? null
  const toast = useToast()
  const haptics = useHaptics()
  const searchParams = useSearchParams()

  // Abre filtros automaticamente se vier de /configuracoes com ?filtros=1
  useEffect(() => {
    if (searchParams.get('filtros') === '1') {
      setShowFilters(true)
      setShowHub(false)
    }
  }, [searchParams])

  // ── Injeção do modeSelector, leftAction e rightActions no AppHeader ──────────────────
  const { setModeSelector, setRightActions, setLeftAction } = useAppHeader()

  const openFiltersStable = useCallback(() => openFilters(), [localFilters, filtersConfigured])

  useEffect(() => {
    if (showHub) {
      setModeSelector(null)
      setRightActions(null)
      setLeftAction(null)
      return
    }
    setLeftAction(
      <button
        onClick={() => { setShowHub(true) }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Voltar para Modos"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(248,249,250,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
    )
    setModeSelector(
      <ModeSelectorTabs
        viewMode={viewMode}
        onChange={(m) => { setViewMode(m); setShowHub(false) }}
      />
    )
    setRightActions(
      <>
        <Link
          href="/conversas"
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', textDecoration: 'none',
          }}
          aria-label="Conversas"
        >
          <Search size={19} strokeWidth={1.5} style={{ display: 'none' }} />
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>
        <button
          onClick={openFiltersStable}
          title="Filtros"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: 'none', backgroundColor: 'transparent', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={18} strokeWidth={1.5} />
        </button>
      </>
    )
  }, [viewMode, showHub, setModeSelector, setRightActions, openFiltersStable])

  useEffect(() => {
    return () => { setModeSelector(null); setRightActions(null); setLeftAction(null) }
  }, [setModeSelector, setRightActions, setLeftAction])

  // Reset photoIdx quando o card muda
  useEffect(() => { setPhotoIdx(0) }, [currentIdx])

  // Recarrega deck ao trocar entre discovery e search
  useEffect(() => {
    if (!filtersConfigured || !userId) return
    if (viewMode === 'discovery') {
      loadDeck(DEFAULT_FILTERS, userId, false)
    } else if (viewMode === 'search') {
      loadDeck(localFilters, userId, true)
    }
  }, [viewMode])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const [profileRes, filtersRes] = await Promise.all([
        supabase.from('profiles').select('plan, gender').eq('id', user.id).single(),
        supabase.from('filters').select('*').eq('user_id', user.id).single(),
      ])
      const plan = profileRes.data?.plan ?? 'essencial'
      setUserPlan(plan)
      setUserGender(profileRes.data?.gender ?? '')

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const [todayLikesRes, avulsoRes, boostRes, modeLikesRes] = await Promise.all([
        supabase.from('likes').select('is_superlike').eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
        supabase.from('user_superlikes').select('amount').eq('user_id', user.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user.id).maybeSingle(),
        supabase.from('mode_likes').select('mode').eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
      ])
      if (boostRes.data?.active_until && new Date(boostRes.data.active_until) > new Date()) {
        setBoostUntil(new Date(boostRes.data.active_until))
      }
      setBoostAmount(boostRes.data?.amount ?? 0)
      if (todayLikesRes.data) {
        setSuperlikesUsed(todayLikesRes.data.filter(l => l.is_superlike).length)
      }
      setSuperlikesAvulso(avulsoRes.data?.amount ?? 0)
      const modeUsage: Record<string, number> = {}
      for (const r of modeLikesRes.data ?? []) {
        modeUsage[r.mode] = (modeUsage[r.mode] || 0) + 1
      }
      setModeLikesUsed(modeUsage)

      if (filtersRes.data?.search_saved) {
        // Tenta restaurar do localStorage (backup quando colunas do banco estão ausentes)
        let localBackup: Partial<FiltersState> = {}
        try {
          const saved = localStorage.getItem(`filters_${user.id}`)
          if (saved) localBackup = JSON.parse(saved)
        } catch {}
        const merged = { ...DEFAULT_FILTERS, ...filtersRes.data, ...localBackup }
        setLocalFilters(merged)
        setFiltersConfigured(true)
        const stateCode = (merged.search_state as string) || ''
        if (stateCode && STATE_NAMES[stateCode]) setLocationDisplay(`${STATE_NAMES[stateCode]} - ${stateCode}`)
        await loadDeck(merged, user.id)
      } else {
        // Verifica se tem backup local mesmo sem search_saved no banco
        let localBackup: Partial<FiltersState> = {}
        try {
          const saved = localStorage.getItem(`filters_${user.id}`)
          if (saved) localBackup = JSON.parse(saved)
        } catch {}
        if (filtersRes.data || Object.keys(localBackup).length > 0) {
          const merged = { ...DEFAULT_FILTERS, ...filtersRes.data, ...localBackup }
          setLocalFilters(merged)
          if (Object.keys(localBackup).length > 0) {
            // Tem backup local — considera configurado
            setFiltersConfigured(true)
            await loadDeck(merged, user.id)
            return
          }
        }
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

  async function loadDeck(filters: FiltersState, uid?: string, searchMode = false) {
    setLoadingDeck(true)
    try {
      const id = uid ?? userId
      const loc = await requestLocation()
      if (loc && id) {
        await supabase.from('profiles').update({ lat: loc.lat, lng: loc.lng }).eq('id', id)
      }
      const genderParam = filters.search_gender && filters.search_gender !== 'all' ? filters.search_gender : null
      const { data } = await supabase.rpc('search_profiles', {
        p_user_id:         id,
        p_lat:             loc?.lat ?? null,
        p_lng:             loc?.lng ?? null,
        p_max_distance_km: filters.search_max_distance_km,
        p_min_age:         filters.search_min_age,
        p_max_age:         filters.search_max_age >= 60 ? 120 : filters.search_max_age,
        p_gender:          genderParam,
      })
      let profiles = (data ?? []) as Profile[]

      // Filtra perfis em modo fantasma
      if (profiles.length > 0) {
        const ids = profiles.map(p => p.id)
        const now = new Date().toISOString()
        const { data: ghostData } = await supabase
          .from('profiles')
          .select('id')
          .in('id', ids)
          .gt('ghost_mode_until', now)
        const ghostIds = new Set((ghostData ?? []).map((g: { id: string }) => g.id))
        profiles = profiles.filter(p => !ghostIds.has(p.id))
      }

      // A4 — Perfis com boost ativo sobem para o topo (mais recente primeiro)
      if (profiles.length > 0) {
        const ids = profiles.map(p => p.id)
        const { data: boostData } = await supabase
          .from('user_boosts')
          .select('user_id, active_until')
          .in('user_id', ids)
          .gt('active_until', new Date().toISOString())
        if (boostData && boostData.length > 0) {
          const boostMap = new Map(boostData.map((b: { user_id: string; active_until: string }) => [b.user_id, b.active_until]))
          const boosted = profiles.filter(p => boostMap.has(p.id)).sort((a, b) =>
            new Date(boostMap.get(b.id)!).getTime() - new Date(boostMap.get(a.id)!).getTime()
          )
          const notBoosted = profiles.filter(p => !boostMap.has(p.id))
          profiles = [...boosted, ...notBoosted]
        }
      }

      // Filtro de gênero client-side (fallback caso p_gender não tenha sido passado)
      if (genderParam) {
        profiles = profiles.filter(p => p.gender === genderParam)
      }

      // Modo Busca: aplica filtros de compatibilidade client-side
      if (searchMode && profiles.length) {
        const profileIds = profiles.map(p => p.id)
        const { data: filtersData } = await supabase
          .from('filters')
          .select('*')
          .in('user_id', profileIds)
        if (filtersData?.length) {
          const profileFiltersMap = Object.fromEntries(
            filtersData.map(f => [f.user_id, f as Record<string, unknown>])
          )
          profiles = applyCompatFilters(profiles, filters, profileFiltersMap)
        }
      }

      setDeck(profiles)
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
    else if (dragY > threshold) {
      setShowProfileSheet(true)
      setDragX(0); setDragY(0)
    } else {
      // Spring: anima de volta ao centro com overshoot
      setIsSnapping(true)
      setDragX(0); setDragY(0)
      setTimeout(() => setIsSnapping(false), 600)
    }
  }

  async function triggerSwipe(dir: 'left' | 'right' | 'up') {
    if (!currentProfile || !userId) return
    if (dir === 'right' && (modeLikesUsed[viewMode] ?? 0) >= likeLimit) {
      setDragX(0); setDragY(0); setLimitReached(true); return
    }
    if (dir === 'up' && superlikesUsed >= superlikeLimit) {
      setDragX(0); setDragY(0); setUpgradeReason('superlike'); setShowUpgradeModal(true); return
    }
    setSwipeDir(dir)
    const profileId = currentProfile.id
    const savedProfile = { name: currentProfile.name, photo: currentProfile.photo_best }
    setLastSwipe({ dir, profileId })
    setTimeout(async () => {
      setSwipeDir(null); setDragX(0); setDragY(0)
      setCurrentIdx(i => i + 1)
      if (dir === 'right') {
        setModeLikesUsed(prev => ({ ...prev, [viewMode]: (prev[viewMode] || 0) + 1 }))
        void supabase.from('mode_likes').insert({ user_id: userId, mode: viewMode })
      }
      if (dir === 'up') setSuperlikesUsed(v => v + 1)
      try {
        if (dir === 'left') {
          // Gravar dislike no banco para não reaparecer por 30 dias
          supabase
            .from('dislikes')
            .upsert(
              { from_user: userId, to_user: profileId },
              { onConflict: 'from_user,to_user' }
            )
            .then(({ error }) => { if (error) console.error('Erro ao gravar dislike:', error) })
          return
        }
        const { data } = await supabase.rpc('process_like', {
          p_user_id:      userId,
          p_target_id:    profileId,
          p_is_superlike: dir === 'up',
        })
        if (data?.is_match) {
          setMatchFriendSent(false)
          setMatchResult({ ...savedProfile, otherUserId: profileId })
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
        // Notifica superlike (fire-and-forget)
        if (dir === 'up') {
          supabase.auth.getSession().then(({ data: s }) => {
            const token = s.session?.access_token
            if (token) {
              fetch('/api/likes/superlike-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ toUserId: profileId }),
              }).catch(() => {})
            }
          })
        }
      } catch (err) {
        console.error('Erro ao processar swipe:', err)
        toast.error('Erro ao registrar ação. Verifique sua conexão.')
        haptics.error()
      }
    }, 350)
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  function validateRequired(): boolean {
    // Em modo discovery, filtros avançados não são exibidos — validação não se aplica
    if (viewMode === 'discovery') { setRequiredError(null); return true }
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
      const { search_max_distance_km, search_min_age, search_max_age, search_gender } = localFilters
      await supabase.from('filters').upsert({
        user_id: userId, search_saved: true,
        search_max_distance_km, search_min_age, search_max_age, search_gender,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      // Backup em localStorage para persistir mesmo com colunas ausentes no banco
      try { localStorage.setItem(`filters_${userId}`, JSON.stringify(localFilters)) } catch {}
      setFiltersConfigured(true); setShowFilters(false)
      await loadDeck(localFilters, undefined, viewMode === 'search')
    } catch { setError('Erro ao salvar filtros.') }
    finally { setSaving(false) }
  }

  function toggleBool(key: string) {
    setLocalFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleBoost() {
    if (boostUntil && boostUntil > new Date()) {
      toast.info('Você já tem um Boost ativo!')
      return
    }
    if (boostAmount <= 0) {
      window.location.href = '/loja'
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/boosts/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      })
      const data = await res.json()
      if (data?.success) {
        haptics.success()
        toast.success('Boost ativado! Você está em destaque por 30 minutos.')
        setBoostUntil(new Date(data.active_until))
        setBoostAmount(b => b - 1)
      } else if (data?.reason === 'already_active') {
        toast.info('Você já tem um Boost ativo!')
      } else if (data?.reason === 'no_boosts') {
        window.location.href = '/loja'
      } else {
        toast.error('Erro ao ativar boost. Tente novamente.')
      }
    } catch {
      toast.error('Erro ao ativar boost. Tente novamente.')
    }
  }

  function openFilters() {
    // Expande categorias que já têm seleções para o usuário ver o que foi configurado
    const expanded: Record<string, boolean> = {}
    FILTER_CATEGORIES.forEach(cat => {
      const hasAny = cat.groups.flatMap(g => g.options).some(o => localFilters[o.key])
      if (hasAny) expanded[cat.id] = true
    })
    if (Object.keys(expanded).length > 0) setOpenCategories(expanded)
    setShowFilters(true)
  }

  // ── Computed swipe values ─────────────────────────────────────────────────

  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : swipeDir === 'right' ? 700 : 0) : 0
  const cardY = isDragging ? dragY : swipeDir === 'up' ? -700 : 0
  const showLikeIndicator = isDragging && dragX > 20
  const showPassIndicator = isDragging && dragX < -20
  const showSuperIndicator = isDragging && dragY < -20
  const showInfoIndicator = isDragging && dragY > 20
  const likeOpacity = isDragging ? Math.min(1, (dragX - 20) / 80) : 0
  const passOpacity = isDragging ? Math.min(1, (-dragX - 20) / 80) : 0
  const superOpacity = isDragging ? Math.min(1, (-dragY - 20) / 80) : 0
  const infoOpacity = isDragging ? Math.min(1, (dragY - 20) / 80) : 0

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
        {showHub ? (
          <ModesHubView userPlan={userPlan} onSelect={(m) => { setViewMode(m); setShowHub(false) }} onCamarote={() => { if (userPlan === 'black') router.push('/backstage'); else setCamaroteModal(true) }} />
        ) : viewMode === 'rooms' ? (
          <RoomsView userPlan={userPlan} />
        ) : viewMode === 'daily' ? (
          <DailyMatchView userId={userId} localFilters={localFilters} userPlan={userPlan} />
        ) : viewMode === 'search' && !loadingDeck ? (
          <SearchGrid deck={deck} />
        ) : loadingDeck ? (
          /* Loading — skeleton deck */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 20px', gap: 12 }}>
            <style>{skeletonCss}</style>
            <div style={{ width: '100%', maxWidth: 360 }}>
              <SkeletonCard />
            </div>
            <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>Buscando pessoas perto de você...</span>
          </div>
        ) : limitReached ? (
          /* Limite de curtidas — PaywallCard com countdown */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', gap: 16 }}>
            <PaywallCard
              title="Curtidas esgotadas"
              description={`Você usou todas as ${likeLimit} curtidas de hoje. Volte amanhã ou faça upgrade para curtir mais.`}
              resetAt={(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d })()}
              ctaLabel="Ver planos"
            />
            <button
              onClick={() => setLimitReached(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 12, cursor: 'pointer' }}
            >
              Continuar sem curtir
            </button>
          </div>
        ) : !currentProfile ? (
          /* Sem perfis — empty state com opção de recarregar */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Compass size={28} strokeWidth={1.5} color="var(--muted)" />
            </div>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>Ninguém novo por aqui</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>Tente aumentar o raio de busca ou mudar os filtros</p>
            <button
              onClick={() => userId && loadDeck(DEFAULT_FILTERS, userId, false)}
              style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-jakarta)', cursor: 'pointer' }}
            >
              Recarregar
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
                  <Star size={10} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{superlikesUsed}/{superlikeLimit}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.10)' }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                  <Heart size={10} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{modeLikesUsed[viewMode] ?? 0}/{likeLimit === Infinity ? '∞' : likeLimit}
                </span>
              </div>
            )}

            {/* Banner de Boost */}
            {boostUntil && boostUntil > new Date() ? (
              <BoostActiveBanner until={boostUntil} />
            ) : (
              <button
                onClick={() => window.location.href = '/loja'}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}
              >
                <Zap size={13} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Dar um boost e aparecer para mais pessoas</span>
              </button>
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
                  transition: isDragging ? 'none' : isSnapping ? 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
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
                      opacity: likeOpacity,
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
                      opacity: passOpacity,
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
                      opacity: superOpacity,
                    }}
                  >
                    <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>SUPER</span>
                  </div>
                )}

                {/* Carimbo INFO (swipe down) */}
                {showInfoIndicator && (
                  <div
                    style={{
                      position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                      border: '3px solid rgba(248,249,250,0.70)',
                      borderRadius: 10, padding: '6px 14px',
                      pointerEvents: 'none',
                      opacity: infoOpacity,
                    }}
                  >
                    <span style={{ color: 'rgba(248,249,250,0.90)', fontWeight: 800, fontSize: 18, letterSpacing: 2 }}>VER MAIS</span>
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
                onClick={async () => {
                  if (currentIdx === 0) return
                  setCurrentIdx(i => Math.max(0, i - 1))
                  // Cancela like/superlike no banco se o último swipe foi positivo
                  if (lastSwipe && (lastSwipe.dir === 'right' || lastSwipe.dir === 'up') && userId) {
                    try {
                      await supabase
                        .from('likes')
                        .delete()
                        .eq('user_id', userId)
                        .eq('target_id', lastSwipe.profileId)
                      if (lastSwipe.dir === 'right') setModeLikesUsed(prev => ({ ...prev, [viewMode]: Math.max(0, (prev[viewMode] || 0) - 1) }))
                      if (lastSwipe.dir === 'up') setSuperlikesUsed(v => Math.max(0, v - 1))
                    } catch {}
                  }
                  setLastSwipe(null)
                }}
                disabled={currentIdx === 0 || !lastSwipe}
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
                label={`SuperCurtida (${superlikesUsed}/${superlikeLimit})`}
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
                label={boostAmount > 0 ? `Boost (${boostAmount})` : 'Boost'}
                onClick={handleBoost}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── BottomSheet de detalhes do perfil (swipe down) ────────────────── */}
      <BottomSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        title={currentProfile?.name ?? ''}
      >
        {currentProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentProfile.bio && (
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                {currentProfile.bio}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {currentProfile.age && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  {currentProfile.age} anos
                </span>
              )}
              {currentProfile.city && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} strokeWidth={1.5} /> {currentProfile.city}
                </span>
              )}
              {currentProfile.distance_km !== undefined && (
                <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px' }}>
                  {Math.round(currentProfile.distance_km)} km
                </span>
              )}
            </div>
            <a
              href={`/perfil/${currentProfile.id}`}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }}
            >
              Ver perfil completo
            </a>
          </div>
        )}
      </BottomSheet>

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

        {/* Mensagem de contexto do filtro */}
        {filtersConfigured && (
          <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.40)', margin: '0 0 16px' }}>
            Configure o perfil da pessoa que você está buscando
          </p>
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
            border: '1px solid rgba(255,255,255,0.06)',
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
            {/* Container position:relative é obrigatório para ui-range-input funcionar corretamente */}
            <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{
                position: 'absolute', left: 0, height: 4, borderRadius: 100,
                backgroundColor: 'var(--accent)',
                width: `${((localFilters.search_max_distance_km as number - 5) / (150 - 5)) * 100}%`,
              }} />
              <input
                type="range" min={5} max={150} step={5}
                value={localFilters.search_max_distance_km as number}
                onChange={(e) => setLocalFilters(p => ({ ...p, search_max_distance_km: Number(e.target.value) }))}
                className="ui-range-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>
              <span>5 km</span><span>150 km</span>
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
              search_max_age: maxA,
            }))}
            formatMax={(v) => v >= 60 ? '60+' : String(v)}
          />

          {/* Gênero */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Gênero</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENDER_OPTIONS.filter(opt => opt.value === 'all' || opt.value !== userGender).map((opt) => (
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

          {/* Localização */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Cidade ou estado</span>
            <LocationAutocomplete
              displayValue={locationDisplay}
              onSelect={(city, state, display) => {
                setLocationDisplay(display)
                setLocalFilters(p => ({ ...p, search_state: state }))
              }}
            />
            {localFilters.search_state && (
              <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 6 }}>
                Filtrando por: {STATE_NAMES[localFilters.search_state as string] ?? localFilters.search_state}
              </p>
            )}
          </div>
        </div>

        {/* Categorias de filtros avancados — visíveis apenas no modo Busca */}
        {viewMode === 'discovery' && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', borderRadius: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(248,249,250,0.65)', margin: 0 }}>
              Modo <strong style={{ color: '#F8F9FA' }}>Descobrir</strong> usa apenas idade e distância. Mude para <strong style={{ color: '#F8F9FA' }}>Busca</strong> para usar filtros avançados.
            </p>
          </div>
        )}
        {viewMode !== 'discovery' && FILTER_CATEGORIES.map((cat) => {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <cat.icon size={14} strokeWidth={1.5} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
                      {cat.label}
                    </span>
                  </div>
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
              {!isLocked && (
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
                <div style={{ overflow: 'hidden' }}>
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
                </div>
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
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
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
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
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
              Você e <strong style={{ color: 'var(--text)' }}>{matchResult.name}</strong> se curtiram mutuamente.
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
            {matchResult.otherUserId && !matchFriendSent && (
              <button
                onClick={async () => {
                  if (!userId) return
                  try {
                    await fetch('/api/amigos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ friendId: matchResult!.otherUserId }),
                    })
                    setMatchFriendSent(true)
                  } catch {}
                }}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 14, marginBottom: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(248,249,250,0.70)', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Check size={15} /> Adicionar como amigo
              </button>
            )}
            {matchFriendSent && (
              <p style={{ fontSize: 13, color: '#10b981', textAlign: 'center', marginBottom: 10 }}>Pedido de amizade enviado!</p>
            )}
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
      {/* Modal Camarote */}
      {camaroteModal && (
        <CamaroteModal onClose={() => setCamaroteModal(false)} />
      )}

      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div
            onClick={() => setShowUpgradeModal(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
              borderRadius: 16,
              padding: '28px 22px',
              border: '1px solid rgba(255,255,255,0.06)',
              maxWidth: 340,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            }}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: 'rgba(225,29,72,0.12)',
                border: '1px solid rgba(225,29,72,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {upgradeReason === 'superlike'
                ? <Star size={22} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                : <Lock size={22} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              }
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>
              {upgradeReason === 'superlike' ? 'SuperCurtidas esgotadas' : 'Exclusivo Black'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
              {upgradeReason === 'superlike'
                ? userPlan === 'essencial'
                  ? 'Você esgotou suas SuperCurtidas. Faça upgrade ou compre mais na loja.'
                  : 'Você esgotou suas SuperCurtidas de hoje e seu saldo avulso. Compre mais na loja ou aguarde amanhã.'
                : 'Filtros de Fetiche, BDSM e Sugar são exclusivos do plano Black.'}
            </p>
            <Link
              href={upgradeReason === 'superlike' && userPlan !== 'essencial' ? '/loja' : '/planos'}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
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
              Agora não
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }} />}>
      <BuscaInner />
    </Suspense>
  )
}

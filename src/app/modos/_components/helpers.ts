'use client'

import { useEffect, useState } from 'react'
import {
  Target, IdCard, Sparkles, Wind, Eye, Palette, Music, Home, Briefcase, Lock,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Profile {
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

export interface Room {
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

export interface FiltersState {
  search_max_distance_km: number
  search_min_age: number
  search_max_age: number
  search_gender: string
  search_state: string
  [key: string]: boolean | number | string
}

export type ViewMode = 'discovery' | 'search' | 'rooms' | 'daily'

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: FiltersState = {
  search_max_distance_km: 50,
  search_min_age: 18,
  search_max_age: 60,
  search_gender: 'all',
  search_state: '',
}

export const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'cis_woman', label: 'Mulher' },
  { value: 'cis_man', label: 'Homem' },
  { value: 'trans_woman', label: 'Mulher Trans' },
  { value: 'trans_man', label: 'Homem Trans' },
  { value: 'nonbinary', label: 'Não-binário' },
  { value: 'fluid', label: 'Gênero Fluido' },
]

export const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
}

export const FILTER_CATEGORIES = [
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

export const MODE_LABELS: Record<ViewMode, string> = {
  discovery: 'Descobrir',
  search: 'Busca',
  daily: 'Match do dia',
  rooms: 'Salas',
}

export const MODES_CONFIG = [
  {
    key: 'discovery' as ViewMode,
    label: 'Descobrir',
    subtitle: 'Novos olhares, sem filtros.',
    bg: '#0d0810',
    img: '/images/modos/descobrir.jpg',
    imgPosition: 'center center',
    accent: 'rgba(225,29,72,0.15)',
  },
  {
    key: 'search' as ViewMode,
    label: 'Busca Avancada',
    subtitle: 'Encontre a peca que falta.',
    bg: '#080a10',
    img: '/images/modos/busca.jpg',
    imgPosition: 'center top',
    accent: 'rgba(96,165,250,0.10)',
    badge: null as string | null,
  },
  {
    key: 'rooms' as ViewMode,
    label: 'Salas',
    subtitle: 'Conversas coletivas ao vivo.',
    bg: '#060e0a',
    img: '/images/modos/salas.jpg',
    imgPosition: 'center center',
    accent: 'rgba(46,196,160,0.10)',
    badge: 'Plus+' as string | null,
  },
  {
    key: 'daily' as ViewMode,
    label: 'Match do dia',
    subtitle: 'A nossa recomendação fatal.',
    bg: '#100900',
    img: '/images/modos/match-dia.jpg',
    imgPosition: 'center center',
    accent: 'rgba(245,158,11,0.12)',
    badge: null as string | null,
  },
]

// Todas as chaves de filtro de compatibilidade
export const COMPAT_KEYS = FILTER_CATEGORIES.flatMap(cat =>
  cat.groups.flatMap(g => g.options.map(o => o.key))
)

// ─── Location Autocomplete helpers ──────────────────────────────────────────

type IbgeMunicipio = { nome: string; microrregiao: { mesorregiao: { UF: { sigla: string; nome: string } } } }
let ibgeCache: IbgeMunicipio[] | null = null

export async function buscarMunicipios(query: string): Promise<{ label: string; city: string; state: string }[]> {
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

// ─── Helper functions ───────────────────────────────────────────────────────

export function getModeLimit(plan: string, mode: ViewMode): number {
  if (mode === 'daily' || mode === 'rooms') return Infinity
  if (plan === 'black') return Infinity
  if (plan === 'plus') return 50
  return 20
}

export function getDailyMatchLimit(plan: string): number {
  if (plan === 'black') return 8
  if (plan === 'plus') return 3
  return 1
}

export function getSuperlikeLimit(plan: string) {
  if (plan === 'black') return 10
  if (plan === 'plus') return 5
  return 1
}

export function useCountdown() {
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

export function calcCompatibility(myFilters: Record<string, boolean>, theirFilters: Record<string, boolean>): number {
  const myKeys = COMPAT_KEYS.filter(k => myFilters[k] === true)
  if (myKeys.length === 0) return 0
  const matches = myKeys.filter(k => theirFilters[k] === true).length
  return Math.round((matches / myKeys.length) * 100)
}

export async function requestLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null), { timeout: 5000 }
    )
  })
}

export function applyCompatFilters(
  profiles: Profile[],
  userFilters: FiltersState,
  profileFiltersMap: Record<string, Record<string, unknown>>
): Profile[] {
  return profiles.filter(profile => {
    const theirFilters = profileFiltersMap[profile.id]
    if (!theirFilters) return true
    for (const cat of FILTER_CATEGORIES) {
      const catKeys = cat.groups.flatMap(g => g.options.map(o => o.key))
      const userSelected = catKeys.filter(k => userFilters[k] === true)
      if (userSelected.length === 0) continue
      const hasMatch = userSelected.some(k => theirFilters[k] === true)
      if (!hasMatch) return false
    }
    return true
  })
}

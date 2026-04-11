'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Crown, Lock, Loader2, ArrowLeft, Shield,
  CheckCircle, X, Heart, MapPin, Users,
  Check, SlidersHorizontal, ChevronRight,
  AlertTriangle, Flame, Clock, User, MessageCircle,
  Star, ThumbsUp, ThumbsDown, HeartHandshake, Trophy, Flag,
} from 'lucide-react'
import CheckoutModal from '@/components/CheckoutModal'

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { key: 'trisal',   label: 'Trisal' },
  { key: 'menage',   label: 'Menage' },
  { key: 'bdsm',     label: 'BDSM' },
  { key: 'sado',     label: 'Sadomasoquismo' },
  { key: 'sugar',    label: 'Sugar' },
  { key: 'swing',    label: 'Swing' },
  { key: 'poliamor', label: 'Poliamor' },
]

const TERMS_KEY = 'camarote_terms_v1'

const G = '#F59E0B'               // gold
const G_SOFT = 'rgba(245,158,11,0.10)'
const G_BORDER = 'rgba(245,158,11,0.25)'
const G_BORDER2 = 'rgba(245,158,11,0.15)'
const BG = '#08090E'
const BG_CARD_GRADIENT = 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)'
const BG_CARD = '#0F1117'
const BG_DARK = '#050608'

// ─── Página principal ──────────────────────────────────────────────────────────

export default function BackstagePage() {
  const { limits, loading: planLoading } = usePlan()
  const router = useRouter()

  if (planLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </div>
    )
  }

  if (!limits.isBlack) {
    return <CamaroteBlocked plan={limits.isPlus ? 'plus' : 'essencial'} onBack={() => router.back()} />
  }

  return <CamaroteApp onBack={() => router.back()} />
}

// ─── App interno (só Black) ────────────────────────────────────────────────────

type Step = 'loading' | 'terms' | 'categories' | 'vitrine'
type MainTab = 'vitrine' | 'resgates'

function CamaroteApp({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('loading')
  const [myCategories, setMyCategories] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    init()
  }, [user?.id])

  async function init() {
    const termsOk = localStorage.getItem(TERMS_KEY) === 'accepted'
    if (!termsOk) { setStep('terms'); return }

    const { data } = await supabase
      .from('profiles')
      .select('camarote_interests')
      .eq('id', user!.id)
      .single()

    const cats: string[] = data?.camarote_interests ?? []
    if (cats.length === 0) { setStep('categories'); return }

    setMyCategories(cats)
    setStep('vitrine')
  }

  function handleTermsAccepted() {
    localStorage.setItem(TERMS_KEY, 'accepted')
    setStep('categories')
  }

  async function handleCategoriesSaved(cats: string[]) {
    await supabase
      .from('profiles')
      .update({ camarote_interests: cats })
      .eq('id', user!.id)
    setMyCategories(cats)
    setStep('vitrine')
  }

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: G }} />
      </div>
    )
  }

  if (step === 'terms') {
    return <CamaroteTerms onAccept={handleTermsAccepted} onBack={onBack} />
  }

  if (step === 'categories') {
    return <CamaroteCategories initial={myCategories} onSave={handleCategoriesSaved} onBack={onBack} />
  }

  return (
    <CamaroteVitrine
      myCategories={myCategories}
      onChangeCategories={() => setStep('categories')}
      onBack={onBack}
    />
  )
}

// ─── Termos de segurança ───────────────────────────────────────────────────────

const SAFETY_ITEMS = [
  { icon: Shield, text: 'Mantenha toda comunicação pelo app. Suas conversas ficam salvas e protegidas.' },
  { icon: CheckCircle, text: 'Use a videochamada para verificar que a pessoa é real antes de marcar um encontro.' },
  { icon: MapPin, text: 'Marque encontros em locais públicos e seguros na primeira vez.' },
  { icon: Users, text: 'Avise alguém de confiança: onde vai, com quem e em que horário.' },
  { icon: Heart, text: 'Leve seu telefone carregado e comunique-se durante o encontro.' },
  { icon: AlertTriangle, text: 'Não compartilhe dados pessoais (endereço, trabalho) antes de ter confiança.' },
  { icon: Flame, text: 'Use o botão de denúncia se algo parecer errado. Estamos aqui para proteger você.' },
]

function CamaroteTerms({ onAccept, onBack }: { onAccept: () => void; onBack: () => void }) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--font-jakarta)', paddingBottom: 32 }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER2}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={18} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff' }}>Camarote Black</span>
      </header>

      <div style={{ padding: '32px 24px 24px' }}>
        {/* Titulo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={24} color={G} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#fff', margin: '0 0 8px' }}>
            Antes de entrar
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            O Camarote é um ambiente adulto e privado. Leia com atenção antes de continuar.
          </p>
        </div>

        {/* Lista de termos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {SAFETY_ITEMS.map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, background: BG_CARD_GRADIENT, border: `1px solid rgba(255,255,255,0.06)`, boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: G_SOFT, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={G} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.55, margin: 0, paddingTop: 6 }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, cursor: 'pointer' }}>
          <div
            onClick={() => setAccepted(a => !a)}
            style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: accepted ? G : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${accepted ? G : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {accepted && <Check size={13} color="#fff" strokeWidth={2.5} />}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 1.55 }}>
            Li e compreendo as recomendações de segurança. Estou ciente de que o Camarote é um ambiente para adultos maiores de 18 anos.
          </span>
        </label>

        {/* Botao */}
        <button
          onClick={onAccept}
          disabled={!accepted}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
            cursor: accepted ? 'pointer' : 'not-allowed',
            background: accepted ? `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)` : 'rgba(255,255,255,0.05)',
            color: accepted ? '#fff' : 'rgba(255,255,255,0.20)',
            border: 'none', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          Entrar no Camarote
        </button>
      </div>
    </div>
  )
}

// ─── Seleção de categorias ─────────────────────────────────────────────────────

function CamaroteCategories({
  initial,
  onSave,
  onBack,
}: {
  initial: string[]
  onSave: (cats: string[]) => Promise<void>
  onBack: () => void
}) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    if (selected.length === 0) return
    setSaving(true)
    await onSave(selected)
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--font-jakarta)', paddingBottom: 32 }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER2}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={18} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff' }}>Camarote Black</span>
      </header>

      <div style={{ padding: '32px 24px 24px' }}>

        {/* Titulo */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
            No que você tem interesse?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6, margin: 0 }}>
            Selecione tudo que você está aberto(a) a explorar. Você aparecerá na vitrine apenas para quem compartilha seus interesses.
          </p>
        </div>

        {/* Grid de categorias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {CATEGORIAS.map(({ key, label }) => {
            const active = selected.includes(key)
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  border: `1.5px solid ${active ? G : 'rgba(255,255,255,0.08)'}`,
                  background: active ? G_SOFT : 'rgba(255,255,255,0.03)',
                  color: active ? G : 'rgba(255,255,255,0.50)',
                  fontFamily: 'var(--font-jakarta)',
                  fontWeight: active ? 700 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span>{label}</span>
                {active && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#fff" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Nota */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55, margin: 0 }}>
            Você pode alterar seus interesses a qualquer momento voltando aqui. Quanto mais categorias, mais perfis você verá na vitrine.
          </p>
        </div>

        {/* Botao */}
        <button
          onClick={handleSave}
          disabled={selected.length === 0 || saving}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
            cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            background: selected.length > 0 ? `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)` : 'rgba(255,255,255,0.05)',
            color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.20)',
            border: 'none', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving
            ? <Loader2 size={18} className="animate-spin" />
            : `Entrar no Camarote${selected.length > 0 ? ` (${selected.length})` : ''}`
          }
        </button>
      </div>
    </div>
  )
}

// ─── Vitrine ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  name: string
  age: number
  city: string
  state: string
  photo_body: string | null
  photo_best: string | null
  camarote_interests: string[]
}

interface Filters {
  city: string
  state: string
  ageMin: number
  ageMax: number
}

const DEFAULT_FILTERS: Filters = { city: '', state: '', ageMin: 18, ageMax: 60 }

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

function CamaroteVitrine({
  myCategories,
  onChangeCategories,
  onBack,
}: {
  myCategories: string[]
  onChangeCategories: () => void
  onBack: () => void
}) {
  const { user } = useAuth()
  const [mainTab, setMainTab] = useState<MainTab>('vitrine')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [localFilters, setLocalFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set())

  // Drag/swipe state
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [isSnapping, setIsSnapping] = useState(false)

  const load = useCallback(async () => {
    if (!user || myCategories.length === 0) return
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('id, name, age, city, state, photo_body, photo_best, camarote_interests')
      .eq('plan', 'black')
      .neq('id', user.id)
      .overlaps('camarote_interests', myCategories)

    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.state) query = query.eq('state', filters.state)
    if (filters.ageMin > 18 || filters.ageMax < 60) query = query.gte('age', filters.ageMin).lte('age', filters.ageMax)

    const { data } = await query.limit(50)
    setProfiles(data ?? [])
    setLikedIds(new Set())
    setPassedIds(new Set())
    setLoading(false)
  }, [user?.id, filters, myCategories])

  useEffect(() => { load() }, [load])

  const deck = profiles.filter(p => !likedIds.has(p.id) && !passedIds.has(p.id))
  const currentProfile = deck[0] ?? null

  async function handleLike() {
    if (!user || !currentProfile) return
    setLikedIds(prev => new Set(prev).add(currentProfile.id))
    await supabase.rpc('process_like', {
      p_user_id: user.id,
      p_target_id: currentProfile.id,
      p_is_superlike: false,
    })
  }

  function handlePass() {
    if (!currentProfile) return
    setPassedIds(prev => new Set(prev).add(currentProfile.id))
  }

  function triggerSwipe(dir: 'left' | 'right') {
    setSwipeDir(dir)
    setDragX(0)
    setDragY(0)
    setIsSnapping(true)
    setTimeout(() => {
      if (dir === 'right') handleLike()
      else handlePass()
      setSwipeDir(null)
      setIsSnapping(false)
    }, 350)
  }

  function onDragStart(clientX: number, clientY: number) {
    if (swipeDir) return
    setIsDragging(true)
    startX.current = clientX
    startY.current = clientY
    setDragX(0)
    setDragY(0)
  }

  function onDragMove(clientX: number, clientY: number) {
    if (!isDragging) return
    setDragX(clientX - startX.current)
    setDragY(clientY - startY.current)
  }

  function onDragEnd(endClientX?: number) {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 80
    const finalX = endClientX !== undefined ? endClientX - startX.current : dragX
    if (finalX > threshold) triggerSwipe('right')
    else if (finalX < -threshold) triggerSwipe('left')
    else { setDragX(0); setDragY(0) }
  }

  function applyFilters() {
    setFilters(localFilters)
    setShowFilters(false)
  }

  const hasActiveFilters = filters.city || filters.state || filters.ageMin > 18 || filters.ageMax < 60

  const cardX = isDragging ? dragX : swipeDir ? (swipeDir === 'left' ? -700 : 700) : 0
  const cardY = isDragging ? dragY * 0.3 : 0
  const cardRotation = isDragging ? dragX * 0.08 : swipeDir === 'left' ? -25 : swipeDir === 'right' ? 25 : 0
  const likeOpacity = isDragging ? Math.min(1, (dragX - 20) / 80) : 0
  const passOpacity = isDragging ? Math.min(1, (-dragX - 20) / 80) : 0
  const photo = currentProfile?.photo_body ?? currentProfile?.photo_best

  return (
    <div style={{ height: '100vh', background: BG, fontFamily: 'var(--font-jakarta)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G_BORDER2}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={16} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', flex: 1 }}>Camarote</span>
        <button
          onClick={onChangeCategories}
          style={{ padding: '6px 12px', borderRadius: 100, border: `1px solid ${G_BORDER}`, background: G_SOFT, color: G, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', flexShrink: 0 }}
        >
          Interesses
        </button>
        <button
          onClick={() => { setLocalFilters(filters); setShowFilters(true) }}
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            border: `1px solid ${hasActiveFilters ? G_BORDER : 'rgba(255,255,255,0.08)'}`,
            background: hasActiveFilters ? G_SOFT : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={16} color={hasActiveFilters ? G : 'rgba(255,255,255,0.5)'} strokeWidth={1.5} />
        </button>
      </header>

      {/* Tabs principais: Vitrine | Resgates */}
      <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.05)`, flexShrink: 0 }}>
        {(['vitrine', 'resgates'] as MainTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            style={{
              flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-jakarta)', cursor: 'pointer', border: 'none',
              background: 'transparent', textTransform: 'capitalize',
              color: mainTab === tab ? G : 'rgba(255,255,255,0.30)',
              borderBottom: `2px solid ${mainTab === tab ? G : 'transparent'}`,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {tab === 'vitrine' ? 'Explorar' : 'Resgates'}
          </button>
        ))}
      </div>

      {mainTab === 'vitrine' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} style={{ color: G, animation: 'ui-spin 1s linear infinite' }} />
            </div>
          ) : !currentProfile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color={G} strokeWidth={1.5} />
              </div>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', margin: '0 0 4px' }}>Ninguem mais por aqui</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {hasActiveFilters ? 'Tente ajustar os filtros.' : 'Você já viu todos os perfis disponíveis.'}
              </p>
              <button onClick={load} style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${G_BORDER}`, background: G_SOFT, color: G, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
                Recarregar
              </button>
            </div>
          ) : (
            <>
              {/* Card area */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px 0', position: 'relative', overflow: 'hidden' }}>
                {/* Proximo card (fundo) */}
                {deck[1] && (
                  <div style={{
                    position: 'absolute', width: '100%', maxWidth: 380,
                    borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4',
                    background: BG_CARD, border: `1px solid ${G_BORDER2}`,
                    transform: 'scale(0.94)', opacity: 0.55, pointerEvents: 'none',
                  }}>
                    {(deck[1].photo_body ?? deck[1].photo_best) && (
                      <Image src={(deck[1].photo_body ?? deck[1].photo_best)!} alt="" fill style={{ objectFit: 'cover' }} sizes="380px" />
                    )}
                  </div>
                )}

                {/* Card atual */}
                <div
                  style={{
                    position: 'relative', width: '100%', maxWidth: 380,
                    borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4',
                    background: BG_CARD, border: `1px solid ${G_BORDER2}`,
                    transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotation}deg)`,
                    transition: isDragging ? 'none' : isSnapping ? 'transform 0.35s ease' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none', touchAction: 'none',
                  }}
                  onMouseDown={e => onDragStart(e.clientX, e.clientY)}
                  onMouseMove={e => onDragMove(e.clientX, e.clientY)}
                  onMouseUp={e => onDragEnd(e.clientX)}
                  onMouseLeave={() => onDragEnd()}
                  onTouchStart={e => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY) }}
                  onTouchMove={e => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY) }}
                  onTouchEnd={e => { e.preventDefault(); onDragEnd(e.changedTouches[0]?.clientX) }}
                >
                  {photo ? (
                    <Image src={photo} alt={currentProfile.name} fill style={{ objectFit: 'cover', pointerEvents: 'none' }} sizes="380px" />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a0d08 0%, #2a1505 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={48} color={G_BORDER} strokeWidth={1} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.20) 55%, transparent 100%)', pointerEvents: 'none' }} />

                  {/* CURTIR indicator */}
                  <div style={{ position: 'absolute', top: 20, left: 16, padding: '5px 12px', borderRadius: 8, border: '3px solid #10b981', transform: 'rotate(-15deg)', opacity: likeOpacity, pointerEvents: 'none' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#10b981', letterSpacing: 1 }}>CURTIR</span>
                  </div>

                  {/* PASSAR indicator */}
                  <div style={{ position: 'absolute', top: 20, right: 16, padding: '5px 12px', borderRadius: 8, border: `3px solid ${G}`, transform: 'rotate(15deg)', opacity: passOpacity, pointerEvents: 'none' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: G, letterSpacing: 1 }}>PASSAR</span>
                  </div>

                  {/* Info do perfil */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 16px 12px', pointerEvents: 'none' }}>
                    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#fff', fontWeight: 700, margin: '0 0 4px' }}>
                      {currentProfile.name}{currentProfile.age ? `, ${currentProfile.age}` : ''}
                    </p>
                    {(currentProfile.city || currentProfile.state) && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} strokeWidth={1.5} />
                        {[currentProfile.city, currentProfile.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {Array.isArray(currentProfile.camarote_interests) && currentProfile.camarote_interests.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(currentProfile.camarote_interests as string[]).slice(0, 3).map((cat: string) => {
                          const found = CATEGORIAS.find(c => c.key === cat)
                          return found ? (
                            <span key={cat} style={{ padding: '3px 10px', borderRadius: 100, background: G_SOFT, border: `1px solid ${G_BORDER}`, fontSize: 11, color: G, fontWeight: 600 }}>
                              {found.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botoes de acao */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '16px 0 20px', flexShrink: 0 }}>
                <button
                  onClick={() => triggerSwipe('left')}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${G_BORDER}`, background: G_SOFT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={24} color={G} strokeWidth={2} />
                </button>
                <button
                  onClick={() => triggerSwipe('right')}
                  style={{
                    width: 66, height: 66, borderRadius: '50%',
                    border: 'none', background: `linear-gradient(135deg, #c9a84c, ${G})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: `0 6px 24px rgba(245,158,11,0.30)`,
                  }}
                >
                  <Heart size={28} color="#fff" strokeWidth={2} fill="#fff" />
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', marginBottom: 8, flexShrink: 0 }}>
                {deck.length} {deck.length !== 1 ? 'perfis' : 'perfil'} disponivel
              </p>
            </>
          )}
        </div>
      ) : (
        <ResgatesSection />
      )}

      {/* Bottom sheet de filtros */}
      {showFilters && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowFilters(false) }}
        >
          <div style={{ width: '100%', maxWidth: 480, background: BG_CARD, borderRadius: '24px 24px 0 0', borderTop: `1px solid ${G_BORDER2}`, padding: '20px 24px 40px', animation: 'ui-slide-up 0.25s ease' }}>
            <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff', margin: 0 }}>Filtros</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="rgba(255,255,255,0.40)" />
              </button>
            </div>

            {/* Cidade */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={localFilters.city}
                onChange={e => setLocalFilters(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Estado */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Estado</label>
              <select
                value={localFilters.state}
                onChange={e => setLocalFilters(f => ({ ...f, state: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: BG_CARD, border: '1px solid rgba(255,255,255,0.08)', color: localFilters.state ? '#fff' : 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)', fontSize: 14, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Todos os estados</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            {/* Faixa etaria */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Idade — {localFilters.ageMin} a {localFilters.ageMax} anos
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <input type="range" min={18} max={localFilters.ageMax} value={localFilters.ageMin}
                    onChange={e => setLocalFilters(f => ({ ...f, ageMin: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: G }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
                    <span>Min: {localFilters.ageMin}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="range" min={localFilters.ageMin} max={75} value={localFilters.ageMax}
                    onChange={e => setLocalFilters(f => ({ ...f, ageMax: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: G }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
                    <span>Max: {localFilters.ageMax}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setLocalFilters(DEFAULT_FILTERS) }}
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'transparent', color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Limpar
              </button>
              <button
                onClick={applyFilters}
                style={{ flex: 2, padding: '13px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, #c9a84c, ${G})`, color: '#fff', fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card da vitrine ───────────────────────────────────────────────────────────

function VitrinCard({
  profile,
  liked,
  onLike,
}: {
  profile: Profile
  liked: boolean
  onLike: () => void
}) {
  const photo = profile.photo_body ?? profile.photo_best

  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '3/4', background: BG_CARD, border: `1px solid ${G_BORDER2}` }}>
      {photo ? (
        <Image src={photo} alt={profile.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a0d08 0%, #2a1505 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Crown size={32} color={G_BORDER} strokeWidth={1} />
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.20) 50%, transparent 100%)' }} />

      {/* Info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 8px' }}>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, color: '#fff', fontWeight: 700, margin: '0 0 2px', lineHeight: 1.2 }}>
          {profile.name}{profile.age ? `, ${profile.age}` : ''}
        </p>
        {profile.city && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={9} strokeWidth={1.5} />
            {profile.city}{profile.state ? `, ${profile.state}` : ''}
          </p>
        )}
        <button
          onClick={onLike}
          style={{
            width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: liked ? G_SOFT : `linear-gradient(135deg, #c9a84c, ${G})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <Heart size={13} color={liked ? G : '#fff'} strokeWidth={liked ? 1.5 : 2} fill={liked ? 'none' : '#fff'} />
          <span style={{ fontSize: 12, fontWeight: 700, color: liked ? G : '#fff' }}>
            {liked ? 'Curtido' : 'Curtir'}
          </span>
        </button>
      </div>
    </div>
  )
}

// ─── Tipos para resgates ───────────────────────────────────────────────────────

interface AccessRequest {
  id: string
  requester_id: string
  category: string
  tier: string
  city: string
  state: string
  age: number
  display_name: string
  created_at: string
}

interface RescuedRequest {
  id: string
  requester_id: string
  category: string
  city: string
  state: string
  age: number
  display_name: string
  rescued_at: string
  expires_at: string
}

// ─── Opcoes de avaliacao (compartilhado) ───────────────────────────────────────

const BACKSTAGE_RATING_OPTIONS = [
  { key: 'bom_papo',  label: 'Bom de papo',              icon: ThumbsUp,       color: '#2ec4a0' },
  { key: 'sairam',    label: 'Sairam para se conhecer',  icon: HeartHandshake, color: '#E11D48' },
  { key: 'objetivo',  label: 'Alcancaram o objetivo',    icon: Trophy,         color: G         },
  { key: 'bolo',      label: 'Levou bolo',               icon: ThumbsDown,     color: 'rgba(248,249,250,0.40)' },
  { key: 'denuncia',  label: 'Denunciar',                icon: Flag,           color: '#f87171' },
]

function isRated(requestId: string): boolean {
  if (typeof window === 'undefined') return false
  const v = localStorage.getItem(`camarote_rating_${requestId}`)
  return !!v && v !== 'skip'
}

// ─── Resgates ─────────────────────────────────────────────────────────────────

function ResgatesSection() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [rescued, setRescued] = useState<RescuedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFor, setRatingFor] = useState<{ id: string; otherId: string } | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [camaroteCheckoutOpen, setCamaroteCheckoutOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user?.id])

  async function load() {
    setLoading(true)
    try {
      const [{ data: avail }, { data: mine }] = await Promise.all([
        supabase.rpc('get_available_requests', { p_user_id: user!.id }),
        supabase.rpc('get_my_rescued_requests', { p_user_id: user!.id }),
      ])
      setRequests(avail ?? [])
      const myRescued = mine ?? []
      setRescued(myRescued)
      // Inicializa quais ja foram avaliados
      const done = new Set<string>(myRescued.filter((r: RescuedRequest) => isRated(r.id)).map((r: RescuedRequest) => r.id))
      setRatedIds(done)
    } catch {
      setRequests([])
      setRescued([])
    }
    setLoading(false)
  }

  async function submitRating(ratingKey: string) {
    if (!ratingFor || !user || ratingSubmitting) return
    setRatingSubmitting(true)
    try {
      await supabase.from('camarote_ratings').insert({
        request_id: ratingFor.id,
        rater_id:   user.id,
        rated_id:   ratingFor.otherId,
        rating:     ratingKey,
      })
    } catch { /* silencioso */ }
    localStorage.setItem(`camarote_rating_${ratingFor.id}`, ratingKey)
    setRatedIds(prev => new Set([...prev, ratingFor!.id]))
    setRatingFor(null)
    setRatingSubmitting(false)
  }

  function handleResgate(_req: AccessRequest) {
    setCamaroteCheckoutOpen(true)
  }

  function daysLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const catLabel = (key: string) => CATEGORIAS.find(c => c.key === key)?.label ?? key

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: G }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px', paddingBottom: 40 }}>

      {/* Header da secao */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Pedidos de acesso
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: G, fontWeight: 600 }}>
            {requests.length} aguardando
          </span>
          <button
            onClick={load}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <ChevronRight size={14} color={G} strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 18, background: BG_CARD, border: `1px solid ${G_BORDER2}`, marginBottom: 24 }}>
          <Crown size={28} color={G_BORDER} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', margin: '0 0 4px', fontWeight: 600 }}>
            Nenhum pedido no momento
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, margin: 0 }}>
            Quando alguem pedir acesso em suas categorias, aparece aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {requests.map(req => (
            <div
              key={req.id}
              style={{ padding: '14px 14px', borderRadius: 16, background: BG_CARD, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={19} color={G} strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-fraunces)' }}>
                    {req.display_name}{req.age ? `, ${req.age}` : ''}
                  </span>
                  {req.tier === 'premium' && (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontWeight: 600 }}>
                      Plus
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {req.city && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={9} strokeWidth={1.5} />
                      {req.city}{req.state ? `, ${req.state}` : ''}
                    </span>
                  )}
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 100, background: G_SOFT, color: G, fontWeight: 600 }}>
                    {catLabel(req.category)}
                  </span>
                </div>
              </div>

              {/* Botao de resgate */}
              <button
                onClick={() => handleResgate(req)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, #c9a84c, ${G})`,
                  color: '#fff',
                  fontFamily: 'var(--font-jakarta)',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                Resgatar<br />
                <span style={{ fontWeight: 500 }}>R$ 15,00</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Meus resgates ativos */}
      {rescued.length > 0 && (
        <>
          <div style={{ marginBottom: 14, padding: '0 2px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Meus resgates ativos
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rescued.map(r => (
              <div
                key={r.id}
                style={{ padding: '14px 16px', borderRadius: 16, background: BG_CARD, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Crown size={16} color={G} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-fraunces)' }}>
                    {r.display_name}{r.age ? `, ${r.age}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>{catLabel(r.category)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} strokeWidth={1.5} />
                      {daysLeft(r.expires_at)} dias restantes
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {/* Botao avaliar (so se nao avaliou ainda) */}
                  {!ratedIds.has(r.id) && (
                    <button
                      onClick={() => setRatingFor({ id: r.id, otherId: r.requester_id })}
                      title="Avaliar conversa"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${G_BORDER}`, background: G_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Star size={15} color={G} strokeWidth={1.5} />
                    </button>
                  )}
                  <a
                    href={`/backstage/chat/${r.id}`}
                    style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, #c9a84c, ${G})`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <MessageCircle size={16} color="#fff" strokeWidth={2} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Nota explicativa */}
      <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', lineHeight: 1.6, margin: 0 }}>
          Ao resgatar, voce paga R$ 49,90 para iniciar uma conversa por 30 dias. Isso nao e garantia de encontro — apenas o inicio de uma conversa.
        </p>
      </div>

      {/* Checkout Camarote */}
      {camaroteCheckoutOpen && user && (
        <CheckoutModal
          open={camaroteCheckoutOpen}
          onClose={() => setCamaroteCheckoutOpen(false)}
          type="camarote"
          description="Camarote Black — Acesso por 30 dias"
          metadata={{ resgatado_id: user.id }}
        />
      )}

      {/* Overlay de avaliacao */}
      {ratingFor && (
        <>
          <div onClick={() => setRatingFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: BG_CARD, borderTop: `1px solid ${G_BORDER}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 36px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={16} color={G} strokeWidth={1.5} />
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', fontWeight: 700 }}>
                  Como foi essa conversa?
                </span>
              </div>
              <button onClick={() => setRatingFor(null)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
              Sua avaliacao e anonima.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BACKSTAGE_RATING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.key}
                    onClick={() => submitRating(opt.key)}
                    disabled={ratingSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: opt.key === 'denuncia' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.07)', cursor: ratingSubmitting ? 'default' : 'pointer', textAlign: 'left', width: '100%', opacity: ratingSubmitting ? 0.5 : 1, fontFamily: 'var(--font-jakarta)' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={opt.color} strokeWidth={1.5} />
                    </div>
                    <span style={{ fontSize: 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontWeight: 500 }}>{opt.label}</span>
                    {ratingSubmitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setRatingFor(null)} style={{ marginTop: 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}>
              Agora nao
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tela bloqueada (não-Black) ────────────────────────────────────────────────

function CamaroteBlocked({ plan, onBack }: { plan: 'plus' | 'essencial'; onBack: () => void }) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [rescuedChats, setRescuedChats] = useState<{ id: string; category: string; rescuer_name: string; rescued_by: string }[]>([])
  const [ratingFor, setRatingFor] = useState<{ id: string; otherId: string } | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    supabase
      .from('access_requests')
      .select('id, category, rescued_by')
      .eq('requester_id', user.id)
      .eq('status', 'rescued')
      .gt('expires_at', new Date().toISOString())
      .then(async ({ data }) => {
        if (!data?.length) return
        const ids = data.map(r => r.rescued_by)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ids)
        const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))
        const chats = data.map(r => ({ id: r.id, category: r.category, rescuer_name: nameMap[r.rescued_by] ?? 'Alguem', rescued_by: r.rescued_by }))
        setRescuedChats(chats)
        const done = new Set<string>(chats.filter(c => isRated(c.id)).map(c => c.id))
        setRatedIds(done)
      })
  }, [user?.id])

  async function submitRatingBlocked(ratingKey: string) {
    if (!ratingFor || !user || ratingSubmitting) return
    setRatingSubmitting(true)
    try {
      await supabase.from('camarote_ratings').insert({
        request_id: ratingFor.id,
        rater_id:   user.id,
        rated_id:   ratingFor.otherId,
        rating:     ratingKey,
      })
    } catch { /* silencioso */ }
    localStorage.setItem(`camarote_rating_${ratingFor.id}`, ratingKey)
    setRatedIds(prev => new Set([...prev, ratingFor!.id]))
    setRatingFor(null)
    setRatingSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG_DARK, fontFamily: 'var(--font-jakarta)', overflow: 'hidden', position: 'relative' }}>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </button>
        <Crown size={18} color={G} strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff' }}>Camarote Black</span>
      </header>

      {/* Grade borrada de preview */}
      <div style={{ position: 'absolute', inset: 0, top: 68, filter: 'blur(16px)', opacity: 0.18, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 12px' }}>
          {[
            'linear-gradient(160deg,#3d1520,#1a0a0f)',
            'linear-gradient(160deg,#1a1a0a,#3d3010)',
            'linear-gradient(160deg,#0a1a3d,#0d2040)',
            'linear-gradient(160deg,#2a0a3d,#1a0828)',
            'linear-gradient(160deg,#3d1a0a,#2a1005)',
            'linear-gradient(160deg,#0a3d1a,#082a10)',
          ].map((bg, i) => (
            <div key={i} style={{ borderRadius: 16, aspectRatio: '3/4', background: bg }} />
          ))}
        </div>
      </div>

      {/* Overlay escuro */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,6,8,0.3) 0%, rgba(5,6,8,0.85) 60%, rgba(5,6,8,0.98) 100%)' }} />

      {/* Conteudo principal */}
      <div style={{ position: 'relative', zIndex: 5, padding: '40px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Icone */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: G_SOFT, border: `1.5px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Lock size={28} color={G} strokeWidth={1.5} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, color: '#fff', margin: '0 0 10px', textAlign: 'center', lineHeight: 1.2 }}>
          Camarote Black
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 300 }}>
          Um ambiente exclusivo para experiencias que vao alem do comum. Apenas assinantes Black tem acesso.
        </p>

        {/* Categorias travadas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {CATEGORIAS.map(cat => (
            <div
              key={cat.key}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: `1px solid rgba(255,255,255,0.07)`, background: 'rgba(255,255,255,0.04)' }}
            >
              <Lock size={10} color="rgba(255,255,255,0.25)" strokeWidth={2} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Chats ativos (foi resgatado) */}
        {rescuedChats.length > 0 && (
          <div style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center' }}>
              Você foi resgatado
            </p>
            {rescuedChats.map(chat => (
              <div
                key={chat.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: G_SOFT, border: `1px solid ${G_BORDER}`, marginBottom: 8 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Crown size={15} color={G} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{chat.rescuer_name}</p>
                  <p style={{ fontSize: 11, color: G, margin: 0 }}>{CATEGORIAS.find(c => c.key === chat.category)?.label ?? chat.category}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!ratedIds.has(chat.id) && (
                    <button
                      onClick={() => setRatingFor({ id: chat.id, otherId: chat.rescued_by })}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${G_BORDER}`, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Star size={13} color={G} strokeWidth={1.5} />
                    </button>
                  )}
                  <a
                    href={`/backstage/chat/${chat.id}`}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <MessageCircle size={14} color={G} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botoes */}
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="/planos"
            style={{ display: 'block', width: '100%', padding: '15px', borderRadius: 16, textAlign: 'center', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-jakarta)', textDecoration: 'none', background: `linear-gradient(135deg, #c9a84c, ${G}, #fbbf24)`, color: '#fff', boxSizing: 'border-box' }}
          >
            Assinar Black — R$ 99,97/mes
          </a>
          <button
            onClick={() => setShowModal(true)}
            style={{ width: '100%', padding: '14px', borderRadius: 16, border: `1px solid rgba(245,158,11,0.35)`, background: 'rgba(245,158,11,0.10)', color: '#F59E0B', fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            Pedir acesso ao Camarote
          </button>
        </div>
      </div>

      {showModal && (
        <CamaroteAccessModal user={user} plan={plan} onClose={() => setShowModal(false)} />
      )}

      {/* Overlay de avaliacao */}
      {ratingFor && (
        <>
          <div onClick={() => setRatingFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: BG_CARD, borderTop: `1px solid ${G_BORDER}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 36px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={16} color={G} strokeWidth={1.5} />
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: '#fff', fontWeight: 700 }}>Como foi essa conversa?</span>
              </div>
              <button onClick={() => setRatingFor(null)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} color="rgba(255,255,255,0.50)" strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>Sua avaliacao e anonima.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BACKSTAGE_RATING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button key={opt.key} onClick={() => submitRatingBlocked(opt.key)} disabled={ratingSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: opt.key === 'denuncia' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.07)', cursor: ratingSubmitting ? 'default' : 'pointer', textAlign: 'left', width: '100%', opacity: ratingSubmitting ? 0.5 : 1, fontFamily: 'var(--font-jakarta)' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={opt.color} strokeWidth={1.5} />
                    </div>
                    <span style={{ fontSize: 15, color: opt.key === 'denuncia' ? '#f87171' : '#fff', fontWeight: 500 }}>{opt.label}</span>
                    {ratingSubmitting && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)', marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setRatingFor(null)} style={{ marginTop: 14, width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-jakarta)' }}>
              Agora nao
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Modal de pedido de acesso ─────────────────────────────────────────────────

function CamaroteAccessModal({
  user,
  plan,
  onClose,
}: {
  user: any
  plan: 'plus' | 'essencial'
  onClose: () => void
}) {
  const [selectedCat, setSelectedCat] = useState<string>('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!user || !selectedCat || !accepted) return
    setLoading(true)
    try {
      await supabase.rpc('create_access_request', {
        p_requester_id: user.id,
        p_target_id: null,
        p_type: selectedCat,
        p_tier: plan === 'plus' ? 'premium' : 'basic',
      })
      setSent(true)
    } catch {
      // RPC pode nao existir ainda (Fase 2)
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 480, background: BG_CARD, borderRadius: '24px 24px 0 0', borderTop: `1px solid ${G_BORDER2}`, maxHeight: '92vh', overflowY: 'auto', animation: 'ui-slide-up 0.25s ease' }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', margin: '16px auto 0' }} />

        <div style={{ padding: '20px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#fff', margin: 0 }}>Como funciona o acesso</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="rgba(255,255,255,0.40)" />
            </button>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={48} color={G} strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: '#fff', margin: '0 0 8px' }}>Pedido enviado!</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6, margin: 0 }}>
                Assinantes Black da categoria <strong style={{ color: G }}>{CATEGORIAS.find(c => c.key === selectedCat)?.label}</strong> foram notificados. Se alguem pagar, voce recebera uma notificacao para iniciar a conversa.
              </p>
            </div>
          ) : (
            <>
              {/* Secao 1: o que recebe sendo resgatado */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: G, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>O que voce recebe sendo resgatado</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Um assinante Black paga R$ 15 para iniciar uma conversa com voce',
                    'Você e o resgatador terão acesso ao chat exclusivo do Camarote por 30 dias',
                    'O que acontece depende da conversa entre vocês — não é garantia de nada',
                    'Assinantes Black da sua categoria sao notificados assim que voce pede acesso',
                    'Quem pagar primeiro tem acesso — os demais nao veem mais o seu pedido',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={14} color={G} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secao 2: com o Black voce teria */}
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>Com o plano Black voce teria</p>
                {[
                  'Acesso completo a vitrine do Camarote',
                  'Interacao com todos os Black disponiveis',
                  'Categorias de fetiche e Sugar desbloqueadas',
                  'Chat exclusivo preto e dourado',
                  'Curtidas ilimitadas, SuperCurtidas, Boosts e muito mais',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < 4 ? 6 : 0 }}>
                    <Crown size={12} color={G} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '12px 0 0', fontStyle: 'italic' }}>
                  Ser resgatado e apenas um gostinho. Nao tem comparacao com ser assinante Black.
                </p>
              </div>

              {/* Aviso importante */}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: `1px solid ${G_BORDER}`, marginBottom: 20, display: 'flex', gap: 10 }}>
                <AlertTriangle size={15} color={G} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.80)', lineHeight: 1.55, margin: 0 }}>
                  <strong>Importante:</strong> isso não é uma compra de serviço. O assinante está pagando para iniciar uma conversa, não por qualquer ato. O que acontece entre vocês é resultado da troca e da conexão — não de uma transação.
                </p>
              </div>

              {/* Selecao de categoria */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>Em qual categoria voce quer entrar?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCat(cat.key)}
                      style={{
                        padding: '11px 10px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${selectedCat === cat.key ? G : 'rgba(255,255,255,0.08)'}`,
                        background: selectedCat === cat.key ? G_SOFT : 'rgba(255,255,255,0.03)',
                        color: selectedCat === cat.key ? G : 'rgba(255,255,255,0.40)',
                        fontFamily: 'var(--font-jakarta)', fontWeight: selectedCat === cat.key ? 700 : 400,
                        fontSize: 13, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <div
                  onClick={() => setAccepted(a => !a)}
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: accepted ? G : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${accepted ? G : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {accepted && <Check size={12} color="#fff" strokeWidth={2.5} />}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', lineHeight: 1.55 }}>
                  Entendo que isso não é uma compra de serviço e que o resultado depende da troca entre nós dois.
                </span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={!selectedCat || !accepted || loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 16, border: 'none', cursor: selectedCat && accepted ? 'pointer' : 'not-allowed',
                  background: selectedCat && accepted ? `linear-gradient(135deg, #c9a84c, ${G})` : 'rgba(255,255,255,0.05)',
                  color: selectedCat && accepted ? '#fff' : 'rgba(255,255,255,0.20)',
                  fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar pedido de acesso'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

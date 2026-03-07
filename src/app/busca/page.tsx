'use client'

import { useEffect, useState } from 'react'
import { useSearch, SearchFilters } from '@/hooks/useSearch'
import Image from 'next/image'
import { MapPin, SlidersHorizontal, X, Bookmark, RotateCcw, Search, AlertCircle, Loader2 } from 'lucide-react'

// ─── Constantes ──────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'cis_woman', label: 'Mulher' },
  { value: 'cis_man', label: 'Homem' },
  { value: 'trans_woman', label: 'Mulher Trans' },
  { value: 'trans_man', label: 'Homem Trans' },
  { value: 'nonbinary', label: 'Não-binário' },
  { value: 'fluid', label: 'Gênero Fluido' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BuscaPage() {
  const {
    filters,
    setFilters,
    results,
    loading,
    error,
    locationGranted,
    savedFilters,
    search,
    saveFilters,
    resetFilters,
    updateLocation,
  } = useSearch()

  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Ao abrir o painel, sincroniza filtros locais
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters, showFilters])

  // Ao entrar na página, pede localização e busca
  useEffect(() => {
    handleInitialSearch()
  }, [])

  async function handleInitialSearch() {
    await updateLocation()
    search()
  }

  async function handleApplyFilters() {
    setFilters(localFilters)
    setShowFilters(false)
    await search(localFilters)
  }

  async function handleSaveFilters() {
    setFilters(localFilters)
    await saveFilters()
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  function handleReset() {
    resetFilters()
    setLocalFilters({ maxDistanceKm: 50, minAge: 18, maxAge: 99, gender: 'all' })
  }

  const filtersChanged =
    JSON.stringify(localFilters) !== JSON.stringify(savedFilters)

  return (
    <div className="min-h-screen bg-[#0e0b14] text-white font-jakarta">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <h1 className="font-fraunces text-2xl text-white">
          <span className="italic text-[#b8f542]">Me</span>AndYou
        </h1>
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
        >
          <SlidersHorizontal size={15} />
          Filtros
          {filtersChanged && <span className="w-2 h-2 rounded-full bg-[#b8f542]" />}
        </button>
      </header>

      {/* ── Info de localização ── */}
      {!locationGranted && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-2 text-sm text-yellow-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>Ative a localização para ver pessoas perto de você.</span>
        </div>
      )}

      {/* ── Erro ── */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Resumo dos filtros ativos ── */}
      <div className="px-4 pt-4 pb-2 flex gap-2 flex-wrap text-xs text-white/50">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          até {filters.maxDistanceKm} km
        </span>
        <span>·</span>
        <span>{filters.minAge}–{filters.maxAge} anos</span>
        <span>·</span>
        <span>{GENDER_OPTIONS.find(g => g.value === filters.gender)?.label}</span>
      </div>

      {/* ── Grid de resultados ── */}
      <main className="px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/30">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Buscando pessoas perto de você…</span>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/30">
            <Search size={32} />
            <p className="text-sm text-center max-w-[220px]">
              Nenhum perfil encontrado com esses filtros. Tente aumentar o raio ou ajustar a faixa de idade.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 text-[#b8f542] text-xs underline"
            >
              Resetar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {results.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </main>

      {/* ── Painel de filtros (drawer) ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          {/* Drawer */}
          <div className="relative w-full bg-[#141020] rounded-t-3xl border-t border-white/10 p-6 z-10 max-h-[85vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-fraunces text-xl">Filtros de busca</h2>
              <button onClick={() => setShowFilters(false)}>
                <X size={20} className="text-white/40 hover:text-white" />
              </button>
            </div>

            {/* ── Distância ── */}
            <FilterSection title="Distância máxima">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">até</span>
                <span className="text-[#b8f542] font-semibold text-sm">
                  {localFilters.maxDistanceKm} km
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={300}
                step={5}
                value={localFilters.maxDistanceKm}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, maxDistanceKm: Number(e.target.value) })
                }
                className="w-full accent-[#b8f542]"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>5 km</span>
                <span>300 km</span>
              </div>
            </FilterSection>

            {/* ── Faixa de idade ── */}
            <FilterSection title="Faixa de idade">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Mínima</label>
                  <select
                    value={localFilters.minAge}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, minAge: Number(e.target.value) })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#b8f542]/50"
                  >
                    {Array.from({ length: 62 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={age}>{age} anos</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Máxima</label>
                  <select
                    value={localFilters.maxAge}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, maxAge: Number(e.target.value) })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#b8f542]/50"
                  >
                    {Array.from({ length: 62 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={age}>{age} anos</option>
                    ))}
                  </select>
                </div>
              </div>
            </FilterSection>

            {/* ── Gênero ── */}
            <FilterSection title="Gênero">
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setLocalFilters({ ...localFilters, gender: opt.value })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      localFilters.gender === opt.value
                        ? 'bg-[#b8f542] text-black border-[#b8f542] font-medium'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* ── Botões ── */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleApplyFilters}
                className="w-full py-3.5 rounded-2xl bg-[#b8f542] text-black font-semibold text-sm hover:bg-[#a8e030] transition"
              >
                Aplicar filtros
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveFilters}
                  className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <Bookmark size={14} />
                  {saveSuccess ? 'Salvo!' : 'Salvar filtros'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw size={14} />
                  Resetar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ProfileCard({ profile }: { profile: any }) {
  return (
    <a
      href={`/perfil/${profile.id}`}
      className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-[#b8f542]/30 transition aspect-[3/4] block"
    >
      {/* Foto */}
      {profile.photo_best ? (
        <Image
          src={profile.photo_best}
          alt={profile.name}
          fill
          className="object-cover group-hover:scale-105 transition duration-500"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center text-white/20 text-4xl">
          ?
        </div>
      )}

      {/* Gradiente inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-fraunces font-semibold text-sm leading-tight">
          {profile.name}, {profile.age}
        </p>
        <p className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
          <MapPin size={9} />
          {profile.distance_km < 1
            ? 'menos de 1 km'
            : `${profile.distance_km} km`}
        </p>
      </div>
    </a>
  )
}
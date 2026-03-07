// hooks/useSearch.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface SearchFilters {
  maxDistanceKm: number
  minAge: number
  maxAge: number
  gender: string
}

export interface ProfileResult {
  id: string
  name: string
  birthdate: string
  bio: string
  city: string
  state: string
  lat: number
  lng: number
  gender: string
  pronouns: string
  photo_best: string | null
  photo_verification: string | null
  distance_km: number
  age: number
}

const DEFAULT_FILTERS: SearchFilters = {
  maxDistanceKm: 50,
  minAge: 18,
  maxAge: 99,
  gender: 'all',
}

export function useSearch() {
  const supabase = createClient()
  const { user } = useAuth()

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<ProfileResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SearchFilters | null>(null)

  // Carregar filtros salvos do Supabase
  useEffect(() => {
    if (!user) return
    loadSavedFilters()
  }, [user])

  async function loadSavedFilters() {
    if (!user) return
    const { data } = await supabase
      .from('filters')
      .select('search_max_distance_km, search_min_age, search_max_age, search_gender, search_saved')
      .eq('user_id', user.id)
      .single()

    if (data && data.search_saved) {
      const saved: SearchFilters = {
        maxDistanceKm: data.search_max_distance_km ?? 50,
        minAge: data.search_min_age ?? 18,
        maxAge: data.search_max_age ?? 99,
        gender: data.search_gender ?? 'all',
      }
      setFilters(saved)
      setSavedFilters(saved)
    }
  }

  // Atualizar localização do usuário
  async function updateLocation(): Promise<boolean> {
    if (!user) return false

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          await supabase
            .from('profiles')
            .update({ lat, lng })
            .eq('id', user.id)
          setLocationGranted(true)
          resolve(true)
        },
        () => {
          setError('Precisamos da sua localização para buscar pessoas perto de você.')
          resolve(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Buscar perfis
  const search = useCallback(async (customFilters?: SearchFilters) => {
    if (!user) return
    setLoading(true)
    setError(null)

    const activeFilters = customFilters ?? filters

    try {
      const { data, error: rpcError } = await supabase.rpc('search_profiles', {
        current_user_id: user.id,
        max_distance_km: activeFilters.maxDistanceKm,
        min_age: activeFilters.minAge,
        max_age: activeFilters.maxAge,
      })

      if (rpcError) throw rpcError

      let filtered = data as ProfileResult[]

      // Filtro de gênero (feito no cliente pois já temos os dados)
      if (activeFilters.gender !== 'all') {
        filtered = filtered.filter((p) => p.gender === activeFilters.gender)
      }

      setResults(filtered)
    } catch (err: any) {
      setError('Erro ao buscar perfis. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, filters, supabase])

  // Salvar filtros favoritos
  async function saveFilters() {
    if (!user) return
    await supabase
      .from('filters')
      .update({
        search_max_distance_km: filters.maxDistanceKm,
        search_min_age: filters.minAge,
        search_max_age: filters.maxAge,
        search_gender: filters.gender,
        search_saved: true,
      })
      .eq('user_id', user.id)

    setSavedFilters(filters)
  }

  // Resetar filtros
  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  return {
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
  }
}
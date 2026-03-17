// src/hooks/useSearch.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
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
  // lat e lng NUNCA expostos em selects públicos — removidos da interface
  gender: string
  pronouns: string
  photo_best: string | null
  distance_km: number
  age: number
  profile_score?: number  // não exibir ao usuário — só para ordenação interna
  last_active_at?: string | null
  show_last_active?: boolean
}

const DEFAULT_FILTERS: SearchFilters = {
  maxDistanceKm: 50,
  minAge:        18,
  maxAge:        99,
  gender:        'all',
}

export function useSearch() {
  const { user } = useAuth()

  const [filters, setFilters]             = useState<SearchFilters>(DEFAULT_FILTERS)
  const [results, setResults]             = useState<ProfileResult[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)
  const [savedFilters, setSavedFilters]   = useState<SearchFilters | null>(null)

  useEffect(() => {
    if (!user) return
    loadSavedFilters()
  }, [user?.id])

  async function loadSavedFilters() {
    if (!user) return
    const { data } = await supabase
      .from('filters')
      .select('search_max_distance_km, search_min_age, search_max_age, search_gender, search_saved')
      .eq('user_id', user.id)
      .single()

    if (data?.search_saved) {
      const saved: SearchFilters = {
        maxDistanceKm: data.search_max_distance_km ?? 50,
        minAge:        data.search_min_age         ?? 18,
        maxAge:        data.search_max_age         ?? 99,
        gender:        data.search_gender          ?? 'all',
      }
      setFilters(saved)
      setSavedFilters(saved)
    }
  }

  async function updateLocation(): Promise<boolean> {
    if (!user) return false
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          await supabase
            .from('profiles')
            .update({ lat, lng, last_active_at: new Date().toISOString() })
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

  const search = useCallback(async (customFilters?: SearchFilters) => {
    if (!user) return
    setLoading(true)
    setError(null)

    const activeFilters = customFilters ?? filters

    try {
      // Captura localização em tempo real (nullable — RPC aceita null)
      const loc = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) { resolve(null); return }
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        )
      })

      const { data, error: rpcError } = await supabase.rpc('search_profiles', {
        p_user_id:         user.id,
        p_lat:             loc?.lat ?? null,
        p_lng:             loc?.lng ?? null,
        p_max_distance_km: activeFilters.maxDistanceKm,
        p_min_age:         activeFilters.minAge,
        p_max_age:         activeFilters.maxAge >= 99 ? 120 : activeFilters.maxAge,
        p_gender:          activeFilters.gender === 'all' ? null : activeFilters.gender,
      })

      if (rpcError) throw rpcError

      setResults((data as ProfileResult[]) ?? [])
    } catch (err: any) {
      setError('Erro ao buscar perfis. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, filters])

  async function saveFilters() {
    if (!user) return
    await supabase
      .from('filters')
      .update({
        search_max_distance_km: filters.maxDistanceKm,
        search_min_age:         filters.minAge,
        search_max_age:         filters.maxAge,
        search_gender:          filters.gender,
        search_saved:           true,
      })
      .eq('user_id', user.id)
    setSavedFilters(filters)
  }

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

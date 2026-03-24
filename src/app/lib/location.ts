// src/app/lib/location.ts
// Obtém localização do usuário (GPS primeiro, fallback por IP) e salva no perfil.

import { supabase } from './supabase'

/** Tenta GPS. Se recusado/indisponível, usa IP. Salva lat/lng no perfil. */
export async function saveUserLocation(userId: string): Promise<void> {
  const loc = await getLocation()
  if (!loc) return
  await supabase
    .from('profiles')
    .update({ lat: loc.lat, lng: loc.lng, last_seen: new Date().toISOString() })
    .eq('id', userId)
}

/** Retorna {lat, lng} via GPS ou IP. Nunca lança exceção. */
export async function getLocation(): Promise<{ lat: number; lng: number } | null> {
  const gps = await tryGPS()
  if (gps) return gps
  return tryIPFallback()
}

function tryGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, enableHighAccuracy: true }
    )
  })
}

async function tryIPFallback(): Promise<{ lat: number; lng: number } | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      return { lat: data.latitude, lng: data.longitude }
    }
  } catch {
    // sem internet, timeout ou serviço indisponível — não bloqueia
  }
  return null
}

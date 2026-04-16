// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProfileData {
  bio: string
  photo_face: string | null
  photo_body: string | null
  photo_side: string | null
  photo_extra1: string | null
  photo_extra2: string | null
  photo_extra3: string | null
  photo_best: string | null
  highlight_tags: string[]
  highlight_tags_edited_at: string | null
  profile_edited_at: string | null
  status_temp: string | null
  status_temp_expires_at: string | null
  profile_question: string | null
  profile_question_answer: string | null
}

// ─── Helpers de rate limit ────────────────────────────────────────────────────

export function horasRestantes(iso: string | null, horas: number): number {
  if (!iso) return 0
  const diff = horas * 3600000 - (Date.now() - new Date(iso).getTime())
  return diff > 0 ? Math.ceil(diff / 3600000) : 0
}

export function diasRestantes(iso: string | null, dias: number): number {
  if (!iso) return 0
  const diff = dias * 86400000 - (Date.now() - new Date(iso).getTime())
  return diff > 0 ? Math.ceil(diff / 86400000) : 0
}

// ─── Utils de conversão filters → estado UI ──────────────────────────────────

export function findSingle(f: any, map: Record<string, string>): string {
  for (const [key, val] of Object.entries(map)) {
    if (f[key]) return val
  }
  return ''
}

export function findMulti(f: any, map: Record<string, string>): string[] {
  return Object.entries(map).filter(([key]) => f[key]).map(([, val]) => val)
}

// ─── Barra de completude ──────────────────────────────────────────────────────

export function calcCompletude(profileData: ProfileData | null, filtersData: any): number {
  let pts = 0, total = 0
  const fotoSlots = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
  const fotos = fotoSlots.filter(s => (profileData as any)?.[s]).length
  total += 6; pts += fotos
  total += 1; if (profileData?.bio && profileData.bio.length >= 30) pts += 1
  total += 1; if ((profileData?.highlight_tags?.length ?? 0) > 0) pts += 1
  total += 1; if (filtersData) pts += 1
  return Math.round((pts / total) * 100)
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const STATUS_OPCOES = [
  { id: 'filme_serie',    label: 'Querendo assistir um filme/série'    },
  { id: 'sair_comer',     label: 'Querendo sair para comer'            },
  { id: 'sair_beber',     label: 'Querendo sair para beber'            },
  { id: 'sair_conversar', label: 'Querendo sair para conversar'        },
  { id: 'praia',          label: 'Querendo curtir uma praia'           },
  { id: 'viagem',         label: 'Querendo viajar'                     },
  { id: 'video_chat',     label: 'Querendo conversar por vídeo'        },
  { id: 'treino',         label: 'Querendo companhia para treinar'     },
  { id: 'role',           label: 'Procurando rolê'                     },
]

export const DURACAO_OPCOES = [
  { horas: 2,  label: '2 horas'  },
  { horas: 4,  label: '4 horas'  },
  { horas: 8,  label: '8 horas'  },
  { horas: 24, label: '24 horas' },
]

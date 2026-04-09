import type { StatusPill } from './types'

export function calcTrustScore(profile: any, photos: string[], filters: any): number {
  let s = 0
  s += Math.min(photos.length * 8, 48)
  if (profile.bio && profile.bio.length > 30) s += 20
  if (profile.highlight_tags?.length > 0) s += 12
  if (filters) s += 10
  if (photos.length >= 5) s += 10
  return Math.min(s, 100)
}

export function getConquistas(profile: any, photos: string[]): { label: string }[] {
  const list: { label: string }[] = []
  if (photos.length >= 9) list.push({ label: 'Perfil completo' })
  else if (photos.length >= 5) list.push({ label: 'Galeria rica' })
  if (profile.bio?.length > 100) list.push({ label: 'Bio detalhada' })
  if (profile.highlight_tags?.length > 0) list.push({ label: 'Tags escolhidas' })
  return list
}

export function getStatusPills(userRow: any): StatusPill[] {
  if (!userRow) return []
  const pills: StatusPill[] = []
  const now = Date.now()
  const lastActive = userRow.last_seen ? new Date(userRow.last_seen).getTime() : 0
  const createdAt = userRow.created_at ? new Date(userRow.created_at).getTime() : 0
  if (lastActive && (now - lastActive) < 5 * 60 * 1000) {
    pills.push({ label: 'Online agora', bg: 'rgba(16,185,129,0.18)', color: '#10b981' })
  } else if (lastActive && (now - lastActive) < 24 * 60 * 60 * 1000) {
    pills.push({ label: 'Ativo hoje', bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' })
  }
  if (userRow.verified) {
    pills.push({ label: 'Verificado', bg: 'rgba(225,29,72,0.18)', color: '#F43F5E' })
  }
  if (userRow.verified_plus) {
    pills.push({ label: 'Verificado Plus', bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' })
  }
  if (createdAt && (now - createdAt) < 7 * 24 * 60 * 60 * 1000) {
    pills.push({ label: 'Novo no app', bg: 'rgba(96,165,250,0.18)', color: '#60a5fa' })
  }
  return pills.slice(0, 4)
}

export function getAparenciaTags(f: any): string[] {
  const tags: string[] = []
  if (f.eye_black) tags.push('Olhos pretos')
  if (f.eye_brown) tags.push('Olhos castanhos')
  if (f.eye_green) tags.push('Olhos verdes')
  if (f.eye_blue) tags.push('Olhos azuis')
  if (f.eye_honey) tags.push('Olhos mel')
  if (f.hair_black) tags.push('Cabelo preto')
  if (f.hair_brown) tags.push('Cabelo castanho')
  if (f.hair_blonde) tags.push('Cabelo loiro')
  if (f.hair_curly) tags.push('Cabelo cacheado')
  if (f.hair_coily) tags.push('Cabelo crespo')
  if (f.skin_white) tags.push('Pele branca')
  if (f.skin_black) tags.push('Pele negra')
  if (f.skin_mixed) tags.push('Parda')
  if (f.feat_tattoo) tags.push('Tatuagem')
  if (f.feat_piercing) tags.push('Piercing')
  if (f.feat_beard) tags.push('Barba')
  if (f.feat_glasses) tags.push('Oculos')
  return tags
}

export function getEstiloTags(f: any): string[] {
  const tags: string[] = []
  if (f.smoke_no) tags.push('Nao fuma')
  if (f.smoke_yes) tags.push('Fumante')
  if (f.drink_no) tags.push('Nao bebe')
  if (f.drink_socially) tags.push('Bebe socialmente')
  if (f.routine_gym) tags.push('Academia')
  if (f.routine_homebody) tags.push('Caseiro(a)')
  if (f.routine_party) tags.push('Balada')
  if (f.routine_morning) tags.push('Matutino(a)')
  if (f.routine_night_owl) tags.push('Noturno(a)')
  if (f.hob_gamer) tags.push('Gamer')
  if (f.hob_travel) tags.push('Viajante')
  if (f.hob_reader) tags.push('Leitor(a)')
  if (f.diet_vegan) tags.push('Vegano(a)')
  if (f.diet_vegetarian) tags.push('Vegetariano(a)')
  return tags
}

export function getPersonalidadeTags(f: any): string[] {
  const tags: string[] = []
  if (f.pers_extrovert) tags.push('Extrovertido(a)')
  if (f.pers_introvert) tags.push('Introvertido(a)')
  if (f.pers_calm) tags.push('Calmo(a)')
  if (f.pers_intense) tags.push('Intenso(a)')
  if (f.pers_communicative) tags.push('Comunicativo(a)')
  if (f.pers_shy) tags.push('Timido(a)')
  if (f.rel_evangelical) tags.push('Evangelico(a)')
  if (f.rel_catholic) tags.push('Catolico(a)')
  if (f.rel_atheist) tags.push('Ateu/Ateia')
  if (f.kids_has) tags.push('Tem filhos')
  if (f.kids_no) tags.push('Sem filhos')
  if (f.pet_dog) tags.push('Tem cachorro')
  if (f.pet_cat) tags.push('Tem gato')
  return tags
}

export function getObjetivosTags(f: any): string[] {
  const tags: string[] = []
  if (f.obj_serious) tags.push('Relacionamento serio')
  if (f.obj_casual) tags.push('Relacionamento casual')
  if (f.obj_friendship) tags.push('Amizade')
  if (f.obj_open) tags.push('Aberto a experiencias')
  if (f.obj_sugar_baby) tags.push('Sugar Baby')
  if (f.obj_sugar_daddy) tags.push('Sugar Daddy/Mommy')
  return tags
}

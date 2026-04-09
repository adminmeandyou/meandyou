export interface StatusPill {
  label: string
  bg: string
  color: string
}

export interface StatusChip {
  label: string
  bg: string
  color: string
  border: string
}

export interface EmblemaDef {
  id: string
  name: string
  raridade: 'comum' | 'incomum' | 'raro' | 'lendario'
  desc: string
  desbloqueado: boolean
  progresso: number
  total: number
}

export interface DbBadge {
  badge_id: string
  earned_at: string
  badges: {
    name: string
    description: string
    icon: string
    icon_url: string | null
    rarity: string
  }
}

export const STATUS_TEMP_LABELS: Record<string, string> = {
  filme_serie:    'Querendo assistir um filme/serie',
  sair_comer:     'Querendo sair para comer',
  sair_beber:     'Querendo sair para beber',
  sair_conversar: 'Querendo sair para conversar',
  praia:          'Querendo curtir uma praia',
  viagem:         'Querendo viajar',
  video_chat:     'Querendo conversar por video',
  treino:         'Querendo companhia para treinar',
  role:           'Procurando role',
  querendo_sair: 'Querendo sair',
  cafe:          'Cafe e conversa',
  academia:      'Academia',
  cinema:        'Cinema',
  estudando:     'Estudando',
  turistando:    'Turistando',
  bar:           'No bar',
}

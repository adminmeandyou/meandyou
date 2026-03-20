// src/app/lib/moderation.ts
// Moderação de conteúdo global — filtra palavras proibidas e detecta conteúdo crítico

// ─── Palavras que bloqueiam o envio ────────────────────────────────────────────
const PALAVRAS_PROIBIDAS: string[] = [
  // Ofensas racistas
  'macaco', 'macacos', 'crioulo', 'crioula', 'nego fedido', 'nega fedida',
  // Homofobia/transfobia
  'viado', 'viadinho', 'traveco', 'sapatao', 'bicha suja',
  // Misoginia
  'vaca gorda', 'vaca velha', 'piranha', 'prostituta', 'vagabunda do inferno',
  // Conteúdo sexual explícito
  'pornografia', 'porno', 'putaria', 'safadeza explicita', 'sexo com menores',
  // Ameaças
  'vou te matar', 'te mato', 'vou te bater', 'queimar sua casa', 'acabar com voce',
  // Spam / golpes
  'clique aqui e ganhe', 'renda extra agora', 'dinheiro facil', 'pix garantido',
  'ganhe 1000 reais', 'whatsapp 55', 'link para fora',
  // Dados pessoais forçados
  'me manda seu cpf', 'me passa sua senha', 'me da seu cartao',
]

// ─── Palavras críticas (bloqueiam + disparam alerta automático ao suporte) ──────
const PALAVRAS_CRITICAS: string[] = [
  // Exploração infantil
  'foto de crianca', 'foto de menor', 'crianca nua', 'menor pelado', 'cp',
  'pedofilia', 'pedofilo', 'abuso infantil',
  // Tráfico e crimes graves
  'trafico de drogas', 'traficante', 'vendo droga', 'cocaina', 'heroina',
  'vendo arma', 'pistola a venda', 'fuzil',
  // Ameaça de morte explícita
  'vou te estuprar', 'vou te sequestrar', 'sequestro', 'assassinato',
  'bomba explosivo',
]

export type ModerationResult = {
  blocked: boolean
  critical: boolean
  matchedWords: string[]
}

// ─── Normaliza texto para comparação (sem acentos, minúsculo) ─────────────────
function normalizar(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Verifica conteúdo e retorna resultado de moderação ───────────────────────
export function moderateContent(text: string): ModerationResult {
  const norm = normalizar(text)

  const matchedCritical = PALAVRAS_CRITICAS.filter(w => norm.includes(normalizar(w)))
  if (matchedCritical.length > 0) {
    return { blocked: true, critical: true, matchedWords: matchedCritical }
  }

  const matchedProibidas = PALAVRAS_PROIBIDAS.filter(w => norm.includes(normalizar(w)))
  if (matchedProibidas.length > 0) {
    return { blocked: true, critical: false, matchedWords: matchedProibidas }
  }

  return { blocked: false, critical: false, matchedWords: [] }
}

// ─── Mensagem amigável para o usuário ─────────────────────────────────────────
export function getModerationMessage(result: ModerationResult): string {
  if (!result.blocked) return ''
  if (result.critical) {
    return 'Esta mensagem foi bloqueada e reportada automaticamente ao nosso time de seguranca.'
  }
  return 'Esta mensagem contem conteudo que nao e permitido na plataforma.'
}

// ─── Filtra nome de sala (aplica mesmas regras ao criar salas privadas) ────────
export function moderateRoomName(name: string): ModerationResult {
  return moderateContent(name)
}

// ─── Verifica se texto contem dado pessoal sensivel (CPF, cartao) ─────────────
export function containsSensitiveData(text: string): boolean {
  // CPF: 000.000.000-00 ou 00000000000
  const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/
  // Numero de cartao (Luhn seria melhor mas regex simples ja ajuda)
  const cardRegex = /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/
  // Telefone com DDD
  const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/
  return cpfRegex.test(text) || cardRegex.test(text) || phoneRegex.test(text)
}

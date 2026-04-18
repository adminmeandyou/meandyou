export type SiteConfigPublic = {
  modo_site: 'normal' | 'lancamento' | 'gated'
  lancamento_ativo: boolean
  lancamento_inicio: string | null
  lancamento_fim: string | null
  lancamento_desconto_pct: number
  gate_ativo: boolean
  gate_titulo: string
  gate_mensagem: string
  obrigado_titulo: string
  obrigado_mensagem: string
  obrigado_msg_essencial: string
  obrigado_msg_plus: string
  obrigado_msg_black: string
  preco_essencial: number
  preco_plus: number
  preco_black: number
}

export type LandingContentMap = Record<string, Record<string, string>>

export const DEFAULT_CONFIG: SiteConfigPublic = {
  modo_site: 'normal',
  lancamento_ativo: false,
  lancamento_inicio: null,
  lancamento_fim: null,
  lancamento_desconto_pct: 0,
  gate_ativo: false,
  gate_titulo: 'Em breve',
  gate_mensagem: 'Algo incrível está chegando.',
  obrigado_titulo: 'Assinatura confirmada!',
  obrigado_mensagem: 'Bem-vindo(a) ao MeAndYou.',
  obrigado_msg_essencial: '',
  obrigado_msg_plus: '',
  obrigado_msg_black: '',
  preco_essencial: 14.90,
  preco_plus: 39.90,
  preco_black: 99.90,
}

export function formatBRL(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function pick(
  content: LandingContentMap,
  secao: string,
  chave: string,
  fallback: string,
): string {
  return content[secao]?.[chave] ?? fallback
}

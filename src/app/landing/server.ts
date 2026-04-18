import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CONFIG, type SiteConfigPublic, type LandingContentMap } from './types'

export { DEFAULT_CONFIG }
export type { SiteConfigPublic, LandingContentMap }

export async function getSiteConfig(): Promise<SiteConfigPublic> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_config_public')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return DEFAULT_CONFIG
    return {
      ...DEFAULT_CONFIG,
      ...data,
      preco_essencial: Number(data.preco_essencial ?? DEFAULT_CONFIG.preco_essencial),
      preco_plus: Number(data.preco_plus ?? DEFAULT_CONFIG.preco_plus),
      preco_black: Number(data.preco_black ?? DEFAULT_CONFIG.preco_black),
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function getLandingContent(pagina: 'oficial' | 'lancamento' = 'oficial'): Promise<LandingContentMap> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('landing_content')
      .select('secao, chave, valor')
      .eq('pagina', pagina)
      .order('ordem', { ascending: true })
    if (error || !data) return {}
    const map: LandingContentMap = {}
    for (const row of data as Array<{ secao: string; chave: string; valor: string }>) {
      if (!map[row.secao]) map[row.secao] = {}
      map[row.secao][row.chave] = row.valor
    }
    return map
  } catch {
    return {}
  }
}

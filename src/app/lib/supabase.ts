import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// getUser() faz uma chamada de rede segurando a trava da sessão. Ao abrir uma tela,
// vários componentes (useAuth, BadgeWatcher, a própria página) chamavam ao mesmo tempo,
// formavam fila na trava e um acabava "roubando" a do outro ("Lock broken by another
// request with the 'steal' option"), deixando a tela presa carregando.
// Chamadas simultâneas sem token passam a compartilhar a mesma requisição.
const getUserOriginal = supabase.auth.getUser.bind(supabase.auth)
let getUserEmAndamento: ReturnType<typeof getUserOriginal> | null = null

supabase.auth.getUser = ((jwt?: string) => {
  if (jwt) return getUserOriginal(jwt)
  if (!getUserEmAndamento) {
    getUserEmAndamento = getUserOriginal().finally(() => { getUserEmAndamento = null })
  }
  return getUserEmAndamento
}) as typeof supabase.auth.getUser

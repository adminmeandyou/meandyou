import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Portão de acesso ─────────────────────────────────────────────────────────
const GATE_COOKIE = 'may_gate'
const GATE_PATH = '/acesso'
const GATE_CACHE_TTL = 60_000

type ModoSite = 'normal' | 'lancamento' | 'gated'

type SiteCfg = {
  ativo: boolean
  senha: string
  modo_site: ModoSite
  lancamento_ativo: boolean
}

// Cache em memoria do site_config (por instancia). Lido via REST direto com
// service role para ter acesso a gate_senha (nao esta na view publica).
let siteCache: (SiteCfg & { expires: number }) | null = null

async function loadSiteConfig(): Promise<SiteCfg> {
  const now = Date.now()
  if (siteCache && siteCache.expires > now) {
    return {
      ativo: siteCache.ativo,
      senha: siteCache.senha,
      modo_site: siteCache.modo_site,
      lancamento_ativo: siteCache.lancamento_ativo,
    }
  }
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_config?id=eq.1&select=gate_ativo,gate_senha,modo_site,lancamento_ativo`
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const rows = (await res.json()) as Array<{
        gate_ativo?: boolean
        gate_senha?: string
        modo_site?: string
        lancamento_ativo?: boolean
      }>
      const row = rows[0]
      if (row) {
        const modo: ModoSite =
          row.modo_site === 'lancamento' || row.modo_site === 'gated' ? row.modo_site : 'normal'
        siteCache = {
          ativo: Boolean(row.gate_ativo),
          senha: String(row.gate_senha ?? ''),
          modo_site: modo,
          lancamento_ativo: Boolean(row.lancamento_ativo),
          expires: now + GATE_CACHE_TTL,
        }
        return {
          ativo: siteCache.ativo,
          senha: siteCache.senha,
          modo_site: siteCache.modo_site,
          lancamento_ativo: siteCache.lancamento_ativo,
        }
      }
    }
  } catch {
    // fallback abaixo
  }
  // Fallback seguro: gate desativado + modo normal se nao conseguir ler DB
  siteCache = {
    ativo: false,
    senha: '',
    modo_site: 'normal',
    lancamento_ativo: false,
    expires: now + 10_000,
  }
  return { ativo: false, senha: '', modo_site: 'normal', lancamento_ativo: false }
}

// Rotas protegidas (requer autenticação)
const PROTECTED_ROUTES = [
  '/modos', '/busca', '/match', '/matches', '/chat', '/perfil', '/planos', '/dashboard',
  '/conversas', '/loja', '/destaque', '/indicar', '/backstage',
  '/roleta', '/streak', '/onboarding', '/notificacoes', '/suporte',
  '/ajuda', '/deletar-conta', '/minha-assinatura', '/videochamada', '/curtidas',
  '/configuracoes', '/salas', '/amigos', '/casal', '/aguardando-email',
]

// Rotas públicas (redireciona para /busca se já logado)
const PUBLIC_ONLY_ROUTES = ['/login', '/cadastro', '/recuperar-senha', '/nova-senha']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Carrega config uma vez (cache 60s). Usado pelo gate + roteamento de /
  const site = !user && !pathname.startsWith('/api/')
    ? await loadSiteConfig()
    : { ativo: false, senha: '', modo_site: 'normal' as ModoSite, lancamento_ativo: false }

  // ── Portão full-site: bloqueia TODAS as rotas se gate_ativo = true ────────
  // Usuários autenticados passam direto — o gate é só para visitantes externos
  if (!user && pathname !== GATE_PATH && !pathname.startsWith('/api/') && site.ativo) {
    const gateCookie = req.cookies.get(GATE_COOKIE)?.value
    if (gateCookie !== site.senha) {
      return NextResponse.redirect(new URL(GATE_PATH, req.url))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Roteamento de / por modo_site (apenas visitantes nao logados) ────────
  // normal     → landing oficial (segue fluxo normal)
  // lancamento → redireciona para /lancamento (se lancamento_ativo=true)
  // gated      → redireciona para /acesso se nao tiver cookie valido
  //
  // Nota: modo_site='lancamento' so redireciona se lancamento_ativo=true para
  // evitar loop (Fase 4: /lancamento redireciona para / quando inativo).
  if (!user && pathname === '/') {
    if (site.modo_site === 'lancamento' && site.lancamento_ativo) {
      return NextResponse.redirect(new URL('/lancamento', req.url))
    }
    if (site.modo_site === 'gated') {
      const gateCookie = req.cookies.get(GATE_COOKIE)?.value
      if (site.senha && gateCookie !== site.senha) {
        return NextResponse.redirect(new URL(GATE_PATH, req.url))
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Proteção do Backstage (somente plano Black) ───────────────────────────
  if (pathname.startsWith('/backstage')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    if (profile?.plan !== 'black') {
      return NextResponse.redirect(new URL('/modos', req.url))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Proteção do painel admin ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') return res

    const { data: staff } = await supabase
      .from('staff_members')
      .select('role, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!staff) {
      return NextResponse.redirect(new URL('/modos', req.url))
    }

    const STAFF_PERMISSIONS: Record<string, string[]> = {
      gerente:            ['/admin', '/admin/financeiro', '/admin/usuarios', '/admin/denuncias', '/admin/cancelamentos'],
      suporte_financeiro: ['/admin', '/admin/financeiro', '/admin/cancelamentos'],
      suporte_tecnico:    ['/admin', '/admin/usuarios', '/admin/seguranca'],
      suporte_chat:       ['/admin', '/admin/denuncias', '/admin/cancelamentos'],
    }

    const allowed = STAFF_PERMISSIONS[staff.role] ?? []
    const hasAccess = allowed.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    return res
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const isPublicOnly = PUBLIC_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isPublicOnly && user) {
    return NextResponse.redirect(new URL('/modos', req.url))
  }

  if (user && isProtected) {
    const { data: userRow } = await supabase
      .from('users')
      .select('banned')
      .eq('id', user.id)
      .single()

    if (userRow?.banned) {
      return NextResponse.redirect(new URL('/banido', req.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('reg_credentials_set, reg_email_verified, reg_facial_verified, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      if (pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/modos', req.url))
      }
      return res
    }

    if (profile?.reg_facial_verified) {
      if (!pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
      return res
    }

    if (profile?.reg_email_verified) {
      if (!pathname.startsWith('/verificacao')) {
        return NextResponse.redirect(new URL('/verificacao', req.url))
      }
      return res
    }

    if (profile?.reg_credentials_set) {
      if (!pathname.startsWith('/aguardando-email')) {
        return NextResponse.redirect(new URL('/aguardando-email', req.url))
      }
      return res
    }

    if (profile?.reg_credentials_set === null || profile?.reg_credentials_set === undefined) {
      return res
    }

    return NextResponse.redirect(new URL('/cadastro', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
}

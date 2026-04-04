import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Portão de acesso ─────────────────────────────────────────────────────────
const GATE_SENHA = 'inativo123'
const GATE_COOKIE = 'may_gate'
const GATE_PATH = '/acesso'

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

  // ── Portão: bloqueia tudo exceto a própria página /acesso e sua API ──────
  if (pathname !== GATE_PATH && pathname !== '/api/acesso') {
    const gateCookie = req.cookies.get(GATE_COOKIE)?.value
    if (gateCookie !== GATE_SENHA) {
      return NextResponse.redirect(new URL(GATE_PATH, req.url))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
        return NextResponse.redirect(new URL('/dashboard', req.url))
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

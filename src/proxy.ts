// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas protegidas (requer autenticação)
// ⚠️ /verificacao NÃO está aqui: o link de verificação é aberto no celular do usuário
// que pode não ter sessão naquele dispositivo. A page /verificacao gerencia sua própria
// autenticação internamente via token na URL ou via supabase.auth.getUser().
const PROTECTED_ROUTES = [
  '/busca', '/match', '/matches', '/chat', '/perfil', '/planos', '/dashboard',
  '/conversas', '/loja', '/destaque', '/indicar', '/backstage',
  '/roleta', '/streak', '/onboarding', '/notificacoes', '/suporte',
  '/ajuda', '/deletar-conta', '/minha-assinatura', '/videochamada', '/curtidas',
  '/configuracoes', '/salas', '/amigos', '/casal',
]

// Rotas públicas (redireciona para /busca se já logado)
const PUBLIC_ONLY_ROUTES = ['/login', '/cadastro', '/recuperar-senha', '/nova-senha']

export async function proxy(req: NextRequest) {
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

    // Admin tem acesso total
    if (profile?.role === 'admin') return res

    // Verificar se é membro da equipe ativo
    const { data: staff } = await supabase
      .from('staff_members')
      .select('role, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!staff) {
      return NextResponse.redirect(new URL('/busca', req.url))
    }

    // Permissões por cargo — quais rotas cada role pode acessar
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
      // Redireciona para o dashboard admin, que mostrará apenas o que ele pode ver
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    return res
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Rota protegida sem login → redireciona para /login
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Rota pública com login → redireciona para /busca
  const isPublicOnly = PUBLIC_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isPublicOnly && user) {
    return NextResponse.redirect(new URL('/busca', req.url))
  }

  // Verificar se usuário está banido ou não verificado
  if (user && isProtected) {
    const { data: userRow } = await supabase
      .from('users')
      .select('banned, verified')
      .eq('id', user.id)
      .single()

    if (userRow?.banned) {
      return NextResponse.redirect(new URL('/banido', req.url))
    }

    if (!userRow?.verified && !pathname.startsWith('/verificacao')) {
      return NextResponse.redirect(new URL('/verificacao', req.url))
    }

    // Verificar se usuário concluiu o onboarding
    if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/perfil')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_done')
        .eq('id', user.id)
        .single()

      if (profile && profile.onboarding_done === false) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
}

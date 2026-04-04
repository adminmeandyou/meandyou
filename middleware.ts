import { NextRequest, NextResponse } from 'next/server'

const SENHA = 'inativo123'
const COOKIE = 'may_gate'
const GATE_PATH = '/acesso'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Libera a própria página de acesso e assets estáticos
  if (
    pathname === GATE_PATH ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  // Verifica o cookie
  const cookie = req.cookies.get(COOKIE)?.value
  if (cookie === SENHA) return NextResponse.next()

  // Sem acesso — redireciona para o portão
  const url = req.nextUrl.clone()
  url.pathname = GATE_PATH
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

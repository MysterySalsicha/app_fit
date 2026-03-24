import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — sempre acessíveis
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verifica presença do token (o localStorage não é acessível no middleware,
  // então usamos um cookie auxiliar "hf_auth" setado pelo client)
  const authCookie = request.cookies.get('hf_auth')

  if (!authCookie?.value && !pathname.startsWith('/_next')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}

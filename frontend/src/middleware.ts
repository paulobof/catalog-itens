import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

const PUBLIC_EXACT = new Set<string>([
  '/login',
  '/api/health',
  '/manifest.webmanifest',
])

const PUBLIC_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    return response
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)
  const session = cookie?.value ? await verifySessionToken(cookie.value) : null

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-|icon\\.svg).*)',
  ],
}

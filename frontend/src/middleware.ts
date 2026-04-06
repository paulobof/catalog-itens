import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/', '/api/health', '/manifest.webmanifest']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public paths and static assets
  if (isPublic(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    return response
  }

  // Check session cookie
  const session = request.cookies.get('catalog-session')
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and accessing /login, redirect to home
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-).*)',
  ],
}

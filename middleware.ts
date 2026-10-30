import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    pathname.startsWith('/usdc') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/card')

  if (!isProtected) return NextResponse.next()

  // getSessionCookie handles both "better-auth.session_token" (HTTP)
  // and "__Secure-better-auth.session_token" (HTTPS on Vercel) automatically
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set('x-session-token', sessionCookie)
  return response
}

export const config = {
  matcher: [
    '/usdc/:path*',
    '/services/:path*',
    '/settings/:path*',
    '/history/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/card/:path*',
  ],
}

import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'better-auth.session_token'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    pathname.startsWith('/usdc') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin')

  if (!isProtected) return NextResponse.next()

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set('x-session-token', sessionToken)
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
  ],
}

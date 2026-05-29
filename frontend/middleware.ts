import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/explore') || 
                           pathname.startsWith('/messages') ||
                           pathname.startsWith('/profile') ||
                           pathname.startsWith('/tutor')

  // Rutas de autenticación (no deberían verse si ya estás logueado)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/explore/:path*',
    '/messages/:path*',
    '/profile/:path*',
    '/tutor/:path*',
    '/login',
    '/register'
  ]
}
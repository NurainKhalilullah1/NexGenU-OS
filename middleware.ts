// middleware.ts — route protection + role-based redirects
// SECURITY: role is always read from the DB (users table), never from client cookie claims
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

async function getRoleFromDB(userId: string, request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role ?? null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSession(request)

  // Public routes — always allowed
  if (pathname.startsWith('/login')) {
    if (user) {
      const role = await getRoleFromDB(user.id, request)
      if (role === 'admin') return NextResponse.redirect(new URL('/command', request.url))
      if (role === 'head') return NextResponse.redirect(new URL('/head', request.url))
      return NextResponse.redirect(new URL('/member', request.url))
    }
    return response
  }

  // All other routes require auth
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control — role is read from DB, never from JWT/cookie
  if (pathname.startsWith('/command') || pathname.startsWith('/head') || pathname.startsWith('/member')) {
    const role = await getRoleFromDB(user.id, request)
    if (pathname.startsWith('/command') && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'head' ? '/head' : '/member', request.url))
    }
    if (pathname.startsWith('/head') && role !== 'head') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/command' : '/member', request.url))
    }
    if (pathname.startsWith('/member') && role !== 'member') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/command' : '/head', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.comores-market.com'
const BARE_HOST = 'comores-market.com'

export async function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const currentHost = request.headers.get('host') || request.nextUrl.host
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '')
  const isLocalHost = /localhost|127\.0\.0\.1/i.test(currentHost)

  if (
    process.env.NODE_ENV === 'production' &&
    !isLocalHost &&
    (currentHost === BARE_HOST || currentHost === CANONICAL_HOST) &&
    (currentHost !== CANONICAL_HOST || protocol !== 'https')
  ) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = 'https:'
    canonicalUrl.host = CANONICAL_HOST
    return NextResponse.redirect(canonicalUrl, 308)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedRoutes = ['/compte', '/messages', '/publier', '/favoris', '/mes-annonces', '/admin']
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/auth') && user && !request.nextUrl.pathname.includes('/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/compte'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
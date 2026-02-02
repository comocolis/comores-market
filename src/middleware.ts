import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. On prépare la réponse
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. On configure Supabase pour gérer les cookies
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

  // 3. On vérifie l'utilisateur (rafraîchissement du token)
  // IMPORTANT : On ne bloque pas si getUser échoue, on continue juste sans user
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Protection des routes
  const protectedRoutes = [
    '/compte',
    '/messages',
    '/publier',
    '/favoris',
    '/mes-annonces',
    '/admin'
  ]

  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // CAS 1 : Accès à une page protégée sans être connecté
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // CAS 2 : Déjà connecté et essaie d'aller sur /auth (Login/Register)
  // On exclut '/auth/callback' pour ne pas casser la confirmation d'email
  if (request.nextUrl.pathname.startsWith('/auth') && user && !request.nextUrl.pathname.includes('/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/compte'
    return NextResponse.redirect(url)
  }

  return response
}

// ✅ CONFIGURATION OPTIMISÉE POUR GOOGLE & PWA
export const config = {
  matcher: [
    /*
     * Matcher toutes les routes SAUF celles qui commencent par :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (icône)
     * - sitemap.xml (SEO - Important à exclure !)
     * - robots.txt (SEO - Important à exclure !)
     * - manifest.json (PWA)
     * - images (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
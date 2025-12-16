import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialiser la réponse (on laisse passer par défaut)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Créer le client Supabase pour gérer la session et les cookies
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

  // 3. Rafraîchir la session si nécessaire et récupérer l'utilisateur
  // IMPORTANT : getUser() est plus sûr que getSession() dans le middleware
  const { data: { user } } = await supabase.auth.getUser()

  // 4. DÉFINITION DES ZONES PROTÉGÉES
  // Si l'utilisateur n'est pas connecté, il ne peut pas aller ici :
  const protectedRoutes = [
    '/compte',
    '/messages',
    '/publier',
    '/favoris',
    '/mes-annonces',
    '/admin'
  ]

  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // SCÉNARIO A : On tente d'accéder à une page protégée SANS être connecté
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth' // Hop, direction la connexion
    return NextResponse.redirect(url)
  }

  // SCÉNARIO B : On est sur la page /auth ALORS qu'on est déjà connecté
  // (sauf si c'est la route de callback qui sert à valider l'email)
  if (request.nextUrl.pathname.startsWith('/auth') && user && !request.nextUrl.pathname.includes('/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/compte' // Hop, direction le compte
    return NextResponse.redirect(url)
  }

  // 5. Si tout est bon, on continue avec la réponse (et les cookies mis à jour)
  return response
}

// Configuration pour dire à Next.js où le middleware doit s'activer
export const config = {
  matcher: [
    /*
     * Applique le middleware à toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (icône)
     * - Les fichiers images (png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
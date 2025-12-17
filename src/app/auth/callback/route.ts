import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // 1. Récupération du code envoyé par email
  const code = searchParams.get('code')
  // Par défaut, on renvoie vers l'accueil, sauf si "next" est précisé (ex: /compte)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    // Création du client serveur pour manipuler les cookies de session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorer les erreurs si appelé depuis un Server Component
            }
          },
        },
      }
    )

    // 2. ÉCHANGE DU CODE CONTRE LA SESSION (C'est ça qui connecte l'utilisateur)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 3. Succès : On redirige l'utilisateur connecté vers la page demandée
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Erreur : Lien invalide ou expiré
  return NextResponse.redirect(`${origin}/auth?error=invalid_link`)
}
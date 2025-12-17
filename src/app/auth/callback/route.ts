import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // 1. On récupère le code et la destination
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/compte' // Par défaut vers /compte

  if (code) {
    const cookieStore = await cookies()

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
              // Ignore error if called from a Server Component
            }
          },
        },
      }
    )

    // 2. ÉCHANGE DU CODE (C'est ici que la magie opère)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 3. SUCCÈS : On redirige vers la page prévue (ex: /compte)
      // On s'assure que l'URL de redirection est absolue
      const forwardedHost = request.headers.get('x-forwarded-host') // Pour le déploiement (Netlify/Vercel)
      const isLocal = origin.includes('localhost')
      
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Auth Code Error:', error)
    }
  }

  // Échec : on renvoie vers l'auth avec une erreur
  return NextResponse.redirect(`${origin}/auth?error=invalid_link`)
}
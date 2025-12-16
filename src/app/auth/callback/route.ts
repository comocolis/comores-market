import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // 1. Récupération du code
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // CORRECTION ICI : on ajoute 'await' car cookies() est asynchrone dans Next.js 15
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
              // Parfois appelé depuis un Server Component, on ignore l'erreur
            }
          },
        },
      }
    )

    // 2. Échange du code contre la session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 3. Redirection si succès
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 4. Redirection si erreur
  return NextResponse.redirect(`${origin}/auth?error=auth_code_error`)
}
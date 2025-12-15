import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const cookieStore = request.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Si tout est bon, on redirige l'utilisateur vers la page prévue (ex: /compte/reset)
      // On nettoie l'URL en supprimant le token pour la sécurité
      const nextUrl = new URL(next, request.url)
      nextUrl.searchParams.delete('token_hash')
      nextUrl.searchParams.delete('type')
      return NextResponse.redirect(nextUrl)
    }
  }

  // Si erreur ou lien invalide, on renvoie vers une page d'erreur (ou l'accueil)
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // On analyse l'URL reçue (ex: comores-market.com/auth/callback?code=123&next=/compte/reset)
  const { searchParams, origin } = new URL(request.url)
  
  const code = searchParams.get('code')
  // On regarde s'il y a une destination précise (next), sinon on va à l'accueil
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // On échange le code temporaire contre une vraie session connectée
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ SUCCÈS : On redirige vers la page de reset (/compte/reset)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si le code est faux ou expiré, on renvoie à l'accueil avec une erreur
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
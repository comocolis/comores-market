import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // On récupère le code secret envoyé par Supabase
  const code = searchParams.get('code')
  // On regarde où on doit aller ensuite (par défaut vers l'accueil)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // On échange le code contre une session active
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si ça marche, on redirige l'utilisateur vers la page voulue (ex: /compte/reset)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si erreur, on renvoie vers l'accueil
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
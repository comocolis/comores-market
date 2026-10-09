// Chargement a la demande du client Supabase navigateur (~170 Ko) : un visiteur anonyme
// (sans cookie de session) n'a pas besoin de la librairie sur les pages publiques.

/** Vrai si un cookie de session Supabase (`sb-…-auth-token`) est present. */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split('; ')
    .some((cookie) => cookie.startsWith('sb-') && cookie.includes('-auth-token'))
}

export async function getSupabase() {
  const { createClient } = await import('./client')
  return createClient()
}

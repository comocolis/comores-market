import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Script from 'next/script'

type Props = {
  params: Promise<{ id: string }> // Compatible Next.js 15
}

// --- GÉNÉRATION DES METADATA (SEO) ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, city, description, is_pro, avatar_url')
    .eq('id', id)
    .single()

  if (!profile) return { title: 'Profil introuvable | Comores Market' }

  // ZÉRO TRANSFORMATION : On utilise les données brutes
  const name = profile.full_name || 'Utilisateur'
  const city = profile.city || 'Comores'
  const isPro = profile.is_pro ? ' (Pro)' : ''

  return {
    title: `${name}${isPro} à ${city} | Comores Market`,
    description: `Découvrez la boutique de ${name}. ${profile.description?.substring(0, 150) || 'Vendeur sur Comores Market.'}`,
    openGraph: {
      title: `${name} - Comores Market`,
      description: profile.description || `Profil vendeur de ${name}`,
      images: [profile.avatar_url || '/avatar-default.png'],
      type: 'profile',
    },
  }
}

// --- COMPOSANT PAGE ---
export default async function Page({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  // RÉCUPÉRATION COMPLÈTE POUR LOGIQUE CLIENT
  // On récupère tout (*) pour avoir subscription_end_date, liens sociaux, etc.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  // On prépare le JSON-LD pour le référencement
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': profile?.is_pro ? 'Store' : 'Person',
    'name': profile?.full_name || 'Utilisateur',
    'description': profile?.description || 'Vendeur sur Comores Market',
    'image': profile?.avatar_url || '/avatar-default.png',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': profile?.city || 'Comores',
      'addressCountry': 'KM'
    }
  }

  return (
    <>
      <Script
        id="profile-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* PASSER initialData EST CRUCIAL :
        Cela permet au ProfileClient d'afficher les infos immédiatement
        sans chargement, et d'appliquer la logique PRO (date expiration)
      */}
      <ProfileClient initialData={profile} id={id} />
    </>
  )
}
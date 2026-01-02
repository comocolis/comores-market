import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Script from 'next/script'

type Props = {
  params: Promise<{ id: string }> // Compatible Next.js 15
}

/**
 * UTILITAIRE : Transforme l'URL de l'avatar en URL absolue pour le partage social
 * Les réseaux sociaux ont besoin du domaine complet pour afficher l'image.
 */
const getAbsoluteImageUrl = (url: string | null) => {
  if (!url) return 'https://comores-market.com/icons/icon-512x512.png'; // Fallback icône app
  if (url.startsWith('http')) return url;
  return `https://comores-market.com${url}`;
};

// --- GÉNÉRATION DES METADATA (SEO & PARTAGE SOCIAL) ---
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

  const name = profile.full_name || 'Utilisateur'
  const city = profile.city || 'Comores'
  const isPro = profile.is_pro ? ' (Pro)' : ''
  const shareImage = getAbsoluteImageUrl(profile.avatar_url)

  return {
    title: `${name}${isPro} à ${city} | Comores Market`,
    description: `Découvrez la boutique de ${name}. ${profile.description?.substring(0, 150) || 'Vendeur sur Comores Market.'}`,
    
    // CONFIGURATION DU PARTAGE SOCIAL (Open Graph)
    openGraph: {
      title: `${name} - Comores Market`,
      description: profile.description || `Profil vendeur de ${name} sur Comores Market.`,
      url: `https://comores-market.com/profil/${id}`,
      siteName: 'Comores Market',
      // Utilisation de l'URL absolue pour forcer l'icône dans Telegram/Gmail/Messenger
      images: [
        {
          url: shareImage,
          width: 800,
          height: 800,
          alt: `Photo de profil de ${name}`,
        }
      ],
      type: 'profile',
    },
    // Meta spécifique pour Twitter/X
    twitter: {
      card: 'summary_large_image',
      title: `${name} sur Comores Market`,
      images: [shareImage],
    }
  }
}

// --- COMPOSANT PAGE ---
export default async function Page({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  // RÉCUPÉRATION COMPLÈTE
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  // JSON-LD pour les moteurs de recherche
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': profile?.is_pro ? 'Store' : 'Person',
    'name': profile?.full_name || 'Utilisateur',
    'description': profile?.description || 'Vendeur sur Comores Market',
    'image': getAbsoluteImageUrl(profile?.avatar_url || null),
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
      
      <ProfileClient initialData={profile} id={id} />
    </>
  )
}
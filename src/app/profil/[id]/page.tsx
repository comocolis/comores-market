import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Script from 'next/script'

type Props = {
  params: { id: string }
}

// --- GÉNÉRATION DES METADATA DYNAMIQUES (SEO) ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single()

  if (!profile) return { title: 'Profil introuvable | Comores Market' }

  const name = profile.full_name || 'Utilisateur'
  const city = profile.city || 'Comores'
  const isPro = profile.is_pro ? ' (Vendeur PRO)' : ''
  const seoTitle = `${name}${isPro} à ${city} | Comores Market`
  const seoDesc = `Consultez les annonces de ${name} sur Comores Market. ${profile.description?.substring(0, 150) || 'Membre vérifié aux Comores.'}`

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      images: [profile.cover_url || profile.avatar_url || '/cover-default.jpg'],
    },
  }
}

export default async function Page({ params }: Props) {
  const supabase = await createClient()
  
  // Pré-chargement pour le JSON-LD
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': profile?.is_pro ? 'Store' : 'Person',
    'name': profile?.full_name,
    'description': profile?.description,
    'image': profile?.avatar_url,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': profile?.city,
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
      <ProfileClient />
    </>
  )
}
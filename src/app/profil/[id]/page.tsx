import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Script from 'next/script'

type Props = {
  params: { id: string }
}

// --- GÉNÉRATION DES METADATA SIMPLIFIÉE ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single()

  if (!profile) return { title: 'Profil introuvable' }

  const name = profile.full_name || 'Utilisateur'
  const city = profile.city || 'Comores'
  const isPro = profile.is_pro ? ' (Vendeur PRO)' : ''

  // TITRE SIMPLIFIÉ : On retire " | Comores Market" car il est déjà dans le layout
  return {
    title: `${name}${isPro} à ${city}`,
    description: `Découvrez la boutique de ${name} sur Comores Market. ${profile.description?.substring(0, 150) || 'Membre vérifié.'}`,
    openGraph: {
      title: `${name} - Comores Market`,
      images: [profile.cover_url || profile.avatar_url || '/cover-default.jpg'],
    },
  }
}

// --- COMPOSANT PAGE SERVEUR ---
export default async function Page({ params }: Props) {
  const supabase = await createClient()
  
  // Récupération des données pour le référencement Google (JSON-LD)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single()

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
      {/* Script invisible pour que Google affiche les avis/infos dans les recherches */}
      <Script
        id="profile-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Chargement de l'interface utilisateur (Côté Client) */}
      <ProfileClient />
    </>
  )
}
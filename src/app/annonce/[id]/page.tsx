import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import AnnonceClient from './AnnonceClient'
import Script from 'next/script'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// --- GÉNÉRATION DES METADATA DYNAMIQUES POUR GOOGLE ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('title, price, description, images, location_island, location_city')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: 'Annonce introuvable | Comores Market' }
  }

  // Formatage du prix et de la localisation pour le titre SEO
  const formattedPrice = new Intl.NumberFormat('fr-KM').format(product.price)
  const location = `${product.location_city}, ${product.location_island}`
  
  // Stratégie de titre : [Objet] - [Prix] KMF à [Ville] | Comores Market
  const seoTitle = `${product.title} - ${formattedPrice} KMF à ${location} | Comores Market`
  const seoDescription = `${formattedPrice} KMF - ${product.description?.substring(0, 150)}... Découvrez cette offre sur Comores Market.`

  let mainImage = '/cover-default.jpg'
  try {
      const images = JSON.parse(product.images)
      if (Array.isArray(images) && images.length > 0) mainImage = images[0]
  } catch (e) {
      if (product.images && typeof product.images === 'string') mainImage = product.images
  }
 
  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [mainImage],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [mainImage],
    },
  }
}

// --- COMPOSANT PAGE AVEC DONNÉES STRUCTURÉES ---
export default async function Page({ params }: Props) {
  const supabase = await createClient()
  
  // Pré-chargement des données pour le script JSON-LD
  const { data: product } = await supabase
    .from('products')
    .select('*, profiles(full_name)')
    .eq('id', params.id)
    .single()

  if (!product) return <AnnonceClient />

  // Construction du schéma JSON-LD pour les Rich Snippets Google
  let jsonLdImage = ''
  try {
    const imgs = JSON.parse(product.images)
    jsonLdImage = Array.isArray(imgs) ? imgs[0] : imgs
  } catch {
    jsonLdImage = product.images
  }

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.title,
    'image': jsonLdImage,
    'description': product.description,
    'brand': {
      '@type': 'Brand',
      'name': 'Comores Market'
    },
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'KMF',
      'price': product.price,
      'itemCondition': 'https://schema.org/UsedCondition',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Person',
        'name': product.profiles?.full_name || 'Vendeur Comores Market'
      }
    }
  }

  return (
    <>
      {/* Insertion du script pour les résultats enrichis de Google */}
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnnonceClient />
    </>
  )
}
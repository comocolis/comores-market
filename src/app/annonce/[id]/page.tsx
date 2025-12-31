import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import AnnonceClient from './AnnonceClient'
import Script from 'next/script'

// CORRECTION 1 : params est désormais une Promise
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const getSeoImage = (url: string | null) => {
  if (!url) return 'https://comores-market.com/cover-default.jpg';
  if (url.includes('supabase.co')) {
    return `${url}?width=1200&quality=80&resize=contain`;
  }
  return url;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // CORRECTION 2 : On attend la résolution des paramètres
  const { id } = await params
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('title, price, description, images, location_island, location_city')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: 'Annonce introuvable | Comores Market' }
  }

  const formattedPrice = new Intl.NumberFormat('fr-KM').format(product.price)
  const location = `${product.location_city}, ${product.location_island}`
  
  // ZÉRO TRANSFORMATION : Titre brut
  const seoTitle = `${product.title} - ${formattedPrice} KMF à ${location} | Comores Market`
  const seoDescription = `${formattedPrice} KMF - ${product.description?.substring(0, 150)}... Découvrez cette offre sur Comores Market.`

  let rawImage = '/cover-default.jpg'
  try {
      const images = JSON.parse(product.images)
      if (Array.isArray(images) && images.length > 0) rawImage = images[0]
  } catch (e) {
      if (product.images && typeof product.images === 'string') rawImage = product.images
  }

  const mainImage = getSeoImage(rawImage);
 
  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [mainImage],
      type: 'article',
      url: `https://comores-market.com/annonce/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [mainImage],
    },
  }
}

export default async function Page({ params }: Props) {
  // CORRECTION 3 : On attend la résolution des paramètres ici aussi
  const { id } = await params
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      profiles(
        full_name,
        avatar_url,
        is_pro,
        subscription_end_date,
        facebook_url,
        instagram_url
      )
    `)
    .eq('id', id) // On utilise 'id' extrait de l'await
    .single()

  // On passe null si pas de produit, le client gérera l'affichage
  if (!product) return <AnnonceClient initialData={null} />

  let jsonLdImage = ''
  try {
    const imgs = JSON.parse(product.images)
    jsonLdImage = Array.isArray(imgs) ? imgs[0] : imgs
  } catch {
    jsonLdImage = product.images
  }

  const sellerData = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  const sellerName = sellerData?.full_name || 'Vendeur Comores Market';

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.title,
    'image': getSeoImage(jsonLdImage),
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
      'url': `https://comores-market.com/annonce/${id}`,
      'seller': {
        '@type': 'Person',
        'name': sellerName
      }
    }
  }

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnnonceClient initialData={product} />
    </>
  )
}
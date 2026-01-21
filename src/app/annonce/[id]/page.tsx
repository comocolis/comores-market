import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import AnnonceClient from './AnnonceClient'
import Script from 'next/script'

// Typage pour Next.js 15+ (Params as Promise)
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Helper pour nettoyer et optimiser l'URL de l'image SEO
const getSeoImage = (url: string | null) => {
  if (!url) return 'https://comores-market.com/cover-default.jpg';
  // Optimisation spécifique pour Supabase Storage
  if (url.includes('supabase.co')) {
    return `${url}?width=1200&quality=80&resize=contain`;
  }
  return url;
};

// Helper pour extraire l'image principale depuis le JSON ou le String
const extractMainImage = (imagesData: any): string | null => {
  if (!imagesData) return null;
  try {
    // Si c'est déjà un tableau ou une chaîne JSONifiée
    const parsed = typeof imagesData === 'string' && (imagesData.startsWith('[') || imagesData.startsWith('"')) 
      ? JSON.parse(imagesData) 
      : imagesData;
      
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === 'string') return parsed;
  } catch (e) {
    // Fallback si le parsing échoue mais que c'est une chaîne simple
    if (typeof imagesData === 'string') return imagesData;
  }
  return null;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // 1. Attente de la résolution des paramètres (Next.js 15)
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
  
  // Construction du titre optimisé pour le taux de clic (CTR)
  const seoTitle = `${product.title} - ${formattedPrice} KMF à ${location} | Comores Market`
  // Description tronquée proprement
  const seoDescription = `${formattedPrice} KMF - ${product.description?.substring(0, 150) || ''}... Découvrez cette offre sur Comores Market.`

  // Récupération sécurisée de l'image
  const rawImage = extractMainImage(product.images) || '/cover-default.jpg';
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
      siteName: 'Comores Market',
      locale: 'fr_KM',
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
  // 2. Attente de la résolution des paramètres ici aussi
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
    .eq('id', id)
    .single()

  // Si pas de produit, on laisse le composant client gérer l'UI (404 ou Loading)
  if (!product) return <AnnonceClient initialData={null} />

  // Préparation des données pour le JSON-LD
  const rawImage = extractMainImage(product.images);
  const jsonLdImage = getSeoImage(rawImage);

  // Gestion du vendeur (Supabase peut renvoyer un tableau ou un objet selon la relation)
  const sellerData = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  const sellerName = sellerData?.full_name || 'Vendeur Comores Market';

  // Construction du JSON-LD (Données structurées pour Google)
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.title,
    'image': jsonLdImage ? [jsonLdImage] : [],
    'description': product.description,
    'sku': product.id,
    'datePublished': product.created_at, // Ajout important pour la fraîcheur de l'annonce
    'brand': {
      '@type': 'Brand',
      'name': 'Comores Market' // Ou la marque du produit si vous l'avez dans la DB
    },
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'KMF',
      'price': product.price,
      'itemCondition': 'https://schema.org/UsedCondition', // Par défaut occasion
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
      {/* Injection du JSON-LD pour le SEO Rich Snippets */}
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="afterInteractive"
      />
      
      {/* Composant Client */}
      <AnnonceClient initialData={product} />
    </>
  )
}
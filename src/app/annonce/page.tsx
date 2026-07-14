import { Metadata } from 'next'
import { createStaticClient } from '@/utils/supabase/static'
import AnnonceClient from './AnnonceClient'
import { Suspense, ComponentType } from 'react'

// On type explicitement le composant client pour indiquer à TypeScript qu'il accepte la prop initialProduct
const SafeAnnonceClient = AnnonceClient as unknown as ComponentType<{ initialProduct: any }>

// Définition rigoureuse des types pour Next.js 15+ (asynchrones par défaut)
interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// 🌐 1. GÉNÉRATION DES MÉTADONNÉES DYNAMIQUES (SEO & Réseaux Sociaux)
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  // On résout la promesse asynchrone searchParams requise par Next.js 15/16
  const resolvedSearchParams = await searchParams
  const rawId = resolvedSearchParams.id
  const id = typeof rawId === 'string' ? rawId : undefined

  if (!id) {
    return {
      title: 'Annonce introuvable | Comores Market',
      description: 'L\'annonce demandée n\'existe pas ou a été supprimée.',
    }
  }

  try {
    const supabase = createStaticClient()
    const { data: product } = await supabase
      .from('products')
      .select('title, description, images, price')
      .eq('id', id)
      .single()

    if (!product) {
      return {
        title: 'Annonce introuvable | Comores Market',
        description: 'L\'annonce demandée n\'existe pas ou a été supprimée.',
      }
    }

    // Extraction propre de la description
    const mainDescription = product.description?.split('--- ✨ CARACTÉRISTIQUES ---')[0]?.trim() || ''
    
    // Calcul de la conversion pour le titre SEO
    const priceInEuro = Math.round(product.price / 500);
    const formattedPrice = new Intl.NumberFormat('fr-KM').format(product.price);
    const formattedEuro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(priceInEuro);
    const pageTitle = `${product.title} - ${formattedPrice} KMF (${formattedEuro})`;
    
    // Détermination de l'image de partage
    let imageUrl = 'https://www.comores-market.com/og-image.png'
    try {
      const imgs = JSON.parse(product.images)
      if (Array.isArray(imgs) && imgs.length > 0) {
        imageUrl = imgs[0]
      }
    } catch {
      if (product.images && typeof product.images === 'string' && product.images.startsWith('http')) {
        imageUrl = product.images
      }
    }

    return {
      title: pageTitle,
      description: mainDescription.slice(0, 150) || `Découvrez l'annonce ${product.title} sur Comores Market.`,
      alternates: {
        canonical: `/annonce?id=${id}`,
      },
      openGraph: {
        title: pageTitle,
        description: mainDescription.slice(0, 150) || `Achetez ou vendez sur la première marketplace des Comores.`,
        url: `https://www.comores-market.com/annonce?id=${id}`,
        siteName: 'Comores Market',
        locale: 'fr_KM',
        type: 'article',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
      },
    }
  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées SEO :', error)
    return {
      title: 'Comores Market - Annonce',
    }
  }
}

// 🎴 2. RENDU DE LA PAGE EN SSR (Serveur)
export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const rawId = resolvedSearchParams.id
  const id = typeof rawId === 'string' ? rawId : undefined
  let initialProduct = null

  if (id) {
    try {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from('products')
        .select(`
          id, title, price, description, images, location_island, location_city, created_at, user_id, whatsapp_number, sub_category,
          profiles(full_name, avatar_url, is_pro, subscription_end_date, phone_number)
        `)
        .eq('id', id)
        .single()
      
      if (data) {
        initialProduct = data
      }
    } catch (error) {
      console.error('Erreur lors du préchargement de l\'annonce :', error)
    }
  }

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <SafeAnnonceClient initialProduct={initialProduct} />
    </Suspense>
  )
}
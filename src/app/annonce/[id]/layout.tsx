import { createClient } from '@/utils/supabase/server'
import type { Metadata } from 'next'

// On définit le type des props pour Next.js 15
type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

// Fonction spéciale de Next.js pour le SEO
export async function generateMetadata(
  { params }: Omit<Props, 'children'>,
): Promise<Metadata> {
  // 1. On récupère l'ID
  const { id } = await params

  // 2. On connecte Supabase côté serveur
  const supabase = await createClient()
  
  // 3. On récupère juste les infos nécessaires pour l'aperçu
  const { data: product } = await supabase
    .from('products')
    .select('title, description, price, images, location_city, location_island')
    .eq('id', id)
    .single()

  // Si pas de produit, titre par défaut
  if (!product) {
    return {
      title: 'Annonce introuvable | Comores Market',
    }
  }

  // 4. On prépare l'image et le prix
  let imageUrl = '/opengraph-image.png' // Image par défaut si pas de photo
  try {
    const images = JSON.parse(product.images)
    if (Array.isArray(images) && images.length > 0) {
      imageUrl = images[0]
    }
  } catch (e) {}

  const priceFormatted = new Intl.NumberFormat('fr-KM').format(product.price) + ' KMF'

  // 5. On retourne les métadonnées pour Facebook, WhatsApp, etc.
  return {
    title: `${product.title} à ${priceFormatted}`,
    description: `En vente sur Comores Market (${product.location_city}, ${product.location_island}). ${product.description?.substring(0, 120)}...`,
    openGraph: {
      title: `${product.title} - ${priceFormatted}`,
      description: product.description?.substring(0, 150),
      images: [{ url: imageUrl, width: 800, height: 600 }],
      siteName: 'Comores Market',
      locale: 'fr_FR',
      type: 'website',
    },
  }
}

// Le Layout ne fait rien d'autre que d'afficher la page (children)
// Mais grâce à generateMetadata ci-dessus, le SEO est injecté !
export default function AnnonceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
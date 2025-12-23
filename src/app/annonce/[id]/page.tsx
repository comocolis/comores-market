import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import AnnonceClient from './AnnonceClient'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// CETTE FONCTION S'EXECUTE SUR LE SERVEUR POUR LE SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  
  // CORRECTION ICI : Ajout de 'await' car createClient est asynchrone
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('title, price, description, images, location_island')
    .eq('id', id)
    .single()
 
  if (!product) {
    return {
      title: 'Annonce introuvable',
    }
  }
 
  let mainImage = ''
  try {
      const images = JSON.parse(product.images)
      if (images.length > 0) mainImage = images[0]
  } catch (e) {
      mainImage = product.images // Fallback
  }
 
  return {
    title: product.title,
    description: `${new Intl.NumberFormat('fr-KM').format(product.price)} KMF - ${product.description?.substring(0, 150)}... Dispo à ${product.location_island}`,
    openGraph: {
      title: product.title,
      description: `Prix : ${new Intl.NumberFormat('fr-KM').format(product.price)} KMF | Vendeur sur Comores Market`,
      images: mainImage ? [mainImage] : [],
    },
  }
}

// LE COMPOSANT PAGE (SERVEUR) QUI AFFICHE LE CLIENT
export default function Page() {
  return <AnnonceClient />
}
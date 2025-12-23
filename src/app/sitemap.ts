import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/client' // Ou client server si besoin, mais ici client suffit pour le build

const BASE_URL = 'https://comores-market.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // 1. Récupérer toutes les annonces actives (limité aux 5000 dernières pour l'exemple)
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // 2. Créer les URLs produits
  const productUrls = (products || []).map((product) => ({
    url: `${BASE_URL}/annonce/${product.id}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 3. Retourner la liste complète (Pages statiques + Produits)
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/recherche`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
  ]
}
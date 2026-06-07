import { MetadataRoute } from 'next'
import { createStaticClient } from '@/utils/supabase/static'

// ✅ REVALIDATION AUTOMATIQUE TOUTES LES HEURES (ISR)
// Au lieu de figer le sitemap au build, Next.js le reconstruira en arrière-plan toutes les 1h max.
export const revalidate = 3600 

const BASE_URL = 'https://www.comores-market.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Initialisation du client
  const supabase = createStaticClient()
  
  // 2. Récupération optimisée (Limitation temporaire à 5000, extensible à 45000 plus tard)
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // 3. Génération des URLs dynamiques (Produits)
  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${BASE_URL}/annonce?id=${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 4. Définition des routes statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'always', // La home change constamment sur une marketplace
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/recherche`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pro`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/cgu`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // 5. Fusion et retour
  return [...staticRoutes, ...productUrls]
}
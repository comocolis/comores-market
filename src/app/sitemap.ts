import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/client'

const BASE_URL = 'https://comores-market.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // 1. Récupérer les 5000 dernières annonces actives
  // C'est vital pour que Google trouve vos produits sans devoir cliquer partout
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // 2. Générer les URLs dynamiques (les annonces)
  const productUrls = (products || []).map((product) => ({
    url: `${BASE_URL}/annonce/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8, // Priorité haute (0.8) pour les produits
  }))

  // 3. Définir les pages statiques importantes
  const staticRoutes = [
    {
      url: BASE_URL, // Accueil
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1, // Priorité maximale (1.0)
    },
    {
      url: `${BASE_URL}/recherche`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pro`, // Offre Vendeur Pro (ESSENTIEL POUR LE SEO)
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`, // Aide
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/cgu`, // Infos légales
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // 4. Tout fusionner
  return [...staticRoutes, ...productUrls]
}
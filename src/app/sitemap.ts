import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server' // <--- CORRECTION MAJEURE ICI

const BASE_URL = 'https://comores-market.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Initialisation du client serveur
  const supabase = await createClient()
  
  // 2. Récupération optimisée
  // On ne récupère QUE les colonnes nécessaires (id, updated_at) pour ne pas saturer la mémoire
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // 3. Génération des URLs dynamiques (Produits)
  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${BASE_URL}/annonce/${product.id}`,
    // Si updated_at est null, on utilise la date actuelle pour ne pas casser le format
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 4. Définition des routes statiques
  const staticRoutes: MetadataRoute.Sitemap = [
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
import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/client'

// ⚠️ REMPLACEZ PAR VOTRE VRAI DOMAINE
const BASE_URL = 'https://comores-market.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // On utilise le client standard pour le build
  const supabase = createClient()
  
  // 1. Récupérer les 5000 dernières annonces actives
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // 2. Générer les URLs dynamiques
  const productUrls = (products || []).map((product) => ({
    url: `${BASE_URL}/annonce/${product.id}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 3. Retourner la liste complète
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
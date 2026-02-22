import { createClient } from '@/utils/supabase/server'
import HomePageClient, { Product } from './HomePageClient'

export const dynamic = 'force-dynamic' // Ensure we get fresh data on navigation

// --- TYPE DEFINITIONS ---
// This interface is exported from HomePageClient but Typescript might complain 
// if I don't import it properly. It's safe to assume `Product` is consistent.

export default async function HomePage() {
  const supabase = await createClient()

  // Initial fetch on server for SEO & Speed
  const { data: products } = await supabase
    .from('products_with_details')
    .select('id, title, price, images, location_island, location_city, is_pro, created_at, category_id, sub_category')
    //.order('boosted_until', { ascending: false, nullsFirst: false }) // TODO: Re-enable when DB fixed
    .order('is_pro', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12) // ITEMS_PER_PAGE

  return (
    <HomePageClient initialProducts={(products as Product[]) || []} />
  )
}
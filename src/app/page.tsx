import HomePageClient from './HomePageClient'
import { getRankedHomepageProducts } from '@/lib/homepage-ranking'

export const dynamic = 'force-dynamic' // Ensure we get fresh data on navigation

export default async function HomePage() {
  const result = await getRankedHomepageProducts({ limit: 20, offset: 0 })
  const renderedAt = new Date().toISOString()

  return (
    <HomePageClient initialProducts={result.products} initialHasMore={result.hasMore} renderedAt={renderedAt} />
  )
}
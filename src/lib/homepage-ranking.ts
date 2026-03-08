import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { HomepageFilters, HomepageProduct } from '@/lib/homepage-types'

interface PersonalizationSnapshot {
  recent_searches?: string[]
  clicked_product_ids?: string[]
  viewed_product_ids?: string[]
  favorite_product_ids?: string[]
  preferred_categories?: number[]
  preferred_sub_categories?: string[]
  preferred_islands?: string[]
  average_price?: number | null
}

const DEFAULT_LIMIT = 20
const RECENT_POOL_LIMIT = 80
const PRO_POOL_LIMIT = 60

interface RankedHomepageProductsResult {
  products: HomepageProduct[]
  hasMore: boolean
  total: number
}

function buildFrequencyMap<T extends string | number>(values: T[]) {
  return values.reduce((map, value) => {
    map.set(value, (map.get(value) || 0) + 1)
    return map
  }, new Map<T, number>())
}

function getFrequencyScore<T extends string | number>(map: Map<T, number>, value: T | null | undefined, multiplier: number) {
  if (value === null || value === undefined) return 0
  return (map.get(value) || 0) * multiplier
}

function normalizeSnapshot(snapshot: PersonalizationSnapshot | null, searchTerm?: string) {
  const recentSearches = Array.from(new Set([
    ...(snapshot?.recent_searches || []),
    ...(searchTerm?.trim().length ? [searchTerm.trim().toLowerCase()] : []),
  ].map(term => term.toLowerCase())))

  return {
    recentSearches,
    clickedSet: new Set(snapshot?.clicked_product_ids || []),
    viewedSet: new Set(snapshot?.viewed_product_ids || []),
    favoriteSet: new Set(snapshot?.favorite_product_ids || []),
    categoryMap: buildFrequencyMap(snapshot?.preferred_categories || []),
    subCategoryMap: buildFrequencyMap(snapshot?.preferred_sub_categories || []),
    islandMap: buildFrequencyMap(snapshot?.preferred_islands || []),
    averagePrice: snapshot?.average_price ?? null,
  }
}

function computeInterestScore(
  product: HomepageProduct,
  snapshot: ReturnType<typeof normalizeSnapshot>,
  now: number
) {
  let score = 0
  const normalizedTitle = product.title.toLowerCase()

  score += getFrequencyScore(snapshot.categoryMap, product.category_id, 18)
  score += getFrequencyScore(snapshot.subCategoryMap, product.sub_category, 24)
  score += getFrequencyScore(snapshot.islandMap, product.location_island, 12)

  snapshot.recentSearches.forEach(term => {
    if (normalizedTitle.includes(term)) score += 16
  })

  if (snapshot.averagePrice !== null) {
    const priceGapRatio = Math.abs(product.price - snapshot.averagePrice) / Math.max(snapshot.averagePrice, 1)
    if (priceGapRatio <= 0.2) score += 16
    else if (priceGapRatio <= 0.4) score += 8
  }

  if (snapshot.favoriteSet.has(product.id)) score -= 35
  if (snapshot.clickedSet.has(product.id)) score -= 18
  if (snapshot.viewedSet.has(product.id)) score -= 12

  const ageInDays = (now - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (ageInDays <= 2) score += 8
  else if (ageInDays <= 7) score += 4

  return score
}

export async function getRankedHomepageProducts(filters: HomepageFilters = {}, visitorId?: string | null): Promise<RankedHomepageProductsResult> {
  const supabase = await createClient()
  const limit = filters.limit || DEFAULT_LIMIT
  const offset = Math.max(filters.offset || 0, 0)
  const requiredItems = offset + limit
  const recentPoolLimit = Math.max(RECENT_POOL_LIMIT, requiredItems + 40)
  const proPoolLimit = Math.max(PRO_POOL_LIMIT, requiredItems + 20)

  const applyFilters = (query: any) => {
    if (filters.selectedCategory && filters.selectedCategory !== 0) {
      query = query.eq('category_id', filters.selectedCategory)
      if (filters.selectedSubCategory && filters.selectedSubCategory !== 'Tout') {
        query = query.eq('sub_category', filters.selectedSubCategory)
      }
    }

    if (filters.selectedIsland && filters.selectedIsland !== 'Tout') {
      query = query.eq('location_island', filters.selectedIsland)
    }

    if (filters.searchTerm?.trim()) {
      query = query.ilike('title', `%${filters.searchTerm.trim()}%`)
    }

    if (filters.priceMin) {
      query = query.gte('price', Number.parseInt(filters.priceMin, 10))
    }

    if (filters.priceMax) {
      query = query.lte('price', Number.parseInt(filters.priceMax, 10))
    }

    return query
  }

  let boostedQuery = supabase
    .from('products_with_details')
    .select('id, title, price, images, location_island, location_city, is_pro, boosted_until, created_at, category_id, sub_category')
    .gte('boosted_until', new Date().toISOString())

  let proQuery = supabase
    .from('products_with_details')
    .select('id, title, price, images, location_island, location_city, is_pro, boosted_until, created_at, category_id, sub_category')
    .eq('is_pro', true)
    .order('created_at', { ascending: false })
    .limit(proPoolLimit)

  let recentQuery = supabase
    .from('products_with_details')
    .select('id, title, price, images, location_island, location_city, is_pro, boosted_until, created_at, category_id, sub_category')
    .order('created_at', { ascending: false })
    .limit(recentPoolLimit)

  boostedQuery = applyFilters(boostedQuery)
  proQuery = applyFilters(proQuery)
  recentQuery = applyFilters(recentQuery)

  const [boostedRes, proRes, recentRes, snapshotRes] = await Promise.all([
    boostedQuery,
    proQuery,
    recentQuery,
    supabase.rpc('get_personalization_snapshot', { p_visitor_id: visitorId ?? null }),
  ])

  if (boostedRes.error) throw boostedRes.error
  if (proRes.error) throw proRes.error
  if (recentRes.error) throw recentRes.error
  if (snapshotRes.error) {
    console.error('Unable to load personalization snapshot', snapshotRes.error)
  }

  const productMap = new Map<string, HomepageProduct>()
  ;[...(boostedRes.data || []), ...(proRes.data || []), ...(recentRes.data || [])].forEach((product: HomepageProduct) => {
    productMap.set(product.id, product)
  })

  const snapshot = normalizeSnapshot((snapshotRes.data as PersonalizationSnapshot | null) || null, filters.searchTerm)
  const now = Date.now()

  const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => {
      const isBoostedA = a.boosted_until ? new Date(a.boosted_until).getTime() > now : false
      const isBoostedB = b.boosted_until ? new Date(b.boosted_until).getTime() > now : false

      if (isBoostedA && !isBoostedB) return -1
      if (!isBoostedA && isBoostedB) return 1

      const interestScoreA = computeInterestScore(a, snapshot, now)
      const interestScoreB = computeInterestScore(b, snapshot, now)
      if (interestScoreA !== interestScoreB) return interestScoreB - interestScoreA

      if (a.is_pro && !b.is_pro) return -1
      if (!a.is_pro && b.is_pro) return 1

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return {
    products: sortedProducts.slice(offset, offset + limit),
    hasMore: sortedProducts.length > offset + limit,
    total: sortedProducts.length,
  }
}

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

const ITEMS_PER_PAGE = 12

interface FetchProductsParams {
  page: number
  category?: number
  subCategory?: string
  island?: string
  searchTerm?: string
  priceMin?: string
  priceMax?: string
}

export function useProducts({
  page,
  category = 0,
  subCategory = 'Tout',
  island = 'Tout',
  searchTerm = '',
  priceMin = '',
  priceMax = '',
}: FetchProductsParams) {
  const supabase = createClient()

  return useQuery({
    queryKey: [
      'products',
      page,
      category,
      subCategory,
      island,
      searchTerm,
      priceMin,
      priceMax,
    ],
    queryFn: async () => {
      const start = page * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('products_with_details')
        .select(
          'id, title, price, images, location_island, location_city, is_pro, created_at, category_id, sub_category'
        )
        //.order('boosted_until', { ascending: false, nullsFirst: false })
        .order('is_pro', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end)

      if (category !== 0) {
        query = query.eq('category_id', category)
        if (subCategory !== 'Tout') query = query.eq('sub_category', subCategory)
      }
      if (island !== 'Tout') query = query.eq('location_island', island)
      if (searchTerm.trim()) query = query.ilike('title', `%${searchTerm}%`)
      if (priceMin) query = query.gte('price', parseInt(priceMin))
      if (priceMax) query = query.lte('price', parseInt(priceMax))

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

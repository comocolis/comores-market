export interface HomepageProduct {
  id: string
  title: string
  price: number
  images: string
  location_island: string
  location_city: string
  is_pro: boolean
  boosted_until: string | null
  created_at: string
  category_id: number
  sub_category: string
}

export interface HomepageFilters {
  searchTerm?: string
  selectedCategory?: number
  selectedSubCategory?: string
  selectedIsland?: string
  priceMin?: string
  priceMax?: string
  limit?: number
  offset?: number
}

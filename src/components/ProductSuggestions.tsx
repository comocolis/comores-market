'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, MapPin, Crown } from 'lucide-react'
import { getFirstProductImage } from '@/utils/parseImages'

interface ProductSuggestionsProps {
  userId?: string | null
  excludeProductId?: string
  category?: number
  limit?: number
  title?: string
}

export default function ProductSuggestions({ 
  userId, 
  excludeProductId, 
  category,
  limit = 6,
  title = "Recommandé pour vous"
}: ProductSuggestionsProps) {
  const supabase = createClient()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        let query = supabase
          .from('products')
          .select('id, title, price, images, location_island, location_city, sub_category, boosted_until, created_at, is_pro')
          .limit(50)

        // Exclude specific product if provided
        if (excludeProductId) {
          query = query.neq('id', excludeProductId)
        }

        // Filter by category if provided
        if (category && category !== 0) {
          query = query.eq('category_id', category)
        }

        const { data: products } = await query

        if (!products) {
          setLoading(false)
          return
        }

        // If user is logged in, personalize based on their activity
        let scoredProducts = products
        
        if (userId) {
          // Get user's favorites and views for personalization
          const [{ data: favorites }, { data: views }] = await Promise.all([
            supabase.from('favorites').select('product_id').eq('user_id', userId),
            supabase.from('product_views').select('product_id').eq('viewer_id', userId).limit(20)
          ])

          const favoriteProductIds = favorites?.map((f: any) => f.product_id) || []
          const viewedProductIds = views?.map((v: any) => v.product_id) || []

          // Get categories/locations from user's favorites
          const { data: favoriteProducts } = await supabase
            .from('products')
            .select('sub_category, location_island')
            .in('id', favoriteProductIds.slice(0, 10))

          const preferredCategories = favoriteProducts?.map((p: any) => p.sub_category) || []
          const preferredLocations = favoriteProducts?.map((p: any) => p.location_island) || []

          // Score products based on user preferences
          scoredProducts = products.map((p: any) => {
            let score = 0

            // Match preferred categories
            if (preferredCategories.includes(p.sub_category)) score += 40

            // Match preferred locations
            if (preferredLocations.includes(p.location_island)) score += 20

            // Boost for PRO/Boosted listings
            const isBoosted = p.boosted_until && new Date(p.boosted_until) > new Date()
            if (isBoosted) score += 15
            if (p.is_pro) score += 10

            // Recency bonus
            const daysSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSinceCreation < 3) score += 10
            else if (daysSinceCreation < 7) score += 5

            // Penalize if already viewed
            if (viewedProductIds.includes(p.id)) score -= 20

            // Penalize if already favorited
            if (favoriteProductIds.includes(p.id)) score -= 30

            return { ...p, score }
          })
        } else {
          // For anonymous users, score based on general quality indicators
          scoredProducts = products.map((p: any) => {
            let score = 0

            const isBoosted = p.boosted_until && new Date(p.boosted_until) > new Date()
            if (isBoosted) score += 30
            if (p.is_pro) score += 20

            // Recency
            const daysSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSinceCreation < 3) score += 15
            else if (daysSinceCreation < 7) score += 10

            return { ...p, score }
          })
        }

        // Sort by score and take top N
        const topSuggestions = scoredProducts
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, limit)

        setSuggestions(topSuggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [userId, excludeProductId, category, limit, supabase])

  if (loading || suggestions.length === 0) return null

  return (
    <div className="mt-8 mb-6">
      <h2 className="font-black text-xs uppercase tracking-widest text-gray-700 mb-4 flex items-center gap-2 px-4">
        <Sparkles size={14} className="text-brand" /> {title}
      </h2>
      <div className="px-4 grid grid-cols-2 gap-3">
        {suggestions.map((product: any) => {
          const img = getFirstProductImage(product.images)
          const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date()
          const isPro = product.is_pro

          return (
            <Link 
              key={product.id} 
              href={`/annonce/${product.id}`}
              className={`rounded-2xl overflow-hidden flex flex-col transition active:scale-[0.98] relative group ${
                isBoosted 
                  ? 'bg-white border-2 border-amber-400 shadow-xl shadow-amber-500/10' 
                  : isPro 
                    ? 'bg-white border-2 border-amber-200 shadow-md' 
                    : 'bg-white shadow-sm border border-gray-100'
              }`}
            >
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                {img && (
                  <Image 
                    src={img} 
                    alt={product.title} 
                    fill 
                    sizes="50vw" 
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                )}
                
                {isBoosted && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                    <Sparkles size={8} className="animate-pulse" /> VEDETTE
                  </div>
                )}
                
                {isPro && !isBoosted && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Crown size={10} strokeWidth={3} /> PRO
                  </div>
                )}

                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] px-1.5 py-0.5 rounded z-10 font-bold uppercase tracking-widest">
                  {product.location_island}
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-xs mb-1 truncate">
                  {product.title}
                </h3>
                <p className={`font-extrabold text-sm ${isBoosted ? 'text-amber-600' : isPro ? 'text-amber-600' : 'text-brand'}`}>
                  {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                </p>
                <div className="flex items-center gap-1 text-gray-600 text-[9px] font-bold uppercase mt-1">
                  <MapPin size={10} className="text-brand/60" /> {product.location_city}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

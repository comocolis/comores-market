'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, MapPin, Crown } from 'lucide-react'
import { getFirstProductImage } from '@/utils/parseImages'
import PriceTag from '@/components/PriceTag'

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
          .select('id, title, price, images, location_island, location_city, sub_category, created_at, is_pro, boosted_until')
          .limit(50)

        if (excludeProductId) query = query.neq('id', excludeProductId)
        if (category && category !== 0) query = query.eq('category_id', category)

        const { data: products } = await query
        if (products) {
          setSuggestions(products.slice(0, limit))
        }
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
              href={`/annonce?id=${product.id}`}
              className={`rounded-2xl overflow-hidden flex flex-col transition active:scale-[0.98] relative group ${
                isBoosted ? 'bg-white border-2 border-amber-400' : 'bg-white shadow-sm border border-gray-100'
              }`}
            >
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                {img && (
                  <Image 
                    src={img} 
                    alt={product.title} 
                    fill 
                    sizes="50vw" 
                    className="object-cover"
                  />
                )}
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-xs mb-1 truncate">
                  {product.title}
                </h3>
                
                {/* Forçage de l'affichage avec une taille fixe pour s'assurer que le contenu est rendu */}
                <div className="min-h-10">
                  <PriceTag 
                    price={product.price} 
                    className={`font-extrabold text-sm ${isBoosted ? 'text-amber-600' : 'text-brand'}`} 
                  />
                </div>

                <div className="flex items-center gap-1 text-gray-600 text-[9px] font-bold uppercase mt-1">
                  <MapPin size={10} className="text-gray-400" /> {product.location_city}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
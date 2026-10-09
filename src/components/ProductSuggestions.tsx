'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getFirstProductImage } from '@/utils/parseImages'
import PriceTag from '@/components/PriceTag'

interface ProductSuggestionsProps {
  userId?: string | null
  excludeProductId?: string
  category?: number
  limit?: number
  title?: string
  icon?: LucideIcon
}

export default function ProductSuggestions({ 
  userId, 
  excludeProductId, 
  category,
  limit = 6,
  title = "Recommandé pour vous",
  icon: TitleIcon,
}: ProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const fetchSuggestions = async () => {
      try {
        // Lecture publique via l'API REST de Supabase (vue enrichie : `is_pro` n'existe pas sur `products`).
        // Un simple fetch evite de charger la librairie supabase-js sur l'accueil.
        const params = new URLSearchParams({
          select: 'id,title,price,images,location_island,location_city,sub_category,created_at,is_pro,boosted_until',
          order: 'created_at.desc',
          limit: '50',
        })
        if (excludeProductId) params.set('id', `neq.${excludeProductId}`)
        if (category && category !== 0) params.set('category_id', `eq.${category}`)

        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products_with_details?${params}`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const products = await response.json()
        if (Array.isArray(products)) setSuggestions(products.slice(0, limit))
      } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error('Error fetching suggestions:', error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchSuggestions()

    return () => controller.abort()
  }, [userId, excludeProductId, category, limit])
  if (loading || suggestions.length === 0) return null

  return (
    <div className="mt-8 mb-6">
      <h2 className="font-display font-black text-xs uppercase tracking-widest text-gray-700 mb-4 flex items-center gap-2 px-4">
        {TitleIcon ? <TitleIcon size={14} className="text-brand" aria-hidden="true" /> : null} {title}
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
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Heart, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import { SkeletonProductGrid } from '@/components/Skeleton'
import { EmptyStateFavorites } from '@/components/EmptyState'

export default function FavorisClient() {
  const supabase = createClient()
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // Fige a l'ouverture de la page : Date.now() ne doit pas etre appele pendant le rendu.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase
        .from('favorites')
        .select('product:products(*, profiles(is_pro))') 
        .eq('user_id', user.id)
      
      const products = data?.map((f: any) => f.product).filter(Boolean) || []
      setFavorites(products)
      setLoading(false)
    }
    getData()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans text-gray-900">
      
      {/* --- HEADER --- */}
      <div className="bg-brand pt-safe px-4 pb-6 sticky top-0 z-40 shadow-md rounded-b-4xl">
        <div className="flex justify-between items-center pt-2 px-2">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.back()} 
                  className="p-2 -ml-2 text-white active:scale-90 transition"
                  aria-label="Retour"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-white font-black text-2xl tracking-tight">Mes Favoris</h1>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <Heart size={14} className="text-white fill-white" />
                <span className="text-xs font-black text-white">{favorites.length}</span>
            </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
            <SkeletonProductGrid count={8} />
        ) : favorites.length === 0 ? (
            <EmptyStateFavorites />
        ) : (
            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                    {favorites.map((product, index) => {
                        const isBoosted = product.boosted_until ? new Date(product.boosted_until).getTime() > now : false

                        return (
                            <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <ProductCard
                                    product={product}
                                    index={index}
                                    isPro={Boolean(product.profiles?.is_pro)}
                                    isBoosted={isBoosted}
                                    overlay={
                                        <span className="flex p-2 rounded-full bg-white/90 backdrop-blur-md text-red-500 shadow-sm" aria-hidden="true">
                                            <Heart size={14} fill="currentColor" />
                                        </span>
                                    }
                                />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  )
}
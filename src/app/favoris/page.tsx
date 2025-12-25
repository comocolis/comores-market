'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart, Loader2, ShoppingBag, ShieldCheck, Crown, 
  Sparkles, ArrowLeft, CheckCircle2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function FavorisPage() {
  const supabase = createClient()
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      
      {/* --- HEADER UNIFORMISÉ (Vert Standard bg-brand) --- */}
      <div className="bg-brand pt-safe px-4 pb-6 sticky top-0 z-40 shadow-md rounded-b-[2rem]">
        <div className="flex justify-between items-center pt-2 px-2">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-white active:scale-90 transition">
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
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-brand" size={32} />
            </div>
        ) : favorites.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Heart size={40} className="opacity-10" />
                </div>
                <p className="font-bold text-sm">Aucun favori pour le moment.</p>
                <Link href="/" className="mt-4 text-brand font-bold text-sm hover:underline">
                    Découvrir des annonces
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                    {favorites.map((product) => {
                        let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                        const isPro = product.profiles?.is_pro 

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Link 
                                    href={`/annonce/${product.id}`} 
                                    className={`rounded-xl overflow-hidden flex flex-col transition border group ${
                                        isPro 
                                        ? 'bg-mustard/5 border-mustard shadow-sm shadow-mustard/20' 
                                        : 'bg-white shadow-sm border-gray-100'
                                    }`}
                                >
                                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                        {img ? (
                                            <Image 
                                                src={img} 
                                                alt={product.title} 
                                                fill 
                                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-200">
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                        
                                        {isPro && (
                                            <div className="absolute top-2 left-2 bg-mustard text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm flex items-center gap-1">
                                                <Crown size={10} strokeWidth={3} /> PRO
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-md text-red-500 shadow-sm">
                                            <Heart size={14} fill="currentColor" />
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate flex items-center gap-1">
                                            {product.title}
                                            {isPro && <ShieldCheck size={12} className="text-mustard shrink-0" />}
                                        </h3>
                                        <p className={`font-extrabold text-sm ${isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                                            {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                                        </p>
                                    </div>
                                </Link>
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
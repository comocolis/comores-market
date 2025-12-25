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
      
      {/* --- HEADER UNIFORMISÉ (Master Template) --- */}
      <div className="bg-[#1A4D2E] pt-safe px-4 pb-8 sticky top-0 z-40 shadow-md rounded-b-[2.5rem]">
        <div className="flex justify-between items-center mb-0 pt-2 px-2">
            <div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-white/80 active:scale-90 transition sm:hidden">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-white font-black text-2xl tracking-tight">Mes Favoris</h1>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 mt-1">
                    <Sparkles size={10} className="text-brand" fill="currentColor" />
                    <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Ma Sélection</p>
                </div>
            </div>
            
            {/* Badge de compteur Prestige */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <Heart size={14} className="text-white fill-white" />
                <span className="text-xs font-black text-white">{favorites.length}</span>
            </div>
        </div>
      </div>

      <div className="p-5 max-w-4xl mx-auto">
        {loading ? (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-brand" size={32} />
            </div>
        ) : favorites.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-300 pt-20 flex flex-col items-center"
            >
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-white">
                    <Heart size={40} className="opacity-10" />
                </div>
                <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">Votre liste est vide</p>
                <Link href="/" className="mt-6 text-brand font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-8">
                    Découvrir des pépites
                </Link>
            </motion.div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                <AnimatePresence>
                    {favorites.map((product, idx) => {
                        let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                        const isPro = product.profiles?.is_pro 

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link 
                                    href={`/annonce/${product.id}`} 
                                    className="group block bg-white rounded-[2.2rem] p-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-white hover:border-brand/20 transition-all duration-300 hover:shadow-xl"
                                >
                                    <div className="relative w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-gray-50 shadow-inner">
                                        {img ? (
                                            <Image 
                                                src={img} 
                                                alt={product.title} 
                                                fill 
                                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-200">
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                        
                                        {isPro && (
                                            <div className="absolute top-3 left-3 bg-brand text-white text-[9px] font-black px-2.5 py-1 rounded-xl z-10 shadow-sm flex items-center gap-1">
                                                <Crown size={10} fill="currentColor" /> PRO
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-sm text-red-500">
                                            <Heart size={14} fill="currentColor" />
                                        </div>
                                    </div>

                                    <div className="pt-4 px-2">
                                        <h3 className="font-bold text-gray-800 text-sm truncate flex items-center gap-1.5">
                                            {product.title}
                                            {isPro && <CheckCircle2 size={12} className="text-brand shrink-0" />}
                                        </h3>
                                        <p className="font-black text-brand text-[15px] mt-1">
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
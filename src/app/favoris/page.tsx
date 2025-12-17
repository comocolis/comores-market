'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Loader2, ShoppingBag, ShieldCheck, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FavorisPage() {
  const supabase = createClient()
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }

      // CHANGEMENT ICI : On récupère aussi le profil du vendeur pour savoir s'il est PRO
      const { data } = await supabase
        .from('favorites')
        .select('product:products(*, profiles(is_pro))') // Jointure imbriquée
        .eq('user_id', user.id)
      
      const products = data?.map((f: any) => f.product).filter(Boolean) || []
      setFavorites(products)
      setLoading(false)
    }
    getData()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe">
        <h1 className="text-2xl font-extrabold text-gray-900">Mes Favoris</h1>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>
        ) : favorites.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <Heart size={48} className="mb-4 opacity-20" />
                <p>Aucun favori pour le moment.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {favorites.map(product => {
                    let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    const isPro = product.profiles?.is_pro // Via la jointure

                    return (
                        <Link 
                            key={product.id} 
                            href={`/annonce/${product.id}`} 
                            className={`rounded-xl overflow-hidden flex flex-col transition hover:shadow-md border ${
                                isPro 
                                ? 'bg-yellow-50/30 border-yellow-400 shadow-sm shadow-yellow-100' 
                                : 'bg-white shadow-sm border-gray-100'
                            }`}
                        >
                            <div className="relative w-full aspect-square bg-gray-100">
                                {img ? <Image src={img} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><ShoppingBag /></div>}
                                
                                {isPro && (
                                    <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm flex items-center gap-1">
                                        <Crown size={10} strokeWidth={3} /> PRO
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-900 line-clamp-1 text-sm flex items-center gap-1">
                                    {product.title}
                                    {isPro && <ShieldCheck size={12} className="text-yellow-500 fill-yellow-100 shrink-0" />}
                                </h3>
                                <p className={`font-extrabold text-sm ${isPro ? 'text-yellow-600' : 'text-brand'}`}>
                                    {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}
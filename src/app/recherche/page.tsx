'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Loader2, ArrowLeft, Crown, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RecherchePage() {
  const supabase = createClient()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Recherche automatique avec un petit délai (debounce)
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) { setResults([]); return }
      setLoading(true)
      
      const { data } = await supabase
        .from('products_with_details') 
        .select('*')
        .ilike('title', `%${query}%`)
        .order('is_pro', { ascending: false }) 
        .limit(20)
      
      setResults(data || [])
      setLoading(false)
    }

    const timer = setTimeout(search, 500)
    return () => clearTimeout(timer)
  }, [query, supabase])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Header Recherche */}
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-extrabold text-gray-900">Recherche</h1>
        </div>
        <div className="relative">
            <input 
                type="text" 
                placeholder="Que cherchez-vous ?" 
                className="w-full bg-gray-100 p-4 pl-12 rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-mustard/50 transition"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
            />
            <Search className="absolute left-4 top-4 text-gray-400" />
        </div>
      </div>

      {/* Résultats */}
      <div className="p-4 space-y-3">
        {loading ? (
            <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand" /></div>
        ) : results.length > 0 ? (
            results.map(product => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const isPro = product.is_pro 

                return (
                    <Link 
                        key={product.id} 
                        href={`/annonce/${product.id}`} 
                        className={`p-3 rounded-xl flex gap-4 shadow-sm border active:scale-[0.99] transition ${
                            isPro 
                            ? 'bg-mustard/5 border-mustard ring-1 ring-mustard/20' 
                            : 'bg-white border-gray-100'
                        }`}
                    >
                        <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
                            {img && <Image src={img} alt="" fill className="object-cover" />}
                            
                            {/* Badge PRO Moutarde */}
                            {isPro && (
                                <div className="absolute top-1 left-1 bg-mustard text-gray-900 px-1.5 py-0.5 rounded text-[8px] font-black shadow-sm flex items-center gap-0.5">
                                    <Crown size={8} strokeWidth={3} /> PRO
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-bold text-gray-900 line-clamp-1 flex items-center gap-1">
                                {product.title}
                                {isPro && <ShieldCheck size={14} className="text-mustard fill-mustard/20 shrink-0" />}
                            </h3>
                            <p className={`font-extrabold ${isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                                {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                            </p>
                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                <MapPin size={12} /> {product.location_city}
                            </div>
                        </div>
                    </Link>
                )
            })
        ) : query.length > 1 && (
            <div className="text-center text-gray-400 pt-10">Aucun résultat trouvé.</div>
        )}
      </div>
    </div>
  )
}
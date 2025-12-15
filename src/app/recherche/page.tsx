'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Loader2, ArrowLeft } from 'lucide-react'

export default function RecherchePage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Recherche automatique avec un petit délai (debounce)
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) { setResults([]); return }
      setLoading(true)
      
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `%${query}%`) // Recherche flexible
        .limit(20)
      
      setResults(data || [])
      setLoading(false)
    }

    const timer = setTimeout(search, 500) // Attendre 500ms après la frappe
    return () => clearTimeout(timer)
  }, [query, supabase])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Header Recherche */}
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Recherche</h1>
        <div className="relative">
            <input 
                type="text" 
                placeholder="Que cherchez-vous ?" 
                className="w-full bg-gray-100 p-4 pl-12 rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-brand/20 transition"
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
                return (
                    <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white p-3 rounded-xl flex gap-4 shadow-sm border border-gray-100 active:scale-[0.99] transition">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
                            {img && <Image src={img} alt="" fill className="object-cover" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                            <p className="text-brand font-extrabold">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
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
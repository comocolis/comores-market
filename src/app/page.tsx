'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Search, Loader2, Package, Filter, X } from 'lucide-react'

// MÊME LISTE QUE DANS PUBLIER (Cohérence)
const CATEGORIES = [
  { id: 0, label: 'Tout', icon: '🔍' }, // 0 = Pas de filtre
  { id: 1, label: 'Véhicules', icon: '🚗' },
  { id: 2, label: 'Immobilier', icon: '🏠' },
  { id: 3, label: 'Mode', icon: '👕' },
  { id: 4, label: 'Tech', icon: '📱' },
  { id: 5, label: 'Maison', icon: '🪑' },
  { id: 6, label: 'Loisirs', icon: '⚽' },
  { id: 7, label: 'Alimentation', icon: '🥕' },
  { id: 8, label: 'Services', icon: '🛠️' },
  { id: 9, label: 'Beauté', icon: '💄' },
  { id: 10, label: 'Emploi', icon: '💼' },
]

const ISLANDS = ['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore', 'La Réunion']

export default function HomePage() {
  const supabase = createClient()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0) // 0 = Tout
  const [selectedIsland, setSelectedIsland] = useState('Tout')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      // Application des filtres
      if (selectedCategory !== 0) {
        query = query.eq('category_id', selectedCategory)
      }

      if (selectedIsland !== 'Tout') {
        query = query.eq('location_island', selectedIsland)
      }

      if (searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) console.error(error)
      setProducts(data || [])
      setLoading(false)
    }

    // Petit délai pour éviter de spammer la base pendant la frappe
    const timer = setTimeout(fetchProducts, 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedIsland, searchTerm, supabase])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER & RECHERCHE */}
      <div className="bg-brand pt-safe px-4 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="text-white font-extrabold text-2xl tracking-tight">Comores<span className="text-white/80">Market</span></h1>
            <Link href="/auth" className="flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition text-white text-xs font-bold shadow-sm border border-white/10">
                Connexion
            </Link>
        </div>

        <div className="relative">
            <input 
                type="text" 
                placeholder="Rechercher une bonne affaire..." 
                className="w-full bg-white p-3.5 pl-11 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-white/20 transition shadow-sm text-gray-900 placeholder:text-gray-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"><X size={18} /></button>}
        </div>
      </div>

      {/* FILTRES CATÉGORIES (Scroll Horizontal) */}
      {/* CORRECTION ICI : top-30 au lieu de top-[120px] */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-30 z-20 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    /* CORRECTION ICI : min-w-17.5 au lieu de min-w-[70px] */
                    className={`flex flex-col items-center gap-1 min-w-17.5 p-2 rounded-xl transition active:scale-95 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand font-bold border border-brand/20' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[10px] whitespace-nowrap">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* FILTRE ÎLES */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {ISLANDS.map(ile => (
            <button 
                key={ile} 
                onClick={() => setSelectedIsland(ile)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
                {ile}
            </button>
        ))}
      </div>

      {/* LISTE PRODUITS */}
      <div className="px-4 py-2 space-y-3">
        {loading ? (
            <div className="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2">
                <Loader2 className="animate-spin text-brand" size={32} />
                <span className="text-xs font-medium">Chargement...</span>
            </div>
        ) : products.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package size={32} className="opacity-30" />
                </div>
                <p>Aucune annonce trouvée.</p>
                <button onClick={() => {setSearchTerm(''); setSelectedCategory(0); setSelectedIsland('Tout')}} className="mt-4 text-brand font-bold text-sm hover:underline">
                    Effacer les filtres
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                    let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    return (
                        <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition active:scale-[0.98]">
                            <div className="relative w-full aspect-square bg-gray-100">
                                {img ? <Image src={img} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><Package /></div>}
                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded z-10 font-medium">
                                    {product.location_island}
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{product.title}</h3>
                                <p className="text-brand font-extrabold text-sm">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                                <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-1">
                                    <MapPin size={10} /> {product.location_city}
                                </div>
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
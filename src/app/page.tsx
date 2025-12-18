'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Search, SlidersHorizontal, ShieldCheck, Crown, Loader2, Package } from 'lucide-react'

export default function Home() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      // On récupère les produits actifs, triés par date (et on pourrait prioriser les PROs)
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(full_name, is_pro, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) console.error(error)
      else setProducts(data || [])
      setLoading(false)
    }

    fetchProducts()
  }, [])

  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER / RECHERCHE */}
      <div className="bg-brand p-6 pt-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Comores<span className="text-mustard">Market</span></h1>
                <p className="text-white/80 text-xs font-medium">Les meilleures affaires des îles</p>
            </div>
            <Link href="/compte" className="bg-white/20 p-1 rounded-full border border-white/30 backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand font-bold">
                   <UserIcon /> 
                </div>
            </Link>
        </div>

        <Link href="/recherche" className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-brand/20 transition active:scale-95">
            <Search className="text-gray-400" />
            <span className="text-gray-400 text-sm font-medium flex-1">Rechercher une voiture, un terrain...</span>
            <div className="bg-gray-100 p-1.5 rounded-lg">
                <SlidersHorizontal size={18} className="text-gray-600" />
            </div>
        </Link>
      </div>

      {/* LISTE DES PRODUITS */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-bold text-lg text-gray-900">Dernières Annonces</h2>
            <span className="text-xs text-brand font-bold bg-brand/10 px-2 py-1 rounded-full">{products.length} offres</span>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand" /></div>
        ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-20" />
                <p>Aucune annonce pour le moment.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {products.map((product) => {
                    let img = null
                    try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    const isPro = product.profiles?.is_pro

                    return (
                        <Link 
                            href={`/annonce/${product.id}`} 
                            key={product.id} 
                            className={`bg-white rounded-2xl shadow-sm border overflow-hidden group hover:shadow-md transition flex flex-col ${isPro ? 'border-mustard/50' : 'border-gray-100'}`}
                        >
                            {/* IMAGE CARREE */}
                            <div className="relative aspect-square bg-gray-200 overflow-hidden">
                                {img ? (
                                    <Image 
                                        src={img} 
                                        alt={product.title} 
                                        fill 
                                        // Optimisation performance image
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package /></div>
                                )}
                                
                                {/* Badge Localisation */}
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                    <MapPin size={10} /> {product.location_island}
                                </div>

                                {/* Badge PRO sur l'image */}
                                {isPro && (
                                    <div className="absolute top-2 right-2 bg-mustard text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                        <Crown size={10} /> PRO
                                    </div>
                                )}
                            </div>

                            {/* CONTENU TEXTE */}
                            <div className="p-3 flex flex-col flex-1">
                                {/* TITRE CORRIGÉ : truncate pour rester sur 1 ligne */}
                                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate" title={product.title}>
                                    {product.title}
                                </h3>
                                
                                <div className="mt-auto flex items-end justify-between">
                                    <p className={`font-extrabold text-sm ${isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                                        {new Intl.NumberFormat('fr-KM').format(product.price)} <span className="text-[10px] font-normal">KMF</span>
                                    </p>
                                    
                                    {/* Petit avatar vendeur si on veut, ou juste PRO */}
                                    {isPro && <ShieldCheck size={14} className="text-mustard" />}
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

function UserIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )
}
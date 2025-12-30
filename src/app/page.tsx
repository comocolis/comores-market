'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, Search, Loader2, Package, X, Heart, User, ShieldCheck, Crown, SlidersHorizontal, Check, RefreshCw,
  LayoutGrid, Car, Home, Shirt, Smartphone, Sofa, Ticket, Utensils, Wrench, Sparkles, Briefcase, Clock, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// --- CONSTANTES ET UTILITAIRES ---
const ITEMS_PER_PAGE = 12

const getOptimizedImage = (url: string, width = 400) => {
  if (!url) return '/placeholder.jpg'
  if (url.includes('supabase.co')) {
    return `${url}?width=${width}&quality=75&resize=contain`
  }
  return url
}

// Composant Skeleton "Silk & Stone"
const SkeletonCard = () => (
  <div className="rounded-[2.5rem] bg-white border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-5 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
    </div>
  </div>
)

const CATEGORIES = [
  { id: 0, label: 'Tout', icon: LayoutGrid }, 
  { id: 1, label: 'Véhicules', icon: Car }, 
  { id: 2, label: 'Immobilier', icon: Home }, 
  { id: 3, label: 'Mode', icon: Shirt }, 
  { id: 4, label: 'Tech', icon: Smartphone }, 
  { id: 5, label: 'Maison', icon: Sofa }, 
  { id: 6, label: 'Loisirs', icon: Ticket }, 
  { id: 7, label: 'Miam', icon: Utensils }, 
  { id: 8, label: 'Services', icon: Wrench }, 
  { id: 9, label: 'Beauté', icon: Sparkles }, 
  { id: 10, label: 'Emploi', icon: Briefcase },
]

const ISLANDS = ['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore', 'La Réunion']

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [products, setProducts] = useState<any[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // RÉCUPÉRATION AVEC SÉLECTION DE COLONNES (Léger)
  const fetchProducts = useCallback(async (isInitial = true) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setIsFetchingMore(true)
    }

    const currentPage = isInitial ? 0 : page + 1
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('products_with_details')
      .select('id, title, price, images, location_island, location_city, is_pro, boosted_until, category_id, created_at')
      .order('boosted_until', { ascending: false, nullsFirst: false }) 
      .order('is_pro', { ascending: false })
      .order('created_at', { ascending: false })
      .range(start, end)
      
    if (selectedCategory !== 0) query = query.eq('category_id', selectedCategory)
    if (selectedIsland !== 'Tout') query = query.eq('location_island', selectedIsland)
    if (searchTerm.trim()) query = query.ilike('title', `%${searchTerm}%`)
    if (priceMin) query = query.gte('price', parseInt(priceMin))
    if (priceMax) query = query.lte('price', parseInt(priceMax))

    const { data, error } = await query
    
    if (!error && data) {
      if (isInitial) {
        setProducts(data)
        setPage(0)
      } else {
        setProducts(prev => [...prev, ...data])
        setPage(currentPage)
      }
      setHasMore(data.length === ITEMS_PER_PAGE)
    }

    setLoading(false)
    setIsFetchingMore(false)
  }, [selectedCategory, selectedIsland, searchTerm, priceMin, priceMax, page, supabase])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(true), 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedIsland, searchTerm, priceMin, priceMax])

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
        if (favs) setFavorites(new Set(favs.map((f: any) => f.product_id)))
      }
    }
    loadUser()
  }, [supabase])

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!userId) { router.push('/auth'); return }
    const isFav = favorites.has(productId)
    const newFavs = new Set(favorites)
    
    if (isFav) {
      newFavs.delete(productId)
      await supabase.from('favorites').delete().match({ user_id: userId, product_id: productId })
    } else {
      newFavs.add(productId)
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
    }
    setFavorites(newFavs)
  }

  // OPTIMISATION PRESTIGE : Prefetch l'image HD au survol
  const handlePrefetch = (imagesJson: string) => {
    try {
      const images = JSON.parse(imagesJson)
      if (images && images[0]) {
        const img = new window.Image()
        img.src = images[0]
      }
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* MODALE FILTRES */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowFilters(false)}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h3 className="font-black text-xl text-gray-900 tracking-tight">Budget (KMF)</h3>
                    <button onClick={() => {setPriceMin(''); setPriceMax('')}} className="p-2 bg-gray-50 rounded-full transition active:scale-90"><RefreshCw size={18} /></button>
                </div>
                <div className="flex items-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <input type="number" className="w-full bg-transparent outline-none font-black text-gray-900 placeholder:text-gray-300" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                    <div className="w-px h-6 bg-gray-200 mx-4" />
                    <input type="number" className="w-full bg-transparent outline-none font-black text-gray-900 text-right placeholder:text-gray-300" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
                <button onClick={() => setShowFilters(false)} className="w-full bg-brand text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-brand/20 uppercase text-xs tracking-widest active:scale-95 transition">Appliquer</button>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-brand pt-safe px-4 pb-4 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="font-black text-2xl tracking-tighter text-white">Comores<span className="text-mustard">Market</span></h1>
            <Link href={userId ? "/compte" : "/auth"} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-lg border border-white/10 active:scale-90 transition">
                <User size={20} />
            </Link>
        </div>
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input type="text" placeholder="Rechercher une pépite..." className="w-full bg-white p-4 pl-12 rounded-[1.2rem] text-sm font-bold outline-none shadow-sm placeholder:text-gray-300" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search className="absolute left-4 top-4 text-gray-300" size={18} />
            </div>
            <button onClick={() => setShowFilters(true)} className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border transition ${ (priceMin || priceMax) ? 'bg-mustard border-mustard text-gray-900 shadow-lg' : 'bg-white/20 border-white/10 text-white'}`}>
                <SlidersHorizontal size={20} />
            </button>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-30 z-20 overflow-x-auto flex gap-2 px-4 scrollbar-hide shadow-sm">
        {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-2xl transition active:scale-95 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand font-black' : 'text-gray-400 font-bold'}`}>
                <cat.icon size={22} strokeWidth={selectedCategory === cat.id ? 2.5 : 2} />
                <span className="text-[9px] uppercase tracking-tighter">{cat.label}</span>
            </button>
        ))}
      </div>

      {/* ILES */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {ISLANDS.map(ile => (
          <button key={ile} onClick={() => setSelectedIsland(ile)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition whitespace-nowrap ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}>
            {ile}
          </button>
        ))}
      </div>

      {/* GRILLE */}
      <div className="px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                <Package size={40} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Aucune annonce trouvée</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product, index) => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date()
                
                return (
                  <Link key={product.id} href={`/annonce/${product.id}`} 
                        onMouseEnter={() => handlePrefetch(product.images)}
                        className={`rounded-[2.5rem] overflow-hidden flex flex-col transition active:scale-[0.98] relative border animate-in fade-in duration-500 ${isBoosted ? 'border-amber-300 bg-amber-50/20 ring-4 ring-amber-50 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}>
                    
                    <div className="relative aspect-square w-full bg-gray-50">
                      <Image 
                        src={getOptimizedImage(img, 400)} 
                        alt={product.title} 
                        fill 
                        className="object-cover transition duration-700 hover:scale-110" 
                        priority={index < 4}
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                        {isBoosted && (
                          <div className="bg-amber-500 text-white text-[7px] font-black px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                            <Sparkles size={8} fill="currentColor" /> VEDETTE
                          </div>
                        )}
                        {product.is_pro && !isBoosted && (
                          <div className="bg-mustard text-gray-900 text-[8px] font-black px-2.5 py-0.5 rounded-full shadow-sm">PRO</div>
                        )}
                      </div>

                      <button onClick={(e) => toggleFavorite(e, product.id)} className="absolute top-3 right-3 p-2.5 rounded-2xl bg-white/80 backdrop-blur-md text-gray-400 active:scale-75 transition-transform">
                        <Heart size={14} className={favorites.has(product.id) ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-black text-gray-900 text-xs truncate mb-1.5 tracking-tight uppercase leading-none">{product.title}</h3>
                      <p className={`font-black text-sm tracking-tighter ${isBoosted ? 'text-amber-600' : 'text-brand'}`}>
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                      </p>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[8px] font-black uppercase mt-2 tracking-widest">
                        <MapPin size={8} className="text-brand/50" /> {product.location_city}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center pb-10">
                <button 
                  onClick={() => fetchProducts(false)} 
                  disabled={isFetchingMore}
                  className="bg-white border border-gray-100 px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 shadow-sm active:scale-95 transition-all flex items-center gap-3"
                >
                  {isFetchingMore ? <Loader2 size={16} className="animate-spin text-brand" /> : <>Voir plus <ChevronDown size={14} /></>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
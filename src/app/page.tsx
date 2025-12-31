'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, Search, Loader2, Package, X, Heart, User, ShieldCheck, Crown, SlidersHorizontal, Check, RefreshCw,
  LayoutGrid, Car, Home, Shirt, Smartphone, Sofa, Ticket, Utensils, Wrench, Sparkles, Briefcase, ChevronDown
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

// Composant Skeleton pour le chargement initial
const SkeletonCard = () => (
  <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
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
  
  // États de données
  const [products, setProducts] = useState<any[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  
  // États de pagination et chargement
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // États de filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // --- RÉCUPÉRATION OPTIMISÉE (SELECT COLONNES + PAGINATION) ---
  const fetchProducts = useCallback(async (isInitial = true) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setIsFetchingMore(true)
    }

    const currentPage = isInitial ? 0 : page + 1
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    // OPTIMISATION SQL : Sélection chirurgicale des colonnes
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

  // Recherche avec Debounce
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(true), 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedIsland, searchTerm, priceMin, priceMax])

  // Chargement utilisateur et favoris [cite: 2025-12-09]
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
      toast.info("Retiré des favoris")
    } else {
      newFavs.add(productId)
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
      toast.success("Ajouté aux favoris")
    }
    setFavorites(newFavs)
  }

  // Prefetch au survol pour accélération
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
      
      {/* MODALE FILTRES BUDGET */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowFilters(false)}>
            <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">Filtrer par prix</h3>
                    <button onClick={() => {setPriceMin(''); setPriceMax('')}} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full transition active:scale-90">
                        <RefreshCw size={18} />
                    </button>
                </div>
                <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-200">
                    <div className="flex-1 px-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Minimum</span>
                        <input type="number" className="w-full bg-transparent outline-none font-bold text-gray-900 text-lg placeholder:text-gray-300" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                    </div>
                    <div className="w-px h-8 bg-gray-200 mx-2"></div>
                    <div className="flex-1 px-3 text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Maximum</span>
                        <input type="number" className="w-full bg-transparent outline-none font-bold text-gray-900 text-lg placeholder:text-gray-300 text-right" placeholder="Illimité" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                    </div>
                </div>
                <button onClick={() => setShowFilters(false)} className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                    <Check size={20} /> Voir les annonces
                </button>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-brand pt-safe px-4 pb-4 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="font-extrabold text-2xl tracking-tight">
                <span className="text-white">Comores</span>
                <span className="text-mustard">Market</span>
            </h1>
            <Link href={userId ? `/profil/${userId}` : "/auth"} className="flex items-center justify-center bg-white/20 w-9 h-9 rounded-full backdrop-blur-sm hover:bg-white/30 transition shadow-sm border border-white/10">
                <User size={18} className="text-white" />
            </Link>
        </div>
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input type="text" placeholder="Que cherchez-vous ?" className="w-full bg-white p-3.5 pl-11 rounded-2xl text-sm font-medium outline-none shadow-sm text-gray-900 placeholder:text-gray-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400"><X size={18} /></button>}
            </div>
            <button onClick={() => setShowFilters(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm border relative ${(priceMin || priceMax) ? 'bg-mustard text-gray-900 border-mustard' : 'bg-white/20 text-white border-white/10'}`}>
                <SlidersHorizontal size={20} />
                {(priceMin || priceMax) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-mustard"></span>}
            </button>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-30 z-20 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-2xl transition active:scale-95 group ${selectedCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/20' : 'text-gray-400'}`}>
                    <cat.icon size={24} strokeWidth={1.5} className={selectedCategory === cat.id ? 'text-brand' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* ILES */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {ISLANDS.map(ile => (
          <button key={ile} onClick={() => setSelectedIsland(ile)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
            {ile}
          </button>
        ))}
      </div>

      {/* GRID PRODUITS (DESIGN CONSERVÉ) */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Package size={32} className="opacity-30" /></div>
            <p>Aucune annonce trouvée.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product, index) => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const isFav = favorites.has(product.id)
                const isPro = product.is_pro
                const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date();
                
                return (
                  <Link key={product.id} href={`/annonce/${product.id}`} 
                        onMouseEnter={() => handlePrefetch(product.images)}
                        className={`rounded-2xl overflow-hidden flex flex-col transition active:scale-[0.98] relative group animate-in fade-in duration-500 ${
                          isBoosted 
                          ? 'bg-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-4 ring-amber-50' 
                          : isPro 
                            ? 'bg-mustard/5 border-2 border-mustard shadow-md shadow-mustard/20 ring-2 ring-mustard/10' 
                            : 'bg-white shadow-sm border border-gray-100'
                        }`}>
                    
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      {img && (
                        <Image 
                          src={getOptimizedImage(img, 400)} 
                          alt={product.title} 
                          fill 
                          sizes="50vw" 
                          priority={index < 4}
                          className="object-cover transition duration-500 group-hover:scale-110" 
                        />
                      )}
                      
                      {/* BADGES */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {isBoosted && (
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg border border-white/20 flex items-center gap-1">
                            <Sparkles size={10} className="animate-pulse" /> EN VEDETTE
                          </div>
                        )}
                        {isPro && !isBoosted && (
                          <div className="bg-mustard text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Crown size={10} strokeWidth={3} /> PRO
                          </div>
                        )}
                      </div>

                      <button onClick={(e) => toggleFavorite(e, product.id)} className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm z-10 text-gray-500">
                        <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : ""} />
                      </button>
                      
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] px-1.5 py-0.5 rounded z-10 font-bold uppercase tracking-widest">
                        {product.location_island}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 truncate flex items-center gap-1">
                        {product.title}
                        {isPro && <ShieldCheck size={12} className="text-mustard fill-mustard/20 shrink-0" />}
                      </h3>
                      <p className={`font-extrabold text-sm ${isBoosted ? 'text-amber-600' : isPro ? 'text-amber-700' : 'text-brand'}`}>
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                      </p>
                      <div className="flex items-center gap-1 text-gray-400 text-[9px] font-bold uppercase mt-1 tracking-tight">
                        <MapPin size={10} className="text-brand/50" /> {product.location_city}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* BOUTON CHARGER PLUS */}
            {hasMore && (
              <div className="mt-8 flex justify-center pb-10">
                <button 
                  onClick={() => fetchProducts(false)} 
                  disabled={isFetchingMore}
                  className="bg-white border border-gray-100 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm active:scale-95 transition-all flex items-center gap-3"
                >
                  {isFetchingMore ? (
                    <Loader2 size={16} className="animate-spin text-brand" />
                  ) : (
                    <>Voir plus d'annonces <ChevronDown size={14} /></>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
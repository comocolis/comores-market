'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, Search, User, SlidersHorizontal, Loader2,
  LayoutGrid, Car, Home, Shirt, Smartphone, Sofa, Ticket, Utensils, Wrench, Sparkles, Briefcase, Crown
} from 'lucide-react'
import { toast } from 'sonner'
import { trackSearch, trackCategoryView, trackFilterApplied } from '@/lib/analytics'
import { getOrCreateVisitorId, trackProductClickHistory, trackSearchHistory } from '@/lib/personalization'
import type { HomepageProduct } from '@/lib/homepage-types'
import { SkeletonProductGrid } from '@/components/Skeleton'
import { EmptyStateSearchResults } from '@/components/EmptyState'
import ProductSuggestions from '@/components/ProductSuggestions'
import dynamic from 'next/dynamic'

// ✅ Lazy Loading de la modale Filtres
const FilterModal = dynamic(() => import('@/components/FilterModal'), {
  loading: () => null,
  ssr: false 
})

// --- TYPE DEFINITIONS ---
export type Product = HomepageProduct

const ITEMS_PER_PAGE = 20

// --- CONSTANTES ---
const CATEGORIES = [
  { id: 0, label: 'Tout', icon: LayoutGrid }, 
  { id: 1, label: 'Véhicules', icon: Car }, 
  { id: 2, label: 'Immobilier', icon: Home }, 
  { id: 3, label: 'Mode', icon: Shirt }, 
  { id: 4, label: 'Tech', icon: Smartphone }, 
  { id: 5, label: 'Maison', icon: Sofa }, 
  { id: 6, label: 'Loisirs', icon: Ticket }, 
  { id: 7, label: 'Alimentation', icon: Utensils },
  { id: 8, label: 'Services', icon: Wrench }, 
  { id: 9, label: 'Beauté', icon: Sparkles }, 
  { id: 10, label: 'Emploi', icon: Briefcase },
]

const SUB_CATEGORIES: { [key: number]: string[] } = {
  1: ['Voitures', 'Motos & Scooters', 'Pièces Détachées', 'Location Véhicules', 'Camions & Poids Lourds', 'Bateaux & Nautisme', 'Engins BTP', 'Vélos & Trottinettes'],
  2: ['Vente Maison', 'Vente Terrain', 'Vente Appartement', 'Location Maison', 'Location Appartement', 'Bureaux & Commerces', 'Location Vacances', 'Terrains Agricoles', 'Colocation'],
  3: ['Vêtements Homme', 'Vêtements Femme', 'Enfant & Bébé', 'Chaussures', 'Montres & Bijoux', 'Sacs & Accessoires', 'Mariage & Tradition', 'Lingerie', 'Sportswear'],
  4: ['Téléphones', 'Tablettes', 'Ordinateurs', 'TV & Home Cinéma', 'Audio & Son', 'Appareils Photo', 'Accessoires Info', 'Consoles & Jeux', 'Objets Connectés'],
  5: ['Meubles', 'Décoration', 'Électroménager', 'Bricolage', 'Jardin & Plantes', 'Linge de maison', 'Arts de la table', 'Animaux'],
  6: ['Sports', 'Instruments de musique', 'Livres & Papeterie', 'Jeux & Jouets', 'Voyages & Billets', 'Chasse & Pêche', 'Collections'],
  7: ['Fruits & Légumes', 'Plats cuisinés', 'Épicerie', 'Boissons', 'Produits frais', 'Épices & Vanille', 'Miel & Confitures', 'Pâtisserie'],
  8: ['Cours & Formations', 'Réparations', 'Déménagement', 'Événements', 'Ménage & Aide', 'Transport & Logistique', 'Couture & Retouches', 'Santé & Bien-être'],
  9: ['Parfums', 'Maquillage', 'Soins Visage & Corps', 'Coiffure', 'Matériel Pro', 'Onglerie', 'Hygiène'],
  10: ['Offres d\'emploi', 'Demandes d\'emploi', 'Stages', 'Intérim', 'Freelance'],
}

const ISLANDS = ['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore']

interface HomePageClientProps {
  initialProducts: Product[]
  renderedAt: string
  initialHasMore?: boolean
}

export default function HomePageClient({ initialProducts, renderedAt, initialHasMore = false }: HomePageClientProps) {
  const supabase = createClient()
  
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [userId, setUserId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [currentTimestamp, setCurrentTimestamp] = useState(() => new Date(renderedAt).getTime())
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tout')
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [authResolved, setAuthResolved] = useState(false)
  const [visitorReady, setVisitorReady] = useState(false)
  
  const headerRef = useRef<HTMLDivElement | null>(null)
  const categoryBarRef = useRef<HTMLDivElement | null>(null)
  const subNavRef = useRef<HTMLDivElement | null>(null)

  // --- LOGIQUE DE SCROLL INTELLIGENT ---
  const [showSubNav, setShowSubNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setShowSubNav(false)
      } else {
        setShowSubNav(true)
      }
      setLastScrollY(currentScrollY)
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', handleScroll, { passive: true })
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [lastScrollY])

  useEffect(() => {
    setCurrentTimestamp(Date.now())
  }, [])

  useEffect(() => {
    const updateStickyOffsets = () => {
      const headerHeight = headerRef.current?.offsetHeight ?? 108
      const categoryBarHeight = categoryBarRef.current?.offsetHeight ?? 70
      const stickyOverlap = 1

      categoryBarRef.current?.style.setProperty('top', `${Math.max(headerHeight - stickyOverlap, 0)}px`)
      subNavRef.current?.style.setProperty('top', `${Math.max(headerHeight + categoryBarHeight - (stickyOverlap * 2), 0)}px`)
    }

    updateStickyOffsets()

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateStickyOffsets())
      : null

    if (headerRef.current && resizeObserver) {
      resizeObserver.observe(headerRef.current)
    }

    if (categoryBarRef.current && resizeObserver) {
      resizeObserver.observe(categoryBarRef.current)
    }

    window.addEventListener('resize', updateStickyOffsets)

    return () => {
      window.removeEventListener('resize', updateStickyOffsets)
      resizeObserver?.disconnect()
    }
  }, [])

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId())
    setVisitorReady(true)
  }, [])

  const fetchProducts = useCallback(async (isInitial = true, targetPage = 0) => {
    if (isInitial) {
        setLoading(true)
        if (searchTerm.trim().length > 2) trackSearch(searchTerm)
        if (selectedIsland !== 'Tout' || selectedSubCategory !== 'Tout' || priceMin || priceMax) {
             const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Tout';
             trackFilterApplied({ island: selectedIsland, category: categoryLabel, sub_category: selectedSubCategory, price_min: priceMin, price_max: priceMax })
        }
    } else {
      setIsFetchingMore(true)
    }

    try {
      const nextPage = targetPage
      const searchParams = new URLSearchParams({
        selectedCategory: selectedCategory.toString(),
        selectedSubCategory,
        selectedIsland,
        limit: ITEMS_PER_PAGE.toString(),
        offset: (nextPage * ITEMS_PER_PAGE).toString(),
      })

      if (searchTerm.trim()) searchParams.set('searchTerm', searchTerm.trim())
      if (priceMin) searchParams.set('priceMin', priceMin)
      if (priceMax) searchParams.set('priceMax', priceMax)
      if (visitorId) searchParams.set('visitorId', visitorId)

      const response = await fetch(`/api/home-products?${searchParams.toString()}`, {
        cache: 'no-store',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erreur lors du chargement des produits')
      }

      const rankedProducts = (payload.products || []) as Product[]

      setProducts(previousProducts => isInitial ? rankedProducts : [...previousProducts, ...rankedProducts])
      setPage(nextPage)
      setHasMore(Boolean(payload.hasMore))

      if (searchTerm.trim().length > 1) {
        trackSearchHistory({
          query: searchTerm,
          categoryId: selectedCategory !== 0 ? selectedCategory : undefined,
          island: selectedIsland !== 'Tout' ? selectedIsland : undefined,
          resultsCount: rankedProducts.length,
          visitorId,
        })
      }
      
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Erreur lors du chargement des produits')
    } finally { // ✅ Correction apportée ici !
      setLoading(false)
      setIsFetchingMore(false)
    }
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax, visitorId])

  useEffect(() => {
    if (!visitorReady || !authResolved) return

    setPage(0)
    setHasMore(initialHasMore)

    const timer = setTimeout(() => fetchProducts(true, 0), 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax, visitorReady, authResolved, fetchProducts, initialHasMore])

  // Track category changes
  useEffect(() => {
    if (selectedCategory !== 0) {
      const category = CATEGORIES.find(c => c.id === selectedCategory)
      trackCategoryView(category?.label || 'Inconnu', selectedCategory)
    }
  }, [selectedCategory])

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
      setAuthResolved(true)
    }
    loadUser()
  }, [supabase])

  const handleCategorySelect = (catId: number) => {
    setSelectedCategory(catId)
    setSelectedSubCategory('Tout')
  }

  const handleViewAllListings = () => {
    setSearchTerm('')
    setSelectedCategory(0)
    setSelectedSubCategory('Tout')
    setSelectedIsland('Tout')
    setPriceMin('')
    setPriceMax('')
  }

  const currentSubCats = selectedCategory !== 0 ? SUB_CATEGORIES[selectedCategory] : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* 1. HEADER FIXE */}
      <div ref={headerRef} className="bg-brand pt-safe px-4 pb-4 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="font-extrabold text-2xl tracking-tight">
                <span className="text-white">Comores</span>
                <span className="text-mustard">Market</span>
            </h1>
            <Link 
              href={userId ? `/profil?id=${userId}` : "/auth"} 
              className="flex items-center justify-center bg-white/20 w-9 h-9 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/30 transition"
              aria-label="Mon Profil"
            >
                <User size={18} className="text-white" />
            </Link>
        </div>
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Que cherchez-vous ?" 
                    className="w-full bg-white p-3.5 pl-11 rounded-2xl text-sm font-medium outline-none shadow-sm text-gray-900 placeholder:text-gray-500 border border-transparent focus:border-mustard transition-all" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
                <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
            </div>
            <button 
              onClick={() => setShowFilters(true)} 
              aria-label="Filtres"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition border relative hover:shadow-md active:scale-95 ${(priceMin || priceMax) ? 'bg-mustard text-gray-900 border-mustard shadow-md shadow-mustard/20' : 'bg-white/20 text-white border-white/10 hover:bg-white/30'}`}
            >
                <SlidersHorizontal size={20} />
            </button>
        </div>
      </div>

      {/* 2. BARRE CATEGORIES FIXE */}
      <div ref={categoryBarRef} className="bg-white border-b border-gray-100 py-3 sticky z-40 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => handleCategorySelect(cat.id)} 
                  className={`flex flex-col items-center gap-1.5 min-w-17.5 p-2 rounded-2xl transition active:scale-95 group hover:bg-gray-50 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/20' : 'text-gray-500'}`}
                >
                    <cat.icon size={24} strokeWidth={1.5} className={selectedCategory === cat.id ? 'text-brand' : 'text-gray-500'} />
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* 3. BARRE SOUS-CATEGORIES & ILES (INTELLIGENTE) */}
      <div ref={subNavRef} className={`bg-gray-50 border-b border-gray-100 py-3 sticky z-30 shadow-sm transition-all duration-300 ease-in-out ${showSubNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="space-y-3">
          <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {ISLANDS.map(ile => (
              <button key={ile} onClick={() => setSelectedIsland(ile)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap hover:shadow-sm ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                {ile}
              </button>
            ))}
          </div>
          
          {currentSubCats.length > 0 && (
            <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100 pt-3">
               <button onClick={() => setSelectedSubCategory('Tout')} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap hover:shadow-sm ${selectedSubCategory === 'Tout' ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Tout</button>
               {currentSubCats.map(sub => (
                 <button key={sub} onClick={() => setSelectedSubCategory(sub)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap hover:shadow-sm ${selectedSubCategory === sub ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{sub}</button>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* GRID PRODUITS */}
      <div className="px-4 py-2 pb-24 mt-4">
        {loading ? (
          <SkeletonProductGrid count={12} />
        ) : products.length === 0 ? (
            <EmptyStateSearchResults onViewAll={handleViewAllListings} />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {products.map((product, index) => {
              let img = '/placeholder.png'
              try {
                const parsed = JSON.parse(product.images)
                img = Array.isArray(parsed) ? parsed[0] : parsed ? parsed : '/placeholder.png'
              } catch (e) {
                img = product.images || '/placeholder.png'
              }

              const isBoosted = product.boosted_until ? new Date(product.boosted_until).getTime() > currentTimestamp : false

              return (
                <Link 
                  key={product.id} 
                  href={`/annonce?id=${product.id}`}
                  onClick={() => trackProductClickHistory({ productId: product.id, source: 'home_feed', visitorId })}
                  className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <Image 
                      src={img} 
                      alt={product.title} 
                      fill 
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      priority={index < 4}
                      quality={75}
                    />
                    
                    {/* BADGES */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {isBoosted && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
                                <Sparkles size={10} fill="currentColor" /> VEDETTE
                            </span>
                        )}
                        {product.is_pro && (
                            <span className="bg-black/80 backdrop-blur-md text-white border border-white/20 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
                                <Crown size={10} className="text-amber-400 fill-amber-400" /> PRO
                            </span>
                        )}
                    </div>
                    
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-lg font-bold uppercase flex items-center gap-1">
                        {product.location_island}
                    </div>
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-1 group-hover:text-brand transition-colors">
                        {product.title}
                    </h3>
                    <div className="mt-auto flex flex-col gap-1">
                        <span className="text-brand font-black text-base tracking-tight">
                            {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                        </span>
                        <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase font-bold tracking-wide">
                            <MapPin size={10} className="text-gray-400" /> {product.location_city}
                        </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {products.length > 0 && hasMore && (
          <div className="flex justify-center pt-2 pb-8">
            <button
              onClick={() => fetchProducts(false, page + 1)}
              disabled={loading || isFetchingMore}
              className="bg-white border border-gray-200 text-gray-900 font-bold py-3 px-8 rounded-full shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              {isFetchingMore ? <Loader2 className="animate-spin" size={16} /> : "Voir plus d'annonces"}
            </button>
          </div>
        )}

      </div>

      {/* 4. RECOMMANDATIONS (CLIENT-SIDE) */}
      <ProductSuggestions 
        title="✨ Pour vous" 
        limit={6} 
        userId={userId} 
      />

      {showFilters && (
        <FilterModal 
          onClose={() => setShowFilters(false)} 
          priceMin={priceMin}
          setPriceMin={setPriceMin}
          priceMax={priceMax}
          setPriceMax={setPriceMax}
        />
      )}
    </div>
  )
}
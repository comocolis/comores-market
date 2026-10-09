'use client'

import { getSupabase, hasSessionCookie } from '@/utils/supabase/lazy'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { 
  Search, User, SlidersHorizontal, Loader2,
  LayoutGrid, Car, Home, Shirt, Smartphone, Sofa, Ticket, Utensils, Wrench, Sparkles, Briefcase
} from 'lucide-react'
import { trackSearch, trackCategoryView, trackFilterApplied } from '@/lib/analytics'
import { getOrCreateVisitorId, isReturningVisitor, trackProductClickHistory, trackSearchHistory } from '@/lib/personalization'
import type { HomepageProduct } from '@/lib/homepage-types'
import { SkeletonProductGrid } from '@/components/Skeleton'
import { EmptyStateSearchResults } from '@/components/EmptyState'
import ProductSuggestions from '@/components/ProductSuggestions'
import dynamic from 'next/dynamic'
import { UiChip } from '@/components/ui'

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
  
  const initialFetchDoneRef = useRef(false)
  const canPersonalizeRef = useRef(false)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const categoryBarRef = useRef<HTMLDivElement | null>(null)
  const subNavRef = useRef<HTMLDivElement | null>(null)

  // --- LOGIQUE DE SCROLL INTELLIGENT ---
  const [showSubNav, setShowSubNav] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    // lastScrollY en ref : aucun re-rendu ni re-abonnement a chaque evenement scroll,
    // le state ne change que lorsque la visibilite de la sous-navigation bascule.
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const shouldShow = !(currentScrollY > lastScrollYRef.current && currentScrollY > 200)
      lastScrollYRef.current = currentScrollY
      setShowSubNav(previous => (previous === shouldShow ? previous : shouldShow))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    // Nouveau visiteur anonyme : aucun historique, la liste du serveur est deja la bonne (pas de second chargement).
    canPersonalizeRef.current = isReturningVisitor() || hasSessionCookie()
    setVisitorId(getOrCreateVisitorId())
    setVisitorReady(true)
  }, [])

  const fetchProducts = useCallback(async (isInitial = true, targetPage = 0, silent = false) => {
    if (isInitial) {
        // silent : rafraichissement personnalise du premier rendu, sans masquer la liste deja affichee par le SSR
        if (!silent) setLoading(true)
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
      // sonner est charge a la demande (hors du bundle initial)
      import('sonner').then(({ toast }) => toast.error('Erreur lors du chargement des produits'))
    } finally { // ✅ Correction apportée ici !
      setLoading(false)
      setIsFetchingMore(false)
    }
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax, visitorId])

  useEffect(() => {
    if (!visitorReady || !authResolved) return

    setPage(0)
    setHasMore(initialHasMore)

    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true
      if (canPersonalizeRef.current) fetchProducts(true, 0, true)
      return
    }

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
    // Visiteur anonyme : aucun besoin de charger la librairie Supabase (~170 Ko) sur l'accueil.
    if (!hasSessionCookie()) {
      setAuthResolved(true)
      return
    }

    const loadUser = async () => {
      try {
        const supabase = await getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)
      } finally {
        setAuthResolved(true)
      }
    }
    loadUser()
  }, [])

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
      <div ref={headerRef} className="relative bg-brand pt-safe px-4 pb-5 sticky top-0 z-50 shadow-md overflow-hidden">
        {/* Halos en degrades radiaux : meme rendu que blur-3xl, sans filtre GPU couteux sur mobiles modestes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgb(255_255_255/0.14),transparent_45%),radial-gradient(circle_at_-5%_70%,rgb(251_191_36/0.22),transparent_40%)]" />
        <div className="relative flex justify-between items-center mb-4 pt-2">
            <h1 className="font-display text-2xl font-black tracking-tight">
                <span className="text-white">Comores</span>
                <span className="text-mustard">Market</span>
            </h1>
            <Link 
              href={userId ? `/profil?id=${userId}` : "/auth"} 
              prefetch={userId ? undefined : false}
              className="flex items-center justify-center bg-white/20 w-9 h-9 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/30 transition"
              aria-label="Mon Profil"
            >
                <User size={18} className="text-white" />
            </Link>
        </div>
        <div className="relative flex gap-2 rounded-3xl bg-white/10 p-2 shadow-pop backdrop-blur-md border border-white/20">
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
                  className={`flex flex-col items-center gap-1.5 min-w-17.5 p-2 rounded-2xl transition active:scale-95 group hover:bg-gray-50 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand-700 border border-brand/20' : 'text-gray-500'}`}
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
              <UiChip key={ile} active={selectedIsland === ile} tone="neutral" onClick={() => setSelectedIsland(ile)}>
                {ile}
              </UiChip>
            ))}
          </div>
          
          {currentSubCats.length > 0 && (
            <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100 pt-3">
               <UiChip active={selectedSubCategory === 'Tout'} onClick={() => setSelectedSubCategory('Tout')}>Tout</UiChip>
               {currentSubCats.map(sub => (
                 <UiChip key={sub} active={selectedSubCategory === sub} onClick={() => setSelectedSubCategory(sub)}>{sub}</UiChip>
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
              const isBoosted = product.boosted_until ? new Date(product.boosted_until).getTime() > currentTimestamp : false

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  isPro={product.is_pro}
                  isBoosted={isBoosted}
                  onClick={() => trackProductClickHistory({ productId: product.id, source: 'home_feed', visitorId })}
                />
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
        title="Pour vous" 
        icon={Sparkles}
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
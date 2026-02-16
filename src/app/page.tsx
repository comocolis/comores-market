'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, Search, Loader2, User, ShieldCheck, Crown, SlidersHorizontal,
  LayoutGrid, Car, Home, Shirt, Smartphone, Sofa, Ticket, Utensils, Wrench, Sparkles, Briefcase, ChevronDown, Heart
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getFirstProductImage } from '@/utils/parseImages'
import { trackSearch, trackCategoryView, trackFilterApplied } from '@/lib/analytics'
import { SkeletonProductGrid } from '@/components/Skeleton'
import { EmptyStateSearchResults } from '@/components/EmptyState'
import { BLUR_PLACEHOLDERS } from '@/utils/blurPlaceholder'
import ProductSuggestions from '@/components/ProductSuggestions'
import dynamic from 'next/dynamic'

// ✅ Lazy Loading de la modale Filtres
const FilterModal = dynamic(() => import('@/components/FilterModal'), {
  loading: () => null,
  ssr: false 
})

// --- TYPE DEFINITIONS ---
interface Product {
  id: string
  title: string
  price: number
  images: string
  location_island: string
  location_city: string
  is_pro: boolean
  boosted_until: string | null
  created_at: string
  category_id: number
  sub_category: string
}

interface Favorite {
  product_id: string
}

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 12

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

// ✅ LISTE DES ILES CORRIGÉE (Sans La Réunion)
const ISLANDS = ['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore']

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tout')
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

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

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => { setSelectedSubCategory('Tout') }, [selectedCategory])

  const fetchProducts = useCallback(async (isInitial = true) => {
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

    const currentPage = isInitial ? 0 : page + 1
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('products_with_details')
      .select('id, title, price, images, location_island, location_city, is_pro, boosted_until, created_at, category_id, sub_category')
      // ✅ LOGIQUE DE PRIORITÉ STRICTE
      // 1. Les Boosts actifs (dates futures) passent devant tout le monde.
      // NOTE : Assurez-vous que votre base de données met à NULL les boosts expirés, ou qu'ils sont des dates passées.
      .order('boosted_until', { ascending: false, nullsFirst: false }) 
      // 2. Les comptes PROS passent ensuite.
      .order('is_pro', { ascending: false })
      // 3. Enfin, le tri chronologique classique.
      .order('created_at', { ascending: false })
      .range(start, end)
      
    if (selectedCategory !== 0) { 
      query = query.eq('category_id', selectedCategory)
      if (selectedSubCategory !== 'Tout') query = query.eq('sub_category', selectedSubCategory) 
    }
    if (selectedIsland !== 'Tout') query = query.eq('location_island', selectedIsland)
    if (searchTerm.trim()) query = query.ilike('title', `%${searchTerm}%`)
    if (priceMin) query = query.gte('price', parseInt(priceMin))
    if (priceMax) query = query.lte('price', parseInt(priceMax))

    const { data, error } = await query
    
    if (error) {
      toast.error('Erreur lors du chargement des produits')
      setLoading(false)
      setIsFetchingMore(false)
      return
    }

    if (data) {
      // ✅ SUPPRESSION DU MÉLANGE ALÉATOIRE (shuffleArray)
      // Pour respecter la hiérarchie Boost > Pro, on ne doit jamais mélanger les résultats.
      setProducts(isInitial ? data : [...products, ...data])
      setPage(currentPage)
      setHasMore(data.length === ITEMS_PER_PAGE)
    }
    setLoading(false)
    setIsFetchingMore(false)
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax, page, products, supabase])

  // DEBOUNCE
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(true), 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax])

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
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
        if (favs) setFavorites(new Set((favs as Favorite[]).map((f) => f.product_id)))
      }
    }
    loadUser()
  }, [])

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

  const currentSubCats = selectedCategory !== 0 ? SUB_CATEGORIES[selectedCategory] : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* 1. HEADER FIXE */}
      <div className="bg-brand pt-safe px-4 pb-4 sticky top-0 z-50 shadow-md">
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
      <div className="bg-white border-b border-gray-100 py-3 sticky top-27 z-40 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-1.5 min-w-17.5 p-2 rounded-2xl transition active:scale-95 group hover:bg-gray-50 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/20' : 'text-gray-500'}`}>
                    <cat.icon size={24} strokeWidth={1.5} className={selectedCategory === cat.id ? 'text-brand' : 'text-gray-500'} />
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* 3. BARRE SOUS-CATEGORIES & ILES (INTELLIGENTE) */}
      <div className={`bg-gray-50 border-b border-gray-100 py-3 sticky z-30 shadow-sm transition-all duration-300 ease-in-out ${showSubNav ? 'top-44.5 translate-y-0 opacity-100' : 'top-27 -translate-y-full opacity-0 pointer-events-none'}`}>
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
          <EmptyStateSearchResults />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product, index) => { 
                const img = getFirstProductImage(product.images)
                const isFav = favorites.has(product.id)
                const isPro = product.is_pro
                // Vérification Active : Boost actif si date future
                const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date();
                
                return (
                  <Link key={product.id} href={`/annonce?id=${product.id}`} 
                        className={`rounded-2xl overflow-hidden flex flex-col transition active:scale-[0.98] relative group ${
                          isBoosted 
                          ? 'bg-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-4 ring-amber-50' 
                          : isPro 
                            ? 'bg-mustard/5 border-2 border-mustard shadow-md shadow-mustard/20 ring-2 ring-mustard/10' 
                            : 'bg-white shadow-sm border border-gray-200'
                        }`}>
                    
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      {img && (
                        <Image 
                            src={img} 
                            alt={product.title} 
                            fill 
                            // ✅ OPTIMISATION : Tailles adaptatives pour mobile
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover transition duration-500 group-hover:scale-110" 
                            placeholder="blur" 
                            blurDataURL={BLUR_PLACEHOLDERS.product}
                            priority={index < 4} 
                        />
                      )}
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {isBoosted && (
                          <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg border border-white/20 flex items-center gap-1">
                            <Sparkles size={10} className="animate-pulse" /> EN VEDETTE
                          </div>
                        )}
                        {isPro && !isBoosted && (
                          <div className="bg-mustard text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Crown size={10} strokeWidth={3} /> PRO
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => toggleFavorite(e, product.id)} 
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm z-10 text-gray-600 hover:text-red-500 transition"
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : ""} />
                      </button>
                      
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] px-1.5 py-0.5 rounded z-10 font-bold uppercase tracking-widest">
                        {product.location_island}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 truncate flex items-center gap-1">
                        {product.title}
                        {isPro && <ShieldCheck size={12} className="text-mustard shrink-0" />}
                      </h3>
                      <p className={`font-extrabold text-sm ${isBoosted ? 'text-amber-600' : isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                      </p>
                      <div className="flex items-center gap-1 text-gray-500 text-[9px] font-bold uppercase mt-1">
                        <MapPin size={10} className="text-brand/60" /> {product.location_city}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* SUGGESTIONS INTELLIGENTES */}
            {!loading && products.length >= 12 && page === 0 && (
              <ProductSuggestions 
                userId={userId} 
                category={selectedCategory}
                limit={6}
                title={userId ? "Recommandé pour vous" : "Annonces populaires"}
              />
            )}

            {hasMore && (
              <div className="mt-8 flex justify-center pb-10">
                <button 
                    onClick={() => fetchProducts(false)} 
                    disabled={isFetchingMore} 
                    className="bg-white border border-gray-100 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-3 hover:bg-gray-50"
                >
                  {isFetchingMore ? <Loader2 size={16} className="animate-spin text-brand" /> : <>Voir plus d'annonces <ChevronDown size={14} /></>}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ MODALE FILTRE CHARGÉE À LA DEMANDE */}
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
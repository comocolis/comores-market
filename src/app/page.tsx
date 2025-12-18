'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Search, Loader2, Package, X, Heart, User, ShieldCheck, Crown, ZoomIn, SlidersHorizontal, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 0, label: 'Tout', icon: '🔍' }, { id: 1, label: 'Véhicules', icon: '🚗' }, { id: 2, label: 'Immobilier', icon: '🏠' }, { id: 3, label: 'Mode', icon: '👕' }, { id: 4, label: 'Tech', icon: '📱' }, { id: 5, label: 'Maison', icon: '🪑' }, { id: 6, label: 'Loisirs', icon: '⚽' }, { id: 7, label: 'Alimentation', icon: '🥕' }, { id: 8, label: 'Services', icon: '🛠️' }, { id: 9, label: 'Beauté', icon: '💄' }, { id: 10, label: 'Emploi', icon: '💼' },
]

const SUB_CATEGORIES: { [key: number]: string[] } = {
  1: ['Voitures', 'Motos', 'Pièces Détachées', 'Location', 'Camions', 'Bateaux'],
  2: ['Vente Maison', 'Vente Terrain', 'Location Maison', 'Location Appartement', 'Bureaux & Commerces', 'Colocation'],
  3: ['Vêtements Homme', 'Vêtements Femme', 'Enfant & Bébé', 'Chaussures', 'Montres & Bijoux', 'Sacs & Accessoires'],
  4: ['Téléphones', 'Ordinateurs', 'Audio & Son', 'Appareils Photo', 'Accessoires Info', 'Consoles & Jeux'],
  5: ['Meubles', 'Décoration', 'Électroménager', 'Bricolage', 'Jardin', 'Linge de maison'],
  6: ['Sports', 'Instruments de musique', 'Livres', 'Vélos', 'Voyages & Billets'],
  7: ['Fruits & Légumes', 'Plats cuisinés', 'Épicerie', 'Boissons', 'Produits frais'],
  8: ['Cours & Formations', 'Réparations', 'Déménagement', 'Événements', 'Ménage & Aide'],
  9: ['Parfums', 'Maquillage', 'Soins Visage & Corps', 'Coiffure', 'Matériel Pro'],
  10: ['Offres d\'emploi', 'Demandes d\'emploi', 'Stages', 'Intérim'],
}

const ISLANDS = ['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore', 'La Réunion']

// NOUVEAU : Suggestions de budget rapide
const BUDGET_CHIPS = [
    { label: '< 10k', min: '', max: '10000' },
    { label: '10k - 50k', min: '10000', max: '50000' },
    { label: '50k - 200k', min: '50000', max: '200000' },
    { label: '> 200k', min: '200000', max: '' },
]

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // -- FILTRES --
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tout')
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  useEffect(() => { setSelectedSubCategory('Tout') }, [selectedCategory])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
        if (favs) setFavorites(new Set(favs.map((f: any) => f.product_id)))
      }

      let query = supabase
        .from('products_with_details')
        .select('*')
        .order('is_pro', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (selectedCategory !== 0) { query = query.eq('category_id', selectedCategory); if (selectedSubCategory !== 'Tout') query = query.eq('sub_category', selectedSubCategory) }
      if (selectedIsland !== 'Tout') query = query.eq('location_island', selectedIsland)
      if (searchTerm.trim()) query = query.ilike('title', `%${searchTerm}%`)

      // Application des filtres PRIX
      if (priceMin) query = query.gte('price', parseInt(priceMin))
      if (priceMax) query = query.lte('price', parseInt(priceMax))

      const { data, error } = await query
      if (error) console.error(error)
      setProducts(data || [])
      setLoading(false)
    }
    const timer = setTimeout(init, 400)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedSubCategory, selectedIsland, searchTerm, priceMin, priceMax, supabase])

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!userId) { router.push('/auth'); return }
    if (favorites.has(productId)) {
        const newFavs = new Set(favorites); newFavs.delete(productId); setFavorites(newFavs)
        await supabase.from('favorites').delete().match({ user_id: userId, product_id: productId })
        toast.info("Retiré des favoris")
    } else {
        const newFavs = new Set(favorites); newFavs.add(productId); setFavorites(newFavs)
        await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
        toast.success("Ajouté aux favoris")
    }
  }

  const openPreview = (e: React.MouseEvent, img: string) => {
    e.preventDefault(); e.stopPropagation()
    setPreviewImage(img)
  }

  // Appliquer un budget rapide
  const applyBudget = (min: string, max: string) => {
      setPriceMin(min)
      setPriceMax(max)
  }

  const currentSubCats = selectedCategory !== 0 ? SUB_CATEGORIES[selectedCategory] : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- LIGHTBOX --- */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewImage(null)}
        >
            <button 
                onClick={() => setPreviewImage(null)} 
                className="absolute top-4 right-4 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-md"
            >
                <X size={24} />
            </button>
            <div className="relative w-full max-w-4xl h-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                 <Image src={previewImage} alt="Zoom" fill className="object-contain" />
            </div>
        </div>
      )}

      {/* --- MODALE FILTRES (NOUVEAU DESIGN) --- */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-300" onClick={() => setShowFilters(false)}>
            <div className="bg-white w-full max-w-md rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                
                {/* Header Modale */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div>
                        <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">Filtrer par prix</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Définissez votre budget en KMF</p>
                    </div>
                    <button onClick={() => {setPriceMin(''); setPriceMax('')}} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full transition active:scale-90" title="Réinitialiser">
                        <RefreshCw size={18} />
                    </button>
                </div>
                
                {/* Inputs Unifiés */}
                <div>
                    <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-mustard focus-within:ring-4 focus-within:ring-mustard/10 transition-all">
                        <div className="flex-1 px-3">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Minimum</span>
                            <input 
                                type="number" 
                                className="w-full bg-transparent outline-none font-bold text-gray-900 text-lg placeholder:text-gray-300" 
                                placeholder="0" 
                                value={priceMin} 
                                onChange={e => setPriceMin(e.target.value)} 
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-200 mx-2"></div>
                        <div className="flex-1 px-3 text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Maximum</span>
                            <input 
                                type="number" 
                                className="w-full bg-transparent outline-none font-bold text-gray-900 text-lg placeholder:text-gray-300 text-right" 
                                placeholder="Illimité" 
                                value={priceMax} 
                                onChange={e => setPriceMax(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                {/* Chips de Sélection Rapide */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Suggestions rapides</label>
                    <div className="flex flex-wrap gap-2">
                        {BUDGET_CHIPS.map((chip, idx) => {
                            const isActive = priceMin === chip.min && priceMax === chip.max
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => applyBudget(chip.min, chip.max)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                                        isActive 
                                        ? 'bg-mustard text-white border-mustard shadow-md shadow-mustard/30' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Bouton Valider */}
                <button onClick={() => setShowFilters(false)} className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
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
            
            {userId ? (
                <Link href="/compte" className="flex items-center justify-center bg-white/20 w-9 h-9 rounded-full backdrop-blur-sm hover:bg-white/30 transition shadow-sm border border-white/10">
                    <User size={18} className="text-white" />
                </Link>
            ) : (
                <Link href="/auth" className="flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition text-white text-xs font-bold shadow-sm border border-white/10">
                    Connexion
                </Link>
            )}
        </div>
        
        {/* BARRE RECHERCHE + FILTRE */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input type="text" placeholder="Que cherchez-vous ?" className="w-full bg-white p-3.5 pl-11 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-mustard/50 transition shadow-sm text-gray-900 placeholder:text-gray-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"><X size={18} /></button>}
            </div>
            
            {/* BOUTON FILTRE AVEC INDICATEUR ACTIF */}
            <button 
                onClick={() => setShowFilters(true)} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm border relative ${
                    (priceMin || priceMax) 
                    ? 'bg-mustard text-gray-900 border-mustard' 
                    : 'bg-white/20 text-white border-white/10 hover:bg-white/30'
                }`}
            >
                <SlidersHorizontal size={20} />
                {/* Petit point rouge si un filtre est actif */}
                {(priceMin || priceMax) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-mustard"></span>}
            </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 py-3 sticky top-30 z-20 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-1 min-w-17.5 p-2 rounded-xl transition active:scale-95 ${selectedCategory === cat.id ? 'bg-brand/10 text-brand font-bold border border-brand/20' : 'text-gray-500 hover:bg-gray-50'}`}><span className="text-2xl">{cat.icon}</span><span className="text-[10px] whitespace-nowrap">{cat.label}</span></button>))}
        </div>
        {currentSubCats && currentSubCats.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 mt-3 pb-1 scrollbar-hide animate-in slide-in-from-top-2 fade-in">
                <button onClick={() => setSelectedSubCategory('Tout')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap transition ${selectedSubCategory === 'Tout' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Tout voir</button>
                {currentSubCats.map(sub => (<button key={sub} onClick={() => setSelectedSubCategory(sub)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap transition ${selectedSubCategory === sub ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200'}`}>{sub}</button>))}
            </div>
        )}
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {ISLANDS.map(ile => (<button key={ile} onClick={() => setSelectedIsland(ile)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{ile}</button>))}
      </div>

      <div className="px-4 py-2 space-y-3">
        {loading ? (<div className="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2"><Loader2 className="animate-spin text-brand" size={32} /><span className="text-xs font-medium">Chargement...</span></div>) : products.length === 0 ? (<div className="text-center text-gray-400 pt-20 flex flex-col items-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Package size={32} className="opacity-30" /></div><p>Aucune annonce trouvée.</p><button onClick={() => {setSearchTerm(''); setSelectedCategory(0); setSelectedIsland('Tout'); setPriceMin(''); setPriceMax('')}} className="mt-4 text-brand font-bold text-sm hover:underline">Tout effacer</button></div>) : (
            <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                    let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    const isFav = favorites.has(product.id)
                    const isPro = product.is_pro
                    
                    return (
                        <Link 
                            key={product.id} 
                            href={`/annonce/${product.id}`} 
                            // UTILISATION DE LA COULEUR "MUSTARD" (Moutarde)
                            className={`rounded-xl overflow-hidden flex flex-col transition active:scale-[0.98] relative group ${
                                isPro 
                                ? 'bg-mustard/5 border-2 border-mustard shadow-md shadow-mustard/20 ring-2 ring-mustard/10' 
                                : 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
                            }`}
                        >
                            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                {img ? (
                                    <Image 
                                        src={img} 
                                        alt={product.title} 
                                        fill 
                                        // ✅ OPTIMISATION IMAGE : Chargement léger sur mobile
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300"><Package /></div>
                                )}
                                
                                {/* BADGE PRO : MOUTARDE */}
                                {isPro && (
                                    <div className="absolute top-2 left-2 bg-mustard text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm flex items-center gap-1">
                                        <Crown size={10} strokeWidth={3} /> PRO
                                    </div>
                                )}

                                <button onClick={(e) => toggleFavorite(e, product.id)} className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white transition active:scale-90 z-10 text-gray-500 hover:text-red-500">
                                    <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : ""} />
                                </button>
                                
                                {img && (
                                    <button 
                                        onClick={(e) => openPreview(e, img)}
                                        className="absolute bottom-2 left-2 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white text-gray-700 transition active:scale-90 z-10 hover:text-brand"
                                    >
                                        <ZoomIn size={14} />
                                    </button>
                                )}

                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded z-10 font-medium">
                                    {product.location_island}
                                </div>
                            </div>
                            
                            <div className="p-3">
                                {/* ✅ CORRECTION TITRE : 'truncate' pour empêcher l'agrandissement de la carte */}
                                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate flex items-center gap-1" title={product.title}>
                                    {product.title}
                                    {isPro && <ShieldCheck size={12} className="text-mustard fill-mustard/20 shrink-0" />}
                                </h3>
                                
                                {/* PRIX EN MOUTARDE FONCÉ POUR LES PROS */}
                                <p className={`font-extrabold text-sm ${isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                                    {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                                </p>
                                
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
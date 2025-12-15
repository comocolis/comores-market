'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  MapPin, Search, Home as HomeIcon, MessageCircle, User, Plus, 
  Car, Home, Shirt, Smartphone, Armchair, Gamepad2, Loader2, X,
  Utensils, Briefcase, Heart, UserCheck, Maximize2, Filter, LogIn,
  Image as ImageIcon 
} from 'lucide-react'

// --- UTILITAIRES ---
const formatPrice = (amount: number) => new Intl.NumberFormat('fr-KM', { style: 'currency', currency: 'KMF', maximumFractionDigits: 0 }).format(amount)

const timeAgo = (dateString: string) => { 
    const diff = new Date().getTime() - new Date(dateString).getTime(); 
    const days = Math.floor(diff / (1000 * 3600 * 24)); 
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
}

// --- DONNÉES STATIQUES ---
const CATEGORIES = [
  { label: 'Véhicules', icon: Car, id: 1 }, 
  { label: 'Immobilier', icon: Home, id: 2 }, 
  { label: 'Mode', icon: Shirt, id: 3 },
  { label: 'Tech', icon: Smartphone, id: 4 }, 
  { label: 'Maison', icon: Armchair, id: 5 }, 
  { label: 'Loisirs', icon: Gamepad2, id: 6 },
  { label: 'Alimentation', icon: Utensils, id: 7 }, 
  { label: 'Services', icon: Briefcase, id: 8 }, 
  { label: 'Beauté', icon: Heart, id: 9 }, 
  { label: 'Emploi', icon: UserCheck, id: 10 },
]

const SUB_CATEGORIES: { [key: string]: string[] } = {
  'Véhicules': ['Voitures', 'Motos', 'Pièces', 'Location', 'Camions'],
  'Immobilier': ['Vente', 'Location', 'Terrains', 'Bureaux', 'Colocation'],
  'Mode': ['Homme', 'Femme', 'Enfant', 'Chaussures', 'Montres', 'Bijoux', 'Sacs'],
  'Tech': ['Téléphones', 'Ordinateurs', 'Audio', 'Photo', 'Accessoires', 'Consoles'],
  'Maison': ['Meubles', 'Décoration', 'Electroménager', 'Bricolage', 'Jardin'],
  'Loisirs': ['Sport', 'Musique', 'Livres', 'Jeux', 'Voyage'],
  'Alimentation': ['Fruits & Légumes', 'Plats', 'Épicerie', 'Boissons', 'Desserts'],
  'Services': ['Cours', 'Réparations', 'Déménagement', 'Événements', 'Nettoyage'],
  'Beauté': ['Parfums', 'Maquillage', 'Soins', 'Coiffure'],
  'Emploi': ['Offres', 'Demandes', 'Stages', 'Intérim'],
}

export default function MarketplaceHome() {
  const supabase = createClient()
  
  // États Données
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  
  // États Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)

  // État UI
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const init = async () => {
      // 1. Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // 2. Récupérer les produits (Annonces)
      // On charge TOUT sans profiles pour éviter les bugs de liaison
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*') 
        .order('created_at', { ascending: false })

      if (error) {
          console.error("Erreur chargement produits:", error)
      } else {
          setProducts(productsData || [])
      }

      // 3. Récupérer les favoris (si connecté)
      if (user) {
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
        setFavorites(new Set(favs?.map((f: any) => f.product_id)))
      }
      
      setLoading(false)
    }
    init()
  }, [supabase])

  // --- LOGIQUE FAVORIS ---
  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation() // Empêche le clic de traverser vers le lien (au cas où)
    if (!userId) return alert("Connectez-vous pour ajouter aux favoris !")
    
    const newFavs = new Set(favorites)
    if (favorites.has(productId)) { 
        newFavs.delete(productId)
        await supabase.from('favorites').delete().match({ user_id: userId, product_id: productId }) 
    } else { 
        newFavs.add(productId)
        await supabase.from('favorites').insert({ user_id: userId, product_id: productId }) 
    }
    setFavorites(newFavs)
  }

  // --- LOGIQUE DE FILTRAGE ---
  const displayProducts = products.filter(p => {
    const content = (p.title + " " + (p.description || "")).toLowerCase()
    const matchSearch = content.includes(searchTerm.toLowerCase())
    
    const matchIsland = selectedIsland === 'Tout' || p.location_island === selectedIsland
    
    const catId = selectedCategory ? CATEGORIES.find(c => c.label === selectedCategory)?.id : null
    const matchCat = selectedCategory ? p.category_id === catId : true
    
    let matchSub = true
    if (selectedSub) {
        const keyword = selectedSub.toLowerCase().endsWith('s') ? selectedSub.toLowerCase().slice(0, -1) : selectedSub.toLowerCase()
        matchSub = content.includes(keyword) || content.includes(selectedSub.toLowerCase())
    }

    return matchSearch && matchIsland && matchCat && matchSub
  })

  const handleCategoryChange = (catLabel: string | null) => {
    if (selectedCategory === catLabel) {
        setSelectedCategory(null)
    } else {
        setSelectedCategory(catLabel)
    }
    setSelectedSub(null)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      
      {/* --- HEADER --- */}
      <header className="bg-brand sticky top-0 z-50 shadow-md pb-4 pt-safe">
        <div className="max-w-md mx-auto px-4 pt-3">
          <div className="flex items-center justify-between mb-4">
            <h1 
                className="text-2xl font-extrabold text-white tracking-tight cursor-pointer" 
                onClick={() => {handleCategoryChange(null); setSelectedIsland('Tout'); setSearchTerm('')}}
            >
                Comores<span className="text-yellow-300">Market</span>
            </h1>
            
            {userId ? (
                <Link href="/compte" className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition shadow-sm border border-white/10">
                    <User className="text-white w-5 h-5" />
                </Link>
            ) : (
                <Link href="/publier" className="flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition text-white text-xs font-bold shadow-sm border border-white/10">
                    <LogIn size={14} /> Connexion
                </Link>
            )}
          </div>

          <div className="relative group">
            <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full bg-white text-gray-800 rounded-xl py-3.5 pl-11 pr-4 shadow-sm outline-none font-medium focus:ring-2 focus:ring-white/50 transition" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500"><X size={20} /></button>
            ) : (
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            )}
          </div>
        </div>
      </header>

      {/* --- FILTRES ÎLES --- */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-28 z-40 shadow-sm">
         <div className="max-w-md mx-auto px-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore'].map((ile) => (
              <button 
                key={ile} 
                onClick={() => setSelectedIsland(ile)} 
                className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                  {ile}
              </button>
            ))}
         </div>
      </div>

      {/* --- FILTRES CATÉGORIES --- */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
                <button key={cat.label} onClick={() => handleCategoryChange(cat.label)} className="flex flex-col items-center gap-2 min-w-17.5 group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-sm border transition-all duration-300 ${selectedCategory === cat.label ? 'bg-brand text-white border-brand scale-110 shadow-brand/30' : 'bg-white text-brand border-gray-100 group-hover:border-brand/30 group-hover:bg-green-50'}`}>
                        <cat.icon size={24} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${selectedCategory === cat.label ? 'text-brand font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                </button>
            ))}
        </div>

        {selectedCategory && (
            <div className="mt-2 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-1 flex items-center gap-1 shrink-0"><Filter size={10} /> Filtres:</span>
                    <button 
                        onClick={() => setSelectedSub(null)} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${!selectedSub ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Tout
                    </button>
                    {SUB_CATEGORIES[selectedCategory]?.map((sub) => (
                        <button 
                            key={sub} 
                            onClick={() => setSelectedSub(selectedSub === sub ? null : sub)} 
                            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedSub === sub ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* --- LISTE DES PRODUITS --- */}
      <div className="max-w-md mx-auto px-3 min-h-75">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand w-8 h-8" /></div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
            {displayProducts.length === 0 ? (
                <div className="col-span-2 text-center py-20 text-gray-400 flex flex-col items-center">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Aucune annonce trouvée pour ces filtres.</p>
                    <button 
                        onClick={() => {setSelectedCategory(null); setSelectedIsland('Tout'); setSearchTerm('')}} 
                        className="text-brand font-bold text-sm mt-4 px-4 py-2 bg-brand/10 rounded-full hover:bg-brand/20 transition"
                    >
                        Tout effacer
                    </button>
                </div>
            ) : (
                displayProducts.map((product) => {
                    let imageUrl = null; 
                    try { 
                        const parsed = JSON.parse(product.images);
                        imageUrl = Array.isArray(parsed) ? parsed[0] : parsed;
                    } catch { 
                        imageUrl = product.images; 
                    }
                    
                    const isFav = favorites.has(product.id)
                    
                    return (
                        <div key={product.id} className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                            
                            {/* FAVORIS (BOUTON SÉPARÉ, PAS DANS LE LIEN) */}
                            <button 
                                onClick={(e) => toggleFavorite(e, product.id)} 
                                className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white active:scale-90 transition"
                            >
                                <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : "text-gray-400"} />
                            </button>
                            
                            {/* IMAGE (LIEN 1) */}
                            <div className="relative w-full aspect-square bg-gray-100">
                                <Link href={`/annonce/${product.id}`} className="block w-full h-full">
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                            <ImageIcon size={24} />
                                            <span className="text-[10px] mt-1">Pas d'image</span>
                                        </div>
                                    )}
                                </Link>

                                {/* ZOOM (BOUTON SÉPARÉ) */}
                                {imageUrl && (
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullScreenImage(imageUrl); }} 
                                        className="absolute bottom-2 left-2 z-20 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                                    >
                                        <Maximize2 size={14} />
                                    </button>
                                )}

                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded z-10 font-medium pointer-events-none">
                                    {product.location_island}
                                </div>
                            </div>

                            {/* INFOS (LIEN 2) */}
                            <Link href={`/annonce/${product.id}`} className="p-3 flex flex-col flex-1">
                                <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 h-10">{product.title}</h2>
                                <p className="text-brand font-extrabold text-sm mb-2">{formatPrice(product.price)}</p>
                                
                                <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                                    <div className="flex items-center gap-1 max-w-[65%]">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{product.location_city}</span>
                                    </div>
                                    <span>{timeAgo(product.created_at)}</span>
                                </div>
                            </Link>
                        </div>
                    )
                })
            )}
            </div>
        )}
      </div>

      {/* --- MODAL PLEIN ÉCRAN --- */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
            <button onClick={() => setFullScreenImage(null)} className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition z-20 backdrop-blur-md">
                <X size={24} />
            </button>
            <div className="relative w-full h-full max-h-[90vh] p-4 pointer-events-none">
                <Image src={fullScreenImage} alt="Plein écran" fill className="object-contain" priority />
            </div>
        </div>
      )}

      {/* --- NAVIGATION BAS --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
          <NavBtn icon={HomeIcon} label="Accueil" active onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} />
          <NavBtn icon={Search} label="Recherche" onClick={() => document.querySelector('input')?.focus()} />
          <div className="flex justify-center relative -top-6">
            <Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 hover:scale-105 transition-transform active:scale-95 border-4 border-white">
                <Plus strokeWidth={3} size={28} />
            </Link>
          </div>
          <Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 hover:text-gray-600 transition">
            <MessageCircle size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold">Messages</span>
          </Link>
          <Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 hover:text-gray-600 transition">
            <User size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold">Compte</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}

function NavBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition ${active ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[9px] font-bold">{label}</span>
    </button>
  )
}
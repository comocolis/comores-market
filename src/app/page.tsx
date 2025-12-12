'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  MapPin, Search, Home as HomeIcon, MessageCircle, User, Plus, 
  Car, Home, Shirt, Smartphone, Armchair, Gamepad2, Loader2, X,
  Utensils, Briefcase, Heart, UserCheck 
} from 'lucide-react'

const formatPrice = (amount: number) => new Intl.NumberFormat('fr-KM', { style: 'currency', currency: 'KMF', maximumFractionDigits: 0 }).format(amount)
const timeAgo = (dateString: string) => { const diff = new Date().getTime() - new Date(dateString).getTime(); const days = Math.floor(diff / (1000 * 3600 * 24)); return days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : `Il y a ${days} jours` }

const CATEGORIES = [
  { label: 'Véhicules', icon: Car, id: 1 }, { label: 'Immobilier', icon: Home, id: 2 }, { label: 'Mode', icon: Shirt, id: 3 },
  { label: 'Tech', icon: Smartphone, id: 4 }, { label: 'Maison', icon: Armchair, id: 5 }, { label: 'Loisirs', icon: Gamepad2, id: 6 },
  { label: 'Alimentation', icon: Utensils, id: 7 }, { label: 'Services', icon: Briefcase, id: 8 }, { label: 'Beauté', icon: Heart, id: 9 }, { label: 'Emploi', icon: UserCheck, id: 10 },
]

export default function MarketplaceHome() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIsland, setSelectedIsland] = useState('Tout')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      const { data: productsData } = await supabase.from('products').select('*, profiles(*)').eq('status', 'active').order('created_at', { ascending: false })
      setProducts(productsData || [])
      if (user) {
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
        setFavorites(new Set(favs?.map((f: any) => f.product_id)))
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    if (!userId) return alert("Connectez-vous pour ajouter aux favoris !")
    const newFavs = new Set(favorites)
    if (favorites.has(productId)) { newFavs.delete(productId); await supabase.from('favorites').delete().match({ user_id: userId, product_id: productId }) } 
    else { newFavs.add(productId); await supabase.from('favorites').insert({ user_id: userId, product_id: productId }) }
    setFavorites(newFavs)
  }

  const displayProducts = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchIsland = selectedIsland === 'Tout' || p.location_island === selectedIsland
    const matchCat = selectedCategory ? p.category_id === CATEGORIES.find(c => c.label === selectedCategory)?.id : true
    return matchSearch && matchIsland && matchCat
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-brand sticky top-0 z-50 shadow-md pb-4 pt-safe">
        <div className="max-w-md mx-auto px-4 pt-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-extrabold text-white tracking-tight cursor-pointer" onClick={() => {setSelectedCategory(null); setSelectedIsland('Tout'); setSearchTerm('')}}>Comores<span className="text-yellow-300">Market</span></h1>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><span className="text-white font-bold text-xs">KM</span></div>
          </div>
          <div className="relative group">
            <input type="text" placeholder="Rechercher..." className="w-full bg-white text-gray-800 rounded-xl py-3.5 pl-11 pr-4 shadow-sm outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm ? <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500"><X size={20} /></button> : <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />}
          </div>
        </div>
      </header>

      {/* Correction: top-25 au lieu de top-[100px] */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-25 z-40">
         <div className="max-w-md mx-auto px-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['Tout', 'Ngazidja', 'Ndzouani', 'Mwali', 'Maore'].map((ile) => (
              <button key={ile} onClick={() => setSelectedIsland(ile)} className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedIsland === ile ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>{ile}</button>
            ))}
         </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
                // Correction: min-w-17.5 au lieu de min-w-[70px]
                <button key={cat.label} onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)} className="flex flex-col items-center gap-2 min-w-17.5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-sm border transition-all ${selectedCategory === cat.label ? 'bg-brand text-white border-brand scale-110' : 'bg-green-50 text-brand border-green-100'}`}><cat.icon size={24} /></div>
                    <span className={`text-[10px] font-medium ${selectedCategory === cat.label ? 'text-brand font-bold' : 'text-gray-600'}`}>{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Correction: min-h-75 au lieu de min-h-[300px] */}
      <div className="max-w-md mx-auto px-3 min-h-75">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand" /></div> : (
            <div className="grid grid-cols-2 gap-3">
            {displayProducts.map((product) => {
                let imageUrl = null; try { imageUrl = JSON.parse(product.images)[0]; } catch { imageUrl = product.images; }
                const isFav = favorites.has(product.id)
                return (
                <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
                <button onClick={(e) => toggleFavorite(e, product.id)} className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white active:scale-90 transition"><Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-gray-500"} /></button>
                <div className="relative aspect-4/3 bg-gray-100">
                    {imageUrl ? <Image src={imageUrl} alt={product.title} fill className="object-cover" sizes="50vw" /> : <div className="flex items-center justify-center h-full text-gray-300 text-xs">Pas d'image</div>}
                    <div className="absolute bottom-1 right-1 bg-black/50 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded">{product.location_island}</div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                    <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{product.title}</h2>
                    <p className="text-brand font-extrabold text-sm mb-2">{formatPrice(product.price)}</p>
                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                    <div className="flex items-center gap-1 max-w-[70%]"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{product.location_city}</span></div>
                    <span>{timeAgo(product.created_at)}</span></div>
                </div>
                </Link>
            )})}
            </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-md">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
          <NavBtn icon={HomeIcon} label="Accueil" active onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} />
          <NavBtn icon={Search} label="Recherche" onClick={() => document.querySelector('input')?.focus()} />
          <div className="flex justify-center relative -top-6"><Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 hover:scale-105 transition-transform active:scale-95 border-4 border-white"><Plus strokeWidth={3} size={28} /></Link></div>
          <Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 hover:text-gray-600"><MessageCircle size={24} strokeWidth={2} /><span className="text-[9px] font-bold">Messages</span></Link>
          <Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 hover:text-gray-600"><User size={24} strokeWidth={2} /><span className="text-[9px] font-bold">Compte</span></Link>
        </div>
      </nav>
    </main>
  )
}

function NavBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 h-full w-full ${active ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={24} strokeWidth={active ? 2.5 : 2} /><span className="text-[9px] font-bold">{label}</span></button>
  )
}
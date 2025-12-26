'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Trash2, MapPin, Loader2, Plus, ArrowLeft, Pencil, 
  BarChart3, AlertTriangle, ChevronRight, Sparkles, ShoppingBag 
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function MesAnnoncesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, productId: string | null }>({
      isOpen: false, productId: null
  })

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setProducts(productsData || [])

      const { data: statsData } = await supabase.rpc('get_my_products_stats', { uid: user.id })
      if (statsData) {
        const statsMap: Record<string, number> = {}
        statsData.forEach((s: any) => { statsMap[s.product_id] = s.view_count })
        setStats(statsMap)
      }
      setLoading(false)
    }
    getData()
  }, [supabase, router])

  const confirmDelete = (id: string) => {
      setDeleteModal({ isOpen: true, productId: id })
  }

  const handleDelete = async () => {
    const id = deleteModal.productId
    if (!id) return
    setProducts(products.filter(p => p.id !== id))
    setDeleteModal({ isOpen: false, productId: null })
    
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
        toast.error("Erreur lors de la suppression")
        window.location.reload()
    } else {
        toast.success("Annonce supprimée")
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-32 font-sans text-gray-900">
      
      {/* --- MODALE SUPPRESSION PRESTIGE --- */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setDeleteModal({ isOpen: false, productId: null })}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center border border-white" onClick={e => e.stopPropagation()}
              >
                  <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner text-red-500">
                      <AlertTriangle size={36} />
                  </div>
                  <h3 className="font-black text-xl mb-2 tracking-tight">Supprimer l'offre ?</h3>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">Cette action effacera définitivement l'annonce de la plateforme.</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={handleDelete} className="w-full py-4 rounded-2xl font-black text-white bg-red-600 active:scale-95 transition shadow-lg shadow-red-500/20 uppercase text-xs tracking-widest">Confirmer</button>
                      <button onClick={() => setDeleteModal({ isOpen: false, productId: null })} className="w-full py-4 rounded-2xl font-black text-gray-400 bg-[#F5F7F9] active:scale-95 transition uppercase text-xs tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER MASTER TEMPLATE --- */}
      <div className="bg-brand pt-safe px-4 pb-8 sticky top-0 z-40 shadow-md rounded-b-[2.5rem]">
        <div className="flex justify-between items-center pt-2 px-2">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition">
                    <ArrowLeft size={22} />
                </button>
                <div>
                  <h1 className="text-white font-black text-2xl tracking-tight">Mes Annonces</h1>
                  <div className="flex items-center gap-1.5 opacity-60">
                      <Sparkles size={10} className="text-white" fill="currentColor" />
                      <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Tableau de bord</p>
                  </div>
                </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <ShoppingBag size={14} className="text-white" />
                <span className="text-xs font-black text-white">{products.length}</span>
            </div>
        </div>
      </div>

      <div className="p-5 space-y-5 max-w-lg mx-auto">
        {loading ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" size={32} /></div>
        ) : products.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-white">
                  <ShoppingBag size={40} className="opacity-10" />
                </div>
                <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-8">Vous n'avez aucune offre active</p>
                <Link href="/publier" className="bg-brand text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-brand/20 active:scale-95 transition-all text-sm uppercase tracking-widest">
                    <Plus size={20} /> Créer une annonce
                </Link>
            </div>
        ) : (
            products.map((product, idx) => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const views = stats[product.id] || 0

                return (
                    <motion.div 
                      key={product.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-[2.2rem] shadow-sm border border-white overflow-hidden group"
                    >
                        <div className="p-4 flex gap-4">
                            <Link href={`/annonce/${product.id}`} className="w-24 h-24 bg-gray-50 rounded-[1.5rem] relative overflow-hidden shrink-0 shadow-inner group-active:scale-95 transition-transform duration-500">
                                {img && <Image src={img} alt="" fill className="object-cover" />}
                            </Link>

                            <div className="flex-1 min-w-0 flex flex-col py-1">
                                <Link href={`/annonce/${product.id}`}>
                                  <h3 className="font-black text-gray-900 text-[15px] truncate group-hover:text-brand transition tracking-tight">{product.title}</h3>
                                </Link>
                                <p className="text-brand font-black text-lg mt-0.5">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-auto uppercase font-black tracking-widest">
                                    <MapPin size={12} className="text-brand/40" /> {product.location_city}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link href={`/modifier/${product.id}`} className="p-3 text-blue-500 bg-blue-50/50 rounded-2xl hover:bg-blue-100 transition active:scale-90">
                                    <Pencil size={18} />
                                </Link>
                                <button onClick={() => confirmDelete(product.id)} className="p-3 text-red-500 bg-red-50/50 rounded-2xl hover:bg-red-100 transition active:scale-90">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* SECTION STATISTIQUES */}
                        <Link 
                            href={`/mes-annonces/${product.id}/vues`}
                            className="flex items-center justify-between bg-[#F5F7F9] px-5 py-3.5 active:bg-gray-100 transition"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                  <BarChart3 size={14} className="text-brand" />
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-gray-900">{views}</span>
                                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">vues</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-brand font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 transition">
                                Analyser <ChevronRight size={12} />
                            </div>
                        </Link>
                    </motion.div>
                )
            })
        )}
      </div>
    </div>
  )
}
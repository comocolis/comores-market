'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, MapPin, Loader2, Plus, ArrowLeft, Pencil, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* MODALE SUPPRESSION */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteModal({ isOpen: false, productId: null })}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 text-red-600">
                    <div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={24} /></div>
                    <h3 className="font-bold text-lg">Supprimer l'annonce ?</h3>
                </div>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setDeleteModal({ isOpen: false, productId: null })} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Annuler</button>
                    <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600">Supprimer</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-gray-900">Mes Annonces</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>
        ) : products.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <p className="mb-4">Aucune annonce publiée.</p>
                <Link href="/publier" className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand/20">
                    <Plus size={20} /> Publier maintenant
                </Link>
            </div>
        ) : (
            products.map(product => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const views = stats[product.id] || 0

                return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-3 flex gap-3">
                            {/* CLIC SUR IMAGE/TITRE -> VOIR L'ANNONCE */}
                            <Link href={`/annonce/${product.id}`} className="flex flex-1 gap-3 min-w-0 group">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl relative overflow-hidden shrink-0 group-active:scale-95 transition">
                                    {img && <Image src={img} alt="" fill className="object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col py-1">
                                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-brand transition">{product.title}</h3>
                                    <p className="text-brand font-black text-sm">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-auto uppercase font-bold tracking-wider">
                                        <MapPin size={10} /> {product.location_city}
                                    </div>
                                </div>
                            </Link>

                            <div className="flex flex-col gap-2">
                                <Link href={`/modifier/${product.id}`} className="p-2.5 text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition active:scale-90">
                                    <Pencil size={18} />
                                </Link>
                                <button onClick={() => confirmDelete(product.id)} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition active:scale-90">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* CLIC SUR LES VUES -> VOIR LES VISITEURS */}
                        <Link 
                            href={`/mes-annonces/${product.id}/vues`}
                            className="flex items-center justify-between bg-gray-50/80 px-4 py-2.5 border-t border-gray-50 active:bg-gray-100 transition"
                        >
                            <div className="flex items-center gap-2">
                                <BarChart3 size={14} className="text-brand" />
                                <span className="text-xs font-bold text-gray-700">{views}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">vues uniques</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-brand font-bold uppercase tracking-tighter">
                                Détails <ChevronRight size={12} />
                            </div>
                        </Link>
                    </div>
                )
            })
        )}
      </div>
    </div>
  )
}
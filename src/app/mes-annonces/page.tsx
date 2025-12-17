'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, MapPin, Loader2, Plus, ArrowLeft, Eye, BarChart3 } from 'lucide-react' // Ajout de BarChart3
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function MesAnnoncesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, number>>({}) // Stocke les vues par ID produit
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }

      // 1. Récupérer les produits
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setProducts(productsData || [])

      // 2. Récupérer les stats via la fonction RPC
      const { data: statsData, error } = await supabase.rpc('get_my_products_stats', { uid: user.id })
      
      if (statsData) {
        // Transformation en objet { product_id: count } pour accès rapide
        const statsMap: Record<string, number> = {}
        statsData.forEach((s: any) => { statsMap[s.product_id] = s.view_count })
        setStats(statsMap)
      }

      setLoading(false)
    }
    getData()
  }, [supabase, router])

  const deleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return
    
    // Optimistic update
    setProducts(products.filter(p => p.id !== id))
    
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
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-gray-900">Mes Annonces</h1>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>
        ) : products.length === 0 ? (
            <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                <p className="mb-4">Vous n'avez aucune annonce.</p>
                <Link href="/publier" className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                    <Plus size={20} /> Publier maintenant
                </Link>
            </div>
        ) : (
            products.map(product => {
                let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                const views = stats[product.id] || 0 // Nombre de vues (0 par défaut)

                return (
                    <div key={product.id} className="bg-white p-3 rounded-xl flex gap-3 shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
                            {img && <Image src={img} alt="" fill className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                                <p className="text-brand font-extrabold">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                            </div>
                            
                            {/* AFFICHAGE DES VUES */}
                            <div className="flex items-center gap-3 text-xs mt-1">
                                <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                    <BarChart3 size={12} className="text-brand" />
                                    <span className="font-bold text-gray-700">{views}</span> vues
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <MapPin size={12} /> {product.location_city}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between items-end gap-2">
                             {/* Bouton Modifier (Lien vers /modifier/[id]) */}
                            <Link href={`/modifier/${product.id}`} className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-lg">
                                <Eye size={18} />
                            </Link>
                            <button onClick={() => deleteProduct(product.id)} className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                    </div>
                )
            })
        )}
      </div>
    </div>
  )
}
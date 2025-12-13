'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Users, ShoppingBag, Shield, CheckCircle, XCircle, Trash2, Search, TrendingUp } from 'lucide-react'
import Image from 'next/image'

// ⚠️ SÉCURITÉ : Mettez VOTRE email ici
const ADMIN_EMAIL = "abdesisco1@gmail.com" 

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'products'>('users')
  
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalPro: 0 })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Sécurité : Si pas connecté ou pas le bon email -> Dehors !
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      
      await fetchData()
      setLoading(false)
    }
    checkAdmin()
  }, [router, supabase])

  const fetchData = async () => {
    // Récupérer les profils
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(profiles || [])

    // Récupérer les produits
    const { data: prods } = await supabase.from('products').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
    setProducts(prods || [])

    // Calculer les stats
    setStats({
        totalUsers: profiles?.length || 0,
        totalProducts: prods?.length || 0,
        totalPro: profiles?.filter((p: any) => p.is_pro).length || 0
    })
  }

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
    if(!confirm(`Voulez-vous ${currentStatus ? 'retirer' : 'donner'} le statut PRO ?`)) return
    
    const { error } = await supabase.from('profiles').update({ is_pro: !currentStatus }).eq('id', userId)
    
    if (error) alert("Erreur : " + error.message)
    else {
        setUsers(users.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u))
    }
  }

  const deleteProduct = async (productId: string) => {
    if(!confirm("Supprimer cette annonce définitivement ?")) return
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) alert("Erreur : " + error.message)
    else setProducts(products.filter(p => p.id !== productId))
  }

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone_number?.includes(searchTerm))
  const filteredProducts = products.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-gray-900 text-white p-6 pt-safe pb-12 rounded-b-[2rem] shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Shield className="text-brand" /> Back-Office Admin</h1>
        <p className="text-gray-400 text-sm">Gérez votre business Comores Market.</p>
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10 text-center">
                <div className="text-2xl font-bold text-brand">{stats.totalUsers}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Utilisateurs</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalPro}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Vendeurs Pro</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10 text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.totalProducts}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Annonces</div>
            </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white p-2 rounded-xl shadow-sm flex mb-6">
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'users' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><Users size={16} /> Utilisateurs</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'products' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><ShoppingBag size={16} /> Annonces</button>
        </div>

        <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher..." className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {activeTab === 'users' ? (
            <div className="space-y-3">
                {filteredUsers.map(u => (
                    <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 overflow-hidden relative">
                                {u.avatar_url ? <Image src={u.avatar_url} alt="" fill className="object-cover" /> : u.full_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">{u.full_name || 'Sans nom'}</p>
                                <p className="text-xs text-gray-400">{u.phone_number || 'Pas de tél'}</p>
                                <p className="text-[10px] text-gray-300">{u.city} • {u.island}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleProStatus(u.id, u.is_pro)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${u.is_pro ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                        >
                            {u.is_pro ? 'VENDEUR PRO' : 'STANDARD'}
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-3">
                {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 relative overflow-hidden">
                             {/* Petit hack pour l'image */}
                             <Image src={JSON.parse(p.images || '[]')[0] || '/placeholder.png'} alt="" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                            <p className="text-xs text-brand font-bold">{p.price} KMF</p>
                            <p className="text-[10px] text-gray-400 mt-1">Vendeur : {p.profiles?.full_name}</p>
                        </div>
                        <button onClick={() => deleteProduct(p.id)} className="bg-red-50 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:bg-red-100"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
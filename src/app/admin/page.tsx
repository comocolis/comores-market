'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Users, ShoppingBag, ShieldCheck, Search, Trash2, LogOut, User, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // ✅ VOTRE EMAIL (On nettoiera la casse et les espaces lors de la vérification)
  const ADMIN_EMAIL = "abdesisco1@gmail.com" 

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products'>('dashboard')
  
  const [stats, setStats] = useState({ users: 0, products: 0, pro: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Sécurité : On compare les emails en minuscules et sans espaces
      const currentEmail = user?.email?.toLowerCase().trim()
      const adminEmail = ADMIN_EMAIL.toLowerCase().trim()

      if (!user || currentEmail !== adminEmail) {
        toast.error("Accès réservé à l'administrateur.")
        router.push('/compte') 
        return
      }

      await fetchData()
      setLoading(false)
    }
    checkAdmin()
  }, [router, supabase])

  const fetchData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: items } = await supabase.from('products').select('*, profiles(full_name)').order('created_at', { ascending: false })

    if (profiles && items) {
        setUsers(profiles)
        setProducts(items)
        setStats({
            users: profiles.length,
            products: items.length,
            pro: profiles.filter(p => p.is_pro).length
        })
    }
  }

  // --- ACTIONS ---

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_pro: !currentStatus }).eq('id', userId)
    if (error) toast.error("Erreur")
    else {
        toast.success(currentStatus ? "Compte rétrogradé" : "Compte passé PRO !")
        fetchData()
    }
  }

  // NOUVEAU : Pouvoir de bannir
  const toggleBanUser = async (userId: string, currentBan: boolean) => {
    if (!confirm(currentBan ? "Débannir cet utilisateur ?" : "BANNIR cet utilisateur ? Il ne pourra plus se connecter.")) return

    const { error } = await supabase.from('profiles').update({ is_banned: !currentBan }).eq('id', userId)
    if (error) toast.error("Erreur")
    else {
        toast.success(currentBan ? "Utilisateur débanni" : "Utilisateur BANNI 🚫")
        fetchData()
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Supprimer cette annonce ?")) return
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) toast.error("Erreur")
    else {
        toast.success("Annonce supprimée")
        fetchData()
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* HEADER */}
      <div className="bg-gray-900 text-white p-6 pt-safe shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-brand" /> Admin
                </h1>
                <p className="text-gray-400 text-xs mt-1">Super Admin : {ADMIN_EMAIL}</p>
            </div>
            <Link href="/compte" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
                <LogOut size={20} />
            </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'users' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Utilisateurs</button>
            <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'products' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Annonces</button>
        </div>
      </div>

      <div className="p-4">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={20} /></div>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.users}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Utilisateurs</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3"><ShoppingBag size={20} /></div>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.products}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Annonces</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2 flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-extrabold text-gray-900">{stats.pro}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase">Comptes PRO</p>
                    </div>
                    <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center text-yellow-600"><ShieldCheck size={20} /></div>
                </div>
            </div>
        )}

        {/* UTILISATEURS */}
        {activeTab === 'users' && (
            <div className="space-y-4">
                <div className="relative">
                    <input type="text" placeholder="Rechercher un nom..." className="w-full bg-white p-3 rounded-xl shadow-sm pl-10 text-sm outline-none" onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                </div>
                {users.filter(u => (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map(u => (
                    <div key={u.id} className={`bg-white p-4 rounded-xl shadow-sm border ${u.is_banned ? 'border-red-500 bg-red-50' : 'border-gray-100'} flex flex-col gap-3`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {u.avatar_url ? <Image src={u.avatar_url} alt="" width={40} height={40} /> : <User size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900 flex items-center gap-1">
                                    {u.full_name}
                                    {u.is_pro && <ShieldCheck size={12} className="text-green-500" />}
                                    {u.is_banned && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded">BANNI</span>}
                                </p>
                                <p className="text-[10px] text-gray-400">{u.email}</p>
                            </div>
                        </div>
                        
                        {/* BOUTONS D'ACTION */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <button 
                                onClick={() => toggleProStatus(u.id, u.is_pro)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${u.is_pro ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}
                            >
                                {u.is_pro ? 'Retirer Pro' : 'Passer Pro'}
                            </button>
                            <button 
                                onClick={() => toggleBanUser(u.id, u.is_banned)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${u.is_banned ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-600'}`}
                            >
                                {u.is_banned ? 'Débannir' : 'Bannir'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* ANNONCES */}
        {activeTab === 'products' && (
            <div className="space-y-4">
                {products.map(p => {
                    let img = null; try { img = JSON.parse(p.images)[0] } catch {}
                    return (
                        <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 relative overflow-hidden">
                                {img && <Image src={img} alt="" fill className="object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                                <p className="text-xs text-gray-500">{p.profiles?.full_name}</p>
                                <p className="text-brand font-bold text-xs mt-1">{p.price} KMF</p>
                            </div>
                            <button 
                                onClick={() => deleteProduct(p.id)}
                                className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 self-center"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )
                })}
            </div>
        )}

      </div>
    </div>
  )
}